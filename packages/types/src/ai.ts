import { z } from 'zod';

export const AIProviderTypeSchema = z.enum([
  'ollama',
]);

export type AIProviderType = z.infer<typeof AIProviderTypeSchema>;

export const AISettingsSchema = z.object({
  provider: AIProviderTypeSchema.default('ollama'),
  model: z.string().default('llama3.2:3b'),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  timeoutMs: z.number().positive().default(180000),
});

export type AISettings = z.infer<typeof AISettingsSchema>;

export interface AIGenerationMetadata {
  id: string;
  projectId?: string;
  userId?: string;
  stage: 'story' | 'script' | 'scene_breakdown';
  provider: string;
  model: string;
  promptSnippet: string;
  tokensUsed?: number;
  latencyMs: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: AIProviderType;
  contextWindow?: number;
  recommendedFor: ('story' | 'script' | 'scenes')[];
}

