/**
 * Pure Gemini 3D Studio API Routes (Phase 0 Repaired)
 * Endpoints for autonomous pipeline execution and granular stages.
 * - Secure header-based key ingestion (x-gemini-key, x-ai33-key) falling back to process.env.
 * - Redacts secrets and API keys from logs and error responses.
 * - Accurate HTTP status codes (400, 401, 403, 404, 429, 500) and structured error schemas.
 */

import { Router, Request, Response } from 'express';
import {
  Gemini3DStudioEngine,
  AI33VoiceEngine,
  Pure3DStudioPipelineOrchestrator,
  GeminiProviderError,
  VoiceProviderError,
} from '@studio/gemini-studio-core';

const router = Router();
const orchestrator = new Pure3DStudioPipelineOrchestrator();
const geminiEngine = new Gemini3DStudioEngine();
const voiceEngine = new AI33VoiceEngine();

/**
 * Helper to safely extract effective API keys from request headers or environment.
 * Never stores or logs the keys.
 */
function extractKeys(req: Request): { geminiKey?: string; ai33Key?: string } {
  const headerGemini = req.headers['x-gemini-key'] as string | undefined;
  const headerAi33 = req.headers['x-ai33-key'] as string | undefined;
  const bodyGemini = req.body?.geminiKey as string | undefined;
  const bodyAi33 = req.body?.ai33Key as string | undefined;

  const geminiKey = headerGemini || bodyGemini || process.env.GEMINI_API_KEY || undefined;
  const ai33Key = headerAi33 || bodyAi33 || process.env.AI33_API_KEY || undefined;

  return {
    geminiKey: geminiKey && geminiKey.trim().length > 10 ? geminiKey.trim() : undefined,
    ai33Key: ai33Key && ai33Key.trim().length > 5 ? ai33Key.trim() : undefined,
  };
}

/**
 * Helper to sanitize error messages so API keys are never leaked to client or logs.
 */
function sanitizeErrorMessage(msg: string): string {
  return msg
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/AIzaSy[a-zA-Z0-9_\-]+/gi, '[REDACTED_GEMINI_KEY]')
    .replace(/ai33_[a-zA-Z0-9_\-]+/gi, '[REDACTED_AI33_KEY]');
}

/**
 * POST /api/pipeline/generate
 * 1-Click autonomous generation of 3D CGI video project
 */
router.post('/pipeline/generate', async (req: Request, res: Response) => {
  try {
    const { topic, aspectRatio, targetDurationSeconds, voiceId, modelSuite } = req.body;
    const { geminiKey, ai33Key } = extractKeys(req);

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOPIC', message: 'Topic is required.' },
      });
      return;
    }

    const project = await orchestrator.runPipeline({
      topic: topic.trim(),
      aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
      targetDurationSeconds: Number(targetDurationSeconds) || 60,
      voiceId,
      geminiKey,
      ai33Key,
      modelSuite,
    });

    res.json({
      success: true,
      data: project,
    });
  } catch (err: any) {
    const isGemini = err instanceof GeminiProviderError;
    const isVoice = err instanceof VoiceProviderError;
    const statusCode = err.statusCode || (isGemini || isVoice ? err.statusCode : 500) || 500;
    const safeMsg = sanitizeErrorMessage(err.message || 'Pipeline execution failed.');

    res.status(statusCode).json({
      success: false,
      error: {
        code: err.errorCode || 'PIPELINE_ERROR',
        message: safeMsg,
        isRetryable: Boolean(err.isRetryable),
        retryAfterSeconds: err.retryAfterSeconds,
      },
    });
  }
});

/**
 * POST /api/generate/research
 * Deep research via deep-research-max-preview-04-2026
 */
router.post('/generate/research', async (req: Request, res: Response) => {
  try {
    const { topic, modelId } = req.body;
    const { geminiKey } = extractKeys(req);

    if (!topic) {
      res.status(400).json({ success: false, error: { message: 'Topic is required.' } });
      return;
    }

    const research = await geminiEngine.researchTopic(topic, geminiKey, modelId);
    res.json({ success: true, data: research });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'RESEARCH_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/generate/story
 * Screenplay & Character Visual DNA via gemini-2.5-pro
 */
router.post('/generate/story', async (req: Request, res: Response) => {
  try {
    const { topic, research, aspectRatio, modelId } = req.body;
    const { geminiKey } = extractKeys(req);

    if (!topic) {
      res.status(400).json({ success: false, error: { message: 'Topic is required.' } });
      return;
    }

    const story = await geminiEngine.generateScreenplayAndDNA({
      topic,
      research,
      aspectRatio,
      overrideKey: geminiKey,
      modelId,
    });
    res.json({ success: true, data: story });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'STORY_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/generate/character-sheet
 * Canonical 3D Character Anchor Sheet via gemini-3-pro-image
 */
router.post('/generate/character-sheet', async (req: Request, res: Response) => {
  try {
    const { character, modelId } = req.body;
    const { geminiKey } = extractKeys(req);

    if (!character || !character.visualIdentityMatrix) {
      res.status(400).json({ success: false, error: { message: 'Character with Visual Identity Matrix is required.' } });
      return;
    }

    const sheet = await geminiEngine.generateCanonicalCharacterSheet(character, geminiKey, modelId);
    res.json({ success: true, data: sheet });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'SHEET_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/generate/continuity
 * Spatial & Continuity Supervision via gemini-4-argon
 */
router.post('/generate/continuity', async (req: Request, res: Response) => {
  try {
    const { beats, character, modelId } = req.body;
    const { geminiKey } = extractKeys(req);

    if (!beats || !Array.isArray(beats) || !character) {
      res.status(400).json({ success: false, error: { message: 'Beats and character are required.' } });
      return;
    }

    const continuity = await geminiEngine.auditSpatialContinuity(
      beats,
      character,
      geminiKey,
      modelId
    );
    res.json({ success: true, data: continuity });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'CONTINUITY_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/generate/voice
 * Voice Narration with Millisecond Word Timestamps via ai33.pro
 */
router.post('/generate/voice', async (req: Request, res: Response) => {
  try {
    const { scriptText, voiceId, speed } = req.body;
    const { ai33Key } = extractKeys(req);

    if (!scriptText) {
      res.status(400).json({ success: false, error: { message: 'Script text is required.' } });
      return;
    }

    const narration = await voiceEngine.synthesizeNarration(scriptText, {
      voiceId,
      speed: Number(speed) || 1.0,
      overrideKey: ai33Key,
    });
    res.json({ success: true, data: narration });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'VOICE_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/generate/shots
 * Multi-Reference Conditioned 3D CGI Shots via gemini-3-pro-image
 */
router.post('/generate/shots', async (req: Request, res: Response) => {
  try {
    const { beats, character, anchorSheet, aspectRatio, modelId } = req.body;
    const { geminiKey } = extractKeys(req);

    if (!beats || !character || !anchorSheet) {
      res.status(400).json({ success: false, error: { message: 'Beats, character, and anchor sheet are required.' } });
      return;
    }

    const shots = [];
    for (const beat of beats) {
      const shot = await geminiEngine.generateConditionedShotKeyframe(
        beat,
        character,
        anchorSheet,
        aspectRatio || '9:16',
        geminiKey,
        modelId
      );
      shots.push(shot);
    }
    res.json({ success: true, data: shots });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'SHOTS_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/generate/music
 * Adaptive Soundtrack via Lyria
 */
router.post('/generate/music', async (req: Request, res: Response) => {
  try {
    const { mood, durationSeconds, timestamps, modelId } = req.body;
    const { geminiKey } = extractKeys(req);

    const score = await geminiEngine.composeAdaptiveSoundtrack({
      mood: mood || 'Cinematic tension',
      durationSeconds: Number(durationSeconds) || 60,
      timestamps,
      overrideKey: geminiKey,
      modelId,
    });
    res.json({ success: true, data: score });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'MUSIC_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/qa/inspect
 * Visual QA inspection via gemini-omni-1.2-flash
 */
router.post('/qa/inspect', async (req: Request, res: Response) => {
  try {
    const { canonicalSheet, shots, beats, modelId } = req.body;
    const { geminiKey } = extractKeys(req);

    if (!canonicalSheet || !shots) {
      res.status(400).json({ success: false, error: { message: 'Canonical sheet and shots required.' } });
      return;
    }

    const report = await geminiEngine.auditVisualQA({
      canonicalSheet,
      shots,
      beats: beats || [],
      overrideKey: geminiKey,
      modelId,
    });
    res.json({ success: true, data: report });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'QA_FAILED',
        message: sanitizeErrorMessage(err.message),
        isRetryable: Boolean(err.isRetryable),
      },
    });
  }
});

/**
 * POST /api/models/verify-image
 * Verifies official Gemini image-generation models against Google's Model Discovery API
 * (`GET /v1beta/models/{modelId}`) using the user's configured Gemini API key, and optionally
 * executes a live image-generation test when `testGeneration: true` is passed.
 */
router.post('/models/verify-image', async (req: Request, res: Response) => {
  try {
    const { modelId, testGeneration } = req.body || {};
    const { geminiKey } = extractKeys(req);

    if (modelId && typeof modelId === 'string') {
      const status = await geminiEngine.verifyImageGenerationModel(
        modelId.trim(),
        geminiKey,
        Boolean(testGeneration)
      );
      res.json({ success: true, data: [status] });
      return;
    }

    const statuses = await geminiEngine.verifyAllImageGenerationModels(
      geminiKey,
      Boolean(testGeneration)
    );
    res.json({ success: true, data: statuses });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.errorCode || 'MODEL_VERIFICATION_FAILED',
        message: sanitizeErrorMessage(err.message || 'Image model verification failed.'),
      },
    });
  }
});

export default router;
