/**
 * @studio/api
 * Main backend server for Pure AI 3D Animated Video Studio.
 * Exclusively powered by Google Gemini Models & ai33.pro Voice.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import studioPipelineRoutes from './routes/studio-pipeline';

dotenv.config();

const app = express();
const port = process.env.API_PORT || process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// Health check endpoint (Required for AWS EC2 deploy-ec2.sh)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: '@studio/api',
    version: '2.0.0-pure-gemini',
    timestamp: new Date().toISOString(),
  });
});

// Mount Pure 3D Studio Pipeline Routes
app.use('/api', studioPipelineRoutes);

// Serve Web Frontend static build if present
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// 404 Handler for unhandled API routes
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
    console.log(`[API] Pure AI 3D Animated Studio API listening on port ${port}`);
  });
}

