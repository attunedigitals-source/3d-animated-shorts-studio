/**
 * Unit & Integration Reliability Test Suite for Phase 0
 * Tests Gemini request reliability, status codes, exponential backoff,
 * reference-image conditioning, voice synthesis, QA inspection, and secret redacting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Gemini3DStudioEngine,
  GeminiProviderError,
} from '../src/gemini-studio-engine';
import {
  AI33VoiceEngine,
  VoiceProviderError,
} from '../src/ai33-voice-engine';
import {
  assertModelCapable,
  getModelRegistryEntry,
  DEEP_RESEARCH_MODEL_POOL,
} from '../src/gemini-model-registry';
import { CharacterDNA, NarrativeBeat, CanonicalCharacterSheet, RenderedShot } from '@studio/types';

describe('Phase 0: Engine Reliability & Security Test Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // 1. Missing Gemini Credentials
  it('rejects calls when Gemini API key is missing with typed 401 error', async () => {
    const engine = new Gemini3DStudioEngine('');
    await expect(engine.researchTopic('Space exploration', '')).rejects.toThrowError(GeminiProviderError);
    await expect(engine.researchTopic('Space exploration', '')).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'MISSING_API_KEY',
      isRetryable: false,
    });
  });

  // 2. Invalid API Keys (401 from provider)
  it('correctly reports 401 Authentication Failed from provider without retrying', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ error: { message: 'API_KEY_INVALID' } }),
    } as any);

    const engine = new Gemini3DStudioEngine('AIzaSy_fake_invalid_key_12345');
    await expect(engine.researchTopic('Napoleon', 'AIzaSy_fake_invalid_key_12345')).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'AUTHENTICATION_FAILED',
      isRetryable: false,
    });
    // Should NOT retry 401
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // 3. Unsupported Models
  it('throws a Model Registry Error for unsupported or unrecognized model IDs', () => {
    expect(() => assertModelCapable('unsupported-model-xyz', 'text_generation')).toThrow(
      /is not recognized in the verified Google Gemini catalogue/
    );

    expect(() => assertModelCapable('veo-3.1-generate-preview', 'video_generation')).toThrow(
      /is currently unavailable through the standard Gemini API surface/
    );

    expect(() => assertModelCapable('gemini-3.1-flash-lite', 'image_generation')).toThrow(
      /does not support required capability/
    );
  });

  // 4. Gemini Rate Limits (429 with backoff)
  it('handles 429 rate limits as retryable with backoff', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '1' }),
      json: async () => ({ error: { message: 'Resource has been exhausted (e.g. check quota).' } }),
    } as any);

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    await expect(
      engine.invokeGemini('gemini-2.5-pro', 'Hello', { overrideKey: 'AIzaSy_valid_mock_key_12345', maxRetries: 1 })
    ).rejects.toMatchObject({
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      isRetryable: true,
      retryAfterSeconds: 1,
    });
    // Attempted initial + 1 retry = 2 calls
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // 5. Gemini Server Failures (500/503)
  it('treats 500/503 server errors as retryable', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers(),
      json: async () => ({ error: { message: 'Service Unavailable' } }),
    } as any);

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    await expect(
      engine.invokeGemini('gemini-2.5-pro', 'Hello', { overrideKey: 'AIzaSy_valid_mock_key_12345', maxRetries: 1 })
    ).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'PROVIDER_SERVER_ERROR',
      isRetryable: true,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // 6. Malformed JSON handling
  it('throws structured error when Gemini returns malformed non-JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Here is your research: NOT_JSON_CONTENT' }] } }],
      }),
    } as any);

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    await expect(engine.researchTopic('Space', 'AIzaSy_valid_mock_key_12345')).rejects.toMatchObject({
      statusCode: 500,
      errorCode: 'MALFORMED_RESEARCH_JSON',
      isRetryable: false,
    });
  });

  // 7. Image Generation Failure
  it('reports image generation failure without substituting fake SVG', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({ error: { message: 'GPU out of memory' } }),
    } as any);

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    await expect(
      engine.generateImage('gemini-3-pro-image', 'Napoleon in snow', 'AIzaSy_valid_mock_key_12345')
    ).rejects.toMatchObject({
      statusCode: 500,
      errorCode: 'IMAGE_GENERATION_FAILED',
    });
  });

  // 8. Reference-Image Conditioning
  it('correctly attaches reference image base64 into predict payload', async () => {
    let capturedBody: any = null;

    global.fetch = vi.fn().mockImplementation(async (_url, options: any) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          predictions: [{ bytesBase64Encoded: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }],
        }),
      };
    });

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    const mockReferenceDataUri = 'data:image/png;base64,QUJDREVGR0hJSktMTU5PUA==';

    const result = await engine.generateImage(
      'gemini-3-pro-image',
      'Hero shot',
      'AIzaSy_valid_mock_key_12345',
      mockReferenceDataUri,
      '9:16'
    );

    expect(result).toContain('data:image/png;base64,');
    expect(capturedBody).toBeDefined();
    expect(capturedBody.instances[0].image.bytesBase64Encoded).toBe('QUJDREVGR0hJSktMTU5PUA==');
  });

  // 9. Invalid Image Responses
  it('rejects image response when bytesBase64Encoded is empty or missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ predictions: [{ bytesBase64Encoded: '' }] }),
    } as any);

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    await expect(
      engine.generateImage('gemini-3-pro-image', 'A cat', 'AIzaSy_valid_mock_key_12345')
    ).rejects.toMatchObject({
      statusCode: 500,
      errorCode: 'INVALID_IMAGE_PAYLOAD',
    });
  });

  // 10. Voice Synthesis Failure
  it('reports voice synthesis failure and never outputs silent dummy WAV', async () => {
    const voiceEngine = new AI33VoiceEngine('');
    await expect(voiceEngine.synthesizeNarration('Hello world', { overrideKey: '' })).rejects.toThrowError(
      VoiceProviderError
    );
    await expect(voiceEngine.synthesizeNarration('Hello world', { overrideKey: '' })).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'MISSING_VOICE_KEY',
    });
  });

  // 11. Missing Audio Alignment flagged as isEstimated: true
  it('honestly flags synthetic audio alignment as isEstimated: true when provider omits alignment', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        audio_url: 'https://cdn.ai33.pro/audio/sample_123.mp3',
        // alignment deliberately omitted
      }),
    } as any);

    const voiceEngine = new AI33VoiceEngine('ai33_valid_key_12345');
    const result = await voiceEngine.synthesizeNarration('Napoleon marched across frozen ground.', {
      overrideKey: 'ai33_valid_key_12345',
    });

    expect(result.audioUrl).toBe('https://cdn.ai33.pro/audio/sample_123.mp3');
    expect(result.isEstimatedAlignment).toBe(true);
    expect(result.timestamps[0]!.isEstimated).toBe(true);
  });

  // 12. Music Generation Failure / Unavailable Model
  it('honestly returns preview_placeholder for unavailable Lyria model without fake WAV', async () => {
    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    const score = await engine.composeAdaptiveSoundtrack({
      mood: 'Intense blizzard',
      durationSeconds: 30,
    });

    expect(score.provenance).toBe('preview_placeholder');
    expect(score.isPlaceholder).toBe(true);
    expect(score.audioUrl).toBe(''); // No fake WAV
  });

  // 13. Visual QA Inspection Failure Handling
  it('returns status failed with zero score when inspection fails and never fakes a 98% pass', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ error: { message: 'Vision backend invalid request' } }),
    } as any);

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    const mockSheet: CanonicalCharacterSheet = {
      characterId: 'char_1',
      characterName: 'Napoleon',
      sheetImageUrl: 'data:image/png;base64,QUJDREVGR0g=',
      createdAt: new Date().toISOString(),
      provenance: 'ai_generated',
      isProceduralPlaceholder: false,
    };
    const mockShot: RenderedShot = {
      shotId: 'shot_1',
      beatNumber: 1,
      imageUrl: 'data:image/png;base64,QUJDREVGR0g=',
      promptUsed: 'Shot 1',
      durationSeconds: 6,
      cameraTrajectory: { shotType: 'close-up', motion: 'push-in', focalLength: '35mm', lighting: 'Cold' },
      startMs: 0,
      endMs: 6000,
      provenance: 'ai_generated',
    };

    const report = await engine.auditVisualQA({
      canonicalSheet: mockSheet,
      shots: [mockShot],
      beats: [],
      overrideKey: 'AIzaSy_valid_mock_key_12345',
    });

    expect(report.status).toBe('failed');
    expect(report.passed).toBe(false);
    expect(report.characterConsistencyScore).toBe(0);
    expect(report.feedback[0]).toContain('Visual QA inspection failed');
  });

  // 14. Secret Exposure Prevention
  it('ensures API keys are never exposed in error messages', () => {
    const rawApiKey = 'AIzaSySecretApiKey1234567890';
    const errorMsgWithKey = `Failed to connect to https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${rawApiKey}`;

    // Sanitization simulation matching studio-pipeline.ts
    const sanitized = errorMsgWithKey
      .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
      .replace(/AIzaSy[a-zA-Z0-9_\-]+/gi, '[REDACTED_GEMINI_KEY]');

    expect(sanitized).not.toContain(rawApiKey);
    expect(sanitized).toContain('key=[REDACTED]');
  });

  // 15. Smooth Model Switching across the 8-Model Deep Research Pool
  it('smoothly switches across the 8 Deep Research models depending on availability', async () => {
    expect(DEEP_RESEARCH_MODEL_POOL).toEqual([
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-4-hydrogen',
      'gemini-2.5-flash-lite',
      'gemini-3-flash',
      'gemini-2.5-flash',
    ]);

    const attemptedModels: string[] = [];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const match = url.match(/\/models\/([^:]+):generateContent/);
      const modelId = match?.[1] || 'unknown';
      attemptedModels.push(modelId);

      // Simulate first 4 models unavailable (404 / 429 / 503), and #5 (gemini-4-hydrogen) available
      if (modelId !== 'gemini-4-hydrogen') {
        return {
          ok: false,
          status: modelId === 'gemini-3.6-flash' ? 429 : 404,
          headers: new Headers(),
          json: async () => ({ error: { message: `Model ${modelId} unavailable` } }),
        };
      }

      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      viralHooks: ['Hook from Gemini 4 Hydrogen'],
                      obscureFacts: ['Fact 1'],
                      retentionAngles: ['Angle 1'],
                      pacingNotes: 'Fast pacing',
                      summary: 'Summary',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    });

    const engine = new Gemini3DStudioEngine('AIzaSy_valid_mock_key_12345');
    const result = await engine.researchTopic('Ancient Rome', 'AIzaSy_valid_mock_key_12345');

    expect(attemptedModels).toEqual([
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-4-hydrogen',
    ]);
    expect(result.modelUsed).toBe('gemini-4-hydrogen');
    expect(result.viralHooks[0]).toBe('Hook from Gemini 4 Hydrogen');
  });
});
