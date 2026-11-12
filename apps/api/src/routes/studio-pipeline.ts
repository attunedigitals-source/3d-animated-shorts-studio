/**
 * Pure Gemini 3D Studio API Routes
 * Endpoints for autonomous pipeline and granular steps based on NEXT_GEN_3D_STUDIO_PROPOSAL.md
 */

import { Router, Request, Response } from 'express';
import {
  Gemini3DStudioEngine,
  AI33VoiceEngine,
  Pure3DStudioPipelineOrchestrator,
} from '@studio/gemini-studio-core';

const router = Router();
const orchestrator = new Pure3DStudioPipelineOrchestrator();
const geminiEngine = new Gemini3DStudioEngine();
const voiceEngine = new AI33VoiceEngine();

/**
 * POST /api/pipeline/generate
 * 1-Click autonomous generation of 3D CGI video project
 */
router.post('/pipeline/generate', async (req: Request, res: Response) => {
  try {
    const { topic, aspectRatio, targetDurationSeconds, voiceId, geminiKey, ai33Key } = req.body;

    if (!topic || typeof topic !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOPIC', message: 'Topic is required.' },
      });
      return;
    }

    const project = await orchestrator.runPipeline({
      topic,
      aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
      targetDurationSeconds: Number(targetDurationSeconds) || 60,
      voiceId,
      geminiKey,
      ai33Key,
    });

    res.json({
      success: true,
      data: project,
    });
  } catch (err: any) {
    console.error('[Pipeline Error]:', err);
    res.status(500).json({
      success: false,
      error: { code: 'PIPELINE_ERROR', message: err.message || 'Pipeline execution failed.' },
    });
  }
});

/**
 * POST /api/generate/research
 * Deep research via deep-research-max-preview-04-2026
 */
router.post('/generate/research', async (req: Request, res: Response) => {
  try {
    const { topic, geminiKey } = req.body;
    if (!topic) {
      res.status(400).json({ success: false, error: { message: 'Topic is required.' } });
      return;
    }

    const research = await geminiEngine.researchTopic(topic, geminiKey);
    res.json({ success: true, data: research });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/generate/story
 * Screenplay & Character Visual DNA via gemini-2.5-pro
 */
router.post('/generate/story', async (req: Request, res: Response) => {
  try {
    const { topic, research, aspectRatio, geminiKey } = req.body;
    if (!topic) {
      res.status(400).json({ success: false, error: { message: 'Topic is required.' } });
      return;
    }

    const story = await geminiEngine.generateScreenplayAndDNA({
      topic,
      research,
      aspectRatio,
      overrideKey: geminiKey,
    });
    res.json({ success: true, data: story });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/generate/character-sheet
 * Canonical 3D Character Anchor Sheet via gemini-3-pro-image
 */
router.post('/generate/character-sheet', async (req: Request, res: Response) => {
  try {
    const { character, geminiKey } = req.body;
    if (!character || !character.visualIdentityMatrix) {
      res.status(400).json({ success: false, error: { message: 'Character with Visual Identity Matrix is required.' } });
      return;
    }

    const sheet = await geminiEngine.generateCanonicalCharacterSheet(character, geminiKey);
    res.json({ success: true, data: sheet });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/generate/voice
 * Voice Narration with Millisecond Word Timestamps via ai33.pro
 */
router.post('/generate/voice', async (req: Request, res: Response) => {
  try {
    const { scriptText, voiceId, speed, ai33Key } = req.body;
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
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/generate/shots
 * Multi-Reference Conditioned 3D CGI Shots via gemini-3-pro-image
 */
router.post('/generate/shots', async (req: Request, res: Response) => {
  try {
    const { beats, character, anchorSheet, aspectRatio, geminiKey } = req.body;
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
        geminiKey
      );
      shots.push(shot);
    }
    res.json({ success: true, data: shots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/generate/music
 * Adaptive Soundtrack via lyria-3.5
 */
router.post('/generate/music', async (req: Request, res: Response) => {
  try {
    const { mood, durationSeconds, timestamps, geminiKey } = req.body;
    const score = await geminiEngine.composeAdaptiveSoundtrack({
      mood: mood || 'Cinematic tension',
      durationSeconds: Number(durationSeconds) || 60,
      timestamps,
      overrideKey: geminiKey,
    });
    res.json({ success: true, data: score });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/qa/inspect
 * Visual QA inspection via gemini-omni-1.2-flash
 */
router.post('/qa/inspect', async (req: Request, res: Response) => {
  try {
    const { canonicalSheet, shots, beats, geminiKey } = req.body;
    if (!canonicalSheet || !shots) {
      res.status(400).json({ success: false, error: { message: 'Canonical sheet and shots required.' } });
      return;
    }

    const report = await geminiEngine.auditVisualQA({
      canonicalSheet,
      shots,
      beats: beats || [],
      overrideKey: geminiKey,
    });
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
