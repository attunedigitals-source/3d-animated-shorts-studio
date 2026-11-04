import { z } from 'zod';

export const AIProviderTypeSchema = z.enum([
  'openrouter',
  'openai',
  'anthropic',
  'mock',
]);

export type AIProviderType = z.infer<typeof AIProviderTypeSchema>;

export const AISettingsSchema = z.object({
  provider: AIProviderTypeSchema.default('openrouter'),
  model: z.string().default('anthropic/claude-3.5-sonnet'),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  timeoutMs: z.number().positive().default(60000),
  mockAi: z.boolean().default(false),
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

