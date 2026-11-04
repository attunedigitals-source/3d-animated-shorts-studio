import { Router, Request, Response } from 'express';
import { getDatabaseRepository } from '@studio/database';
import { getAIAdapter } from '@studio/ai-adapters';
import { StructuredSceneSchema } from '@studio/types';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// POST /api/scenes/breakdown - Convert script into structured 3D scenes
router.post('/breakdown', async (req: Request, res: Response) => {
  const { projectId, settings } = req.body;

  if (!projectId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PROJECT_ID', message: 'projectId is required' } });
    return;
  }

  const repo = getDatabaseRepository();
  const project = await repo.getProject(projectId, req.user!.id);
  if (!project) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found or access denied.' } });
    return;
  }

  const script = await repo.getScript(projectId, req.user!.id);
  if (!script) {
    res.status(400).json({
      success: false,
      error: { code: 'SCRIPT_NOT_FOUND', message: 'Please generate or approve a script before scene breakdown.' },
    });
    return;
  }

  const story = await repo.getStory(projectId, req.user!.id);
  const adapter = getAIAdapter(settings);

  try {
    const { scenes, metadata } = await adapter.breakdownScenes(script, story || undefined, settings);

    const savedScenes = await repo.saveScenes(projectId, req.user!.id, scenes);

    await repo.recordAIGeneration({
      ...metadata,
      projectId,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: {
        scenes: savedScenes,
        metadata,
      },
    });
  } catch (err: any) {
    await repo.recordAIGeneration({
      stage: 'scene_breakdown',
      provider: adapter.providerName,
      model: settings?.model || 'default',
      promptSnippet: script.title,
      latencyMs: 0,
      status: 'failed',
      errorMessage: err.message,
      projectId,
      userId: req.user!.id,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'SCENE_BREAKDOWN_FAILED',
        message: err.message || 'Failed to break down scenes with the selected AI provider.',
      },
    });
  }
});

// GET /api/scenes/:projectId - Get all scenes for a project
router.get('/:projectId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  try {
    const repo = getDatabaseRepository();
    const scenes = await repo.getScenes(projectId, req.user!.id);
    res.json({ success: true, data: scenes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_SCENES_FAILED', message: err.message } });
  }
});

// PUT /api/scenes/:projectId - Batch save scenes
router.put('/:projectId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const parseResult = z.array(StructuredSceneSchema).safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid scenes structure' },
    });
    return;
  }

  try {
    const repo = getDatabaseRepository();
    const saved = await repo.saveScenes(projectId, req.user!.id, parseResult.data);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVE_SCENES_FAILED', message: err.message } });
  }
});

// PATCH /api/scenes/:projectId/:sceneId - Update single scene
router.patch('/:projectId/:sceneId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const sceneId = req.params.sceneId as string;
  const sceneUpdate = req.body;
  try {
    const repo = getDatabaseRepository();
    const updated = await repo.updateScene(
      sceneId,
      projectId,
      req.user!.id,
      sceneUpdate,
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_SCENE_FAILED', message: err.message } });
  }
});

export default router;
