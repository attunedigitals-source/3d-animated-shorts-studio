import { Router, Request, Response } from 'express';
import { getDatabaseRepository } from '@studio/database';
import { getAIAdapter } from '@studio/ai-adapters';
import { StoryPromptOptionsSchema, StoryDocumentSchema } from '@studio/types';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// POST /api/stories/generate
router.post('/generate', async (req: Request, res: Response) => {
  const { projectId, options, settings } = req.body;

  if (!projectId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PROJECT_ID', message: 'projectId is required' } });
    return;
  }

  const parseResult = StoryPromptOptionsSchema.safeParse(options);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid story options' },
    });
    return;
  }

  const repo = getDatabaseRepository();
  const project = await repo.getProject(projectId, req.user!.id);
  if (!project) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found or access denied.' } });
    return;
  }

  const adapter = getAIAdapter(settings);

  try {
    const { story, metadata } = await adapter.generateStory(parseResult.data, settings);

    // Persist story to database
    const savedRecord = await repo.saveStory(projectId, req.user!.id, story);

    // Record AI generation audit metadata
    await repo.recordAIGeneration({
      ...metadata,
      projectId,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: {
        story: savedRecord,
        metadata,
      },
    });
  } catch (err: any) {
    // Record failed attempt
    await repo.recordAIGeneration({
      stage: 'story',
      provider: adapter.providerName,
      model: settings?.model || 'default',
      promptSnippet: parseResult.data.topic.slice(0, 100),
      latencyMs: 0,
      status: 'failed',
      errorMessage: err.message,
      projectId,
      userId: req.user!.id,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'STORY_GENERATION_FAILED',
        message: err.message || 'Failed to generate story with the selected AI provider.',
      },
    });
  }
});

// GET /api/stories/:projectId - Get story for project
router.get('/:projectId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  try {
    const repo = getDatabaseRepository();
    const story = await repo.getStory(projectId, req.user!.id);
    if (!story) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No story found for this project.' } });
      return;
    }
    res.json({ success: true, data: story });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_STORY_FAILED', message: err.message } });
  }
});

// PUT /api/stories/:projectId - Update and save story edits
router.put('/:projectId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const parseResult = StoryDocumentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid story structure' },
    });
    return;
  }

  try {
    const repo = getDatabaseRepository();
    const saved = await repo.saveStory(projectId, req.user!.id, parseResult.data);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVE_STORY_FAILED', message: err.message } });
  }
});

export default router;
