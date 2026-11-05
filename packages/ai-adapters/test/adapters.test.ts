import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  extractAndValidateJson,
  MockAIAdapter,
  OpenRouterAIAdapter,
  DEFAULT_OPENROUTER_FREE_MODELS,
  getAvailableFreeModels,
  getAIAdapter,
  MockVoiceAdapter,
  getVoiceAdapter,
} from '../src';

describe('AI Adapters & JSON Parser', () => {
  describe('extractAndValidateJson', () => {
    const TestSchema = z.object({
      name: z.string(),
      score: z.number(),
    });

    it('should parse raw JSON string', () => {
      const raw = '{"name": "Shorts Studio", "score": 99}';
      const parsed = extractAndValidateJson(raw, TestSchema);
      expect(parsed).toEqual({ name: 'Shorts Studio', score: 99 });
    });

    it('should strip markdown code fences', () => {
      const raw = '```json\n{"name": "Shorts Studio", "score": 100}\n```';
      const parsed = extractAndValidateJson(raw, TestSchema);
      expect(parsed.name).toBe('Shorts Studio');
      expect(parsed.score).toBe(100);
    });

    it('should extract JSON from conversational text', () => {
      const raw = 'Here is your requested output:\n\n{"name": "Extracted", "score": 50}\n\nHope this helps!';
      const parsed = extractAndValidateJson(raw, TestSchema);
      expect(parsed.name).toBe('Extracted');
    });

    it('should throw clear error on schema mismatch', () => {
      const raw = '{"name": "Bad", "score": "not-a-number"}';
      expect(() => extractAndValidateJson(raw, TestSchema)).toThrowError(/schema/i);
    });
  });

  describe('MockAIAdapter', () => {
    const adapter = new MockAIAdapter();

    it('should return health check', async () => {
      const check = await adapter.testConnection();
      expect(check.connected).toBe(true);
      expect(check.provider).toBe('mock');
    });

    it('should generate an original story conforming to StoryDocumentSchema', async () => {
      const res = await adapter.generateStory({
        topic: 'A space hamster stealing moon cheese',
        targetDurationSeconds: 30,
        category: 'Sci-Fi',
        intendedAudience: 'General',
        tone: 'Humorous',
        visualStyle: 'Stylized 3D',
        language: 'English',
      });

      expect(res.story.title).toBeTruthy();
      expect(res.story.logline).toContain('moon cheese');
      expect(res.story.characterDescriptions.length).toBeGreaterThan(0);
      expect(res.metadata.status).toBe('success');
    });

    it('should generate a narration script matching target duration', async () => {
      const storyRes = await adapter.generateStory({
        topic: 'A space hamster',
        targetDurationSeconds: 30,
        category: 'Sci-Fi',
        intendedAudience: 'General',
        tone: 'Humorous',
        visualStyle: 'Stylized 3D',
        language: 'English',
      });

      const scriptRes = await adapter.generateScript(storyRes.story, 30);
      expect(scriptRes.script.scenes.length).toBeGreaterThan(1);
      expect(scriptRes.script.totalEstimatedDurationSeconds).toBe(30);
      expect(scriptRes.script.scenes[0]!.dialogue).toBeDefined();
    });

    it('should break down script into structured 3D scenes', async () => {
      const storyRes = await adapter.generateStory({
        topic: 'A space hamster',
        targetDurationSeconds: 30,
        category: 'Sci-Fi',
        intendedAudience: 'General',
        tone: 'Humorous',
        visualStyle: 'Stylized 3D',
        language: 'English',
      });
      const scriptRes = await adapter.generateScript(storyRes.story, 30);
      const scenesRes = await adapter.breakdownScenes(scriptRes.script, storyRes.story);

      expect(scenesRes.scenes.length).toBe(scriptRes.script.scenes.length);
      expect(scenesRes.scenes[0]!.environmentDescription).toBeTruthy();
      expect(scenesRes.scenes[0]!.cameraDirectionSuggestions).toBeTruthy();
      expect(scenesRes.scenes[0]!.propsRequired.length).toBeGreaterThan(0);
    });
  });

  describe('OpenRouter Free Models & Automatic Fallback', () => {
    it('should have a curated list of verified free models', () => {
      expect(DEFAULT_OPENROUTER_FREE_MODELS.length).toBeGreaterThanOrEqual(5);
      expect(DEFAULT_OPENROUTER_FREE_MODELS.every((m) => m.endsWith(':free'))).toBe(true);
      expect(DEFAULT_OPENROUTER_FREE_MODELS[0]).toBe('meta-llama/llama-3.3-70b-instruct:free');
    });

    it('should return available free models list', async () => {
      const freeModels = await getAvailableFreeModels();
      expect(freeModels.length).toBeGreaterThanOrEqual(5);
      expect(freeModels).toContain('meta-llama/llama-3.3-70b-instruct:free');
      expect(freeModels).toContain('google/gemini-2.0-flash-exp:free');
    });

    it('should instantiate OpenRouterAIAdapter with provider openrouter', () => {
      const adapter = new OpenRouterAIAdapter();
      expect(adapter.providerName).toBe('openrouter');
    });

    it('should reject connection test when API key is missing', async () => {
      const adapter = new OpenRouterAIAdapter();
      const res = await adapter.testConnection({ apiKey: '' });
      expect(res.connected).toBe(false);
      expect(res.message).toMatch(/not configured/i);
    });
  });

  describe('getAIAdapter factory', () => {
    it('should return MockAIAdapter when mockAi is true', () => {
      const adapter = getAIAdapter({ mockAi: true });
      expect(adapter.providerName).toBe('mock');
    });

    it('should fallback to MockAIAdapter if API key is placeholder', () => {
      const adapter = getAIAdapter({ provider: 'openrouter', apiKey: 'placeholder' });
      expect(adapter.providerName).toBe('mock');
    });
  });

  describe('Voice Adapters (ai33.pro unified & mock)', () => {
    const voiceAdapter = new MockVoiceAdapter();

    it('should test connection successfully', async () => {
      const res = await voiceAdapter.testConnection();
      expect(res.connected).toBe(true);
    });

    it('should synthesize single speaker speech with duration estimate', async () => {
      const res = await voiceAdapter.synthesizeSpeech({
        voice_id: 'minimax_male-qn-qingse',
        text: 'This is a test speech line for our 3D animated character.',
        speed: 1.0,
      });

      expect(res.durationSeconds).toBeGreaterThan(0);
      expect(res.taskId).toContain('mock-task');
      expect(res.format).toBe('mp3');
    });

    it('should synthesize multi-speaker dialogue with speaker pauses', async () => {
      const res = await voiceAdapter.synthesizeDialogue({
        text: 'A> Hello there Barnaby!\nB> Greetings Chef Bot!',
        speakers: [
          { voice_id: 'minimax_male-qn-qingse', speed: 1.0 },
          { voice_id: 'elevenlabs_hpp4J3VqNfWAUOO0d1Us', speed: 1.0 },
        ],
        delay: 0.5,
      });

      expect(res.durationSeconds).toBeGreaterThan(0);
      expect(res.taskId).toContain('mock-dialogue-task');
    });

    it('should list normalized voice library models with filtering', async () => {
      const all = await voiceAdapter.listVoices();
      expect(all.length).toBeGreaterThanOrEqual(4);

      const minimaxOnly = await voiceAdapter.listVoices({ provider: 'minimax' });
      expect(minimaxOnly.every((v) => v.voice_id.startsWith('minimax_'))).toBe(true);
    });

    it('should fallback to MockVoiceAdapter via factory when API key is placeholder', () => {
      const adapter = getVoiceAdapter({ provider: 'ai33', apiKey: 'placeholder_key' });
      expect(adapter.providerName).toBe('mock');
    });
  });
});

