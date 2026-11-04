import { Router, Request, Response } from 'express';
import { getDatabaseRepository } from '@studio/database';
import { CreateProjectSchema, UpdateProjectSchema } from '@studio/types';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/projects - List user's projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const repo = getDatabaseRepository();
    const projects = await repo.getProjects(req.user!.id);
    res.json({ success: true, data: projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_PROJECTS_FAILED', message: err.message } });
  }
});

// GET /api/projects/:id - Get full project details
router.get('/:id', async (req: Request, res: Response) => {
  const projectId = req.params.id as string;
  try {
    const repo = getDatabaseRepository();
    const project = await repo.getProject(projectId, req.user!.id);
    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found or access denied.' } });
      return;
    }
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_PROJECT_FAILED', message: err.message } });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req: Request, res: Response) => {
  const parseResult = CreateProjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' },
    });
    return;
  }

  try {
    const repo = getDatabaseRepository();
    const project = await repo.createProject(req.user!.id, parseResult.data);
    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'CREATE_PROJECT_FAILED', message: err.message } });
  }
});

// PATCH /api/projects/:id - Update project metadata or preferences
router.patch('/:id', async (req: Request, res: Response) => {
  const projectId = req.params.id as string;
  const parseResult = UpdateProjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' },
    });
    return;
  }

  try {
    const repo = getDatabaseRepository();
    const updated = await repo.updateProject(projectId, req.user!.id, parseResult.data);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_PROJECT_FAILED', message: err.message } });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  const projectId = req.params.id as string;
  try {
    const repo = getDatabaseRepository();
    const success = await repo.deleteProject(projectId, req.user!.id);
    if (!success) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found or already deleted.' } });
      return;
    }
    res.json({ success: true, message: 'Project successfully deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'DELETE_PROJECT_FAILED', message: err.message } });
  }
});

// POST /api/projects/:id/duplicate - Duplicate project
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  const projectId = req.params.id as string;
  try {
    const repo = getDatabaseRepository();
    const cloned = await repo.duplicateProject(projectId, req.user!.id);
    res.status(201).json({ success: true, data: cloned });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'DUPLICATE_PROJECT_FAILED', message: err.message } });
  }
});

export default router;
