import { Router, Request, Response } from 'express';
import { createSupabaseServerClient, isSupabaseConfigured, getDatabaseRepository } from '@studio/database';
import { UserCredentialsSchema } from '@studio/types';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parseResult = UserCredentialsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid registration credentials',
      },
    });
    return;
  }

  const { email, password, displayName } = parseResult.data;

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { displayName: displayName || email.split('@')[0] },
        },
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: { code: 'REGISTRATION_FAILED', message: error.message },
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: data.user?.id,
            email: data.user?.email,
            displayName: displayName || email.split('@')[0],
          },
          session: data.session,
          isDevFallback: false,
        },
      });
      return;
    }
  }

  // Development Fallback Mode
  const devId = `user-${Date.now()}`;
  const repo = getDatabaseRepository();
  const profile = await repo.upsertProfile({
    id: devId,
    email,
    displayName: displayName || email.split('@')[0] || 'Dev Creator',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: {
      user: profile,
      accessToken: `dev-token-${devId}`,
      isDevFallback: true,
    },
  });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parseResult = UserCredentialsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid login credentials',
      },
    });
    return;
  }

  const { email, password } = parseResult.data;

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: error.message },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            displayName: (data.user.user_metadata?.displayName as string) || email.split('@')[0],
          },
          accessToken: data.session.access_token,
          isDevFallback: false,
        },
      });
      return;
    }
  }

  // Development Fallback
  const devId = 'dev-user-001';
  const repo = getDatabaseRepository();
  const profile = await repo.upsertProfile({
    id: devId,
    email,
    displayName: email.split('@')[0] || 'Studio Creator (Dev)',
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: {
      user: profile,
      accessToken: `dev-token-${devId}`,
      isDevFallback: true,
    },
  });
});

// GET /api/auth/session
router.get('/session', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const devUserId = (req.headers['x-user-id'] as string) || 'dev-user-001';

  if (isSupabaseConfigured() && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabase = createSupabaseServerClient();
    if (supabase && token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              displayName: user.user_metadata?.displayName || user.email?.split('@')[0],
              createdAt: user.created_at,
            },
            isDevFallback: false,
          },
        });
        return;
      }
    }
  }

  // Dev fallback session
  res.json({
    success: true,
    data: {
      user: {
        id: devUserId,
        email: `${devUserId}@studio.local`,
        displayName: devUserId === 'dev-user-001' ? 'Studio Creator (Dev)' : devUserId,
        createdAt: new Date().toISOString(),
      },
      isDevFallback: !isSupabaseConfigured(),
    },
  });
});

// POST /api/auth/logout
router.post('/logout', async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Signed out successfully.' });
});

export default router;

