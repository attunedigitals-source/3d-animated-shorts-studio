/**
 * @studio/api
 * Main backend server for 3D Animated Shorts Studio.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import projectsRoutes from './routes/projects';
import storiesRoutes from './routes/stories';
import scriptsRoutes from './routes/scripts';
import scenesRoutes from './routes/scenes';
import settingsRoutes from './routes/settings';
import { getDatabaseRepository } from '@studio/database';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 4000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const repo = getDatabaseRepository();
  const dbHealthy = await repo.isHealthy();

  res.json({
    status: 'ok',
    service: '@studio/api',
    database: {
      healthy: dbHealthy,
      isDevFallback: repo.isDevFallback(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/scripts', scriptsRoutes);
app.use('/api/scenes', scenesRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API route does not exist.',
    },
  });
});

// Centralized Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.',
    },
  });
});

export default app;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[API] 3D Animated Shorts Studio API listening on port ${port}`);
  });
}
