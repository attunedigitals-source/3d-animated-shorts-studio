import { Request, Response, NextFunction } from 'express';
import { createSupabaseServerClient, isSupabaseConfigured } from '@studio/database';
import { UserProfile } from '@studio/types';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const devUserId = req.headers['x-user-id'] as string | undefined;

  // 1. If Supabase is configured and a Bearer token is provided, verify JWT with Supabase
  if (isSupabaseConfigured() && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const supabase = createSupabaseServerClient();
      if (supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          req.user = {
            id: user.id,
            email: user.email || '',
            displayName: (user.user_metadata?.displayName as string) || user.email?.split('@')[0] || 'User',
            createdAt: user.created_at,
          };
          return next();
        }
      }
    }
  }

  // 2. Local Development Fallback: allow explicit session header or default dev user
  if (!isSupabaseConfigured() || devUserId || (authHeader && authHeader.includes('dev-token'))) {
    const userId = devUserId || 'dev-user-001';
    req.user = {
      id: userId,
      email: `${userId}@studio.local`,
      displayName: userId === 'dev-user-001' ? 'Studio Creator (Dev)' : userId,
      createdAt: new Date().toISOString(),
    };
    return next();
  }

  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to access this resource.',
    },
  });
}

