import { z } from 'zod';

export const UserCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
});

export type UserCredentials = z.infer<typeof UserCredentialsSchema>;

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  isDevFallback?: boolean;
}

