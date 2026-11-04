import { Router, Request, Response } from 'express';
import { getDatabaseRepository } from '@studio/database';
import { getAIAdapter } from '@studio/ai-adapters';
import { ScriptDocumentSchema } from '@studio/types';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// POST /api/scripts/generate - Convert story into narration-ready script
router.post('/generate', async (req: Request, res: Response) => {
  const { projectId, targetDurationSeconds, settings } = req.body;

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

  const story = await repo.getStory(projectId, req.user!.id);
  if (!story) {
    res.status(400).json({
      success: false,
      error: { code: 'STORY_NOT_FOUND', message: 'Please generate or approve a story before generating the script.' },
    });
    return;
  }

  const duration = targetDurationSeconds || project.preferences?.targetDurationSeconds || 30;
  const adapter = getAIAdapter(settings);

  try {
    const { script, metadata } = await adapter.generateScript(story, duration, settings);

    const savedRecord = await repo.saveScript(projectId, req.user!.id, script);

    await repo.recordAIGeneration({
      ...metadata,
      projectId,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: {
        script: savedRecord,
        metadata,
      },
    });
  } catch (err: any) {
    await repo.recordAIGeneration({
      stage: 'script',
      provider: adapter.providerName,
      model: settings?.model || 'default',
      promptSnippet: story.title,
      latencyMs: 0,
      status: 'failed',
      errorMessage: err.message,
      projectId,
      userId: req.user!.id,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'SCRIPT_GENERATION_FAILED',
        message: err.message || 'Failed to generate script with the selected AI provider.',
      },
    });
  }
});

// GET /api/scripts/:projectId - Get latest script
router.get('/:projectId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  try {
    const repo = getDatabaseRepository();
    const script = await repo.getScript(projectId, req.user!.id);
    if (!script) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No script found for this project.' } });
      return;
    }
    res.json({ success: true, data: script });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_SCRIPT_FAILED', message: err.message } });
  }
});

// PUT /api/scripts/:projectId - Save modified script
router.put('/:projectId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const parseResult = ScriptDocumentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid script structure' },
    });
    return;
  }

  try {
    const repo = getDatabaseRepository();
    const saved = await repo.saveScript(projectId, req.user!.id, parseResult.data);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVE_SCRIPT_FAILED', message: err.message } });
  }
});

export default router;
