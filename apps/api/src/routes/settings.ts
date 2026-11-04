import { Router, Request, Response } from 'express';
import { isSupabaseConfigured } from '@studio/database';
import { getAIAdapter } from '@studio/ai-adapters';
import { AISettingsSchema, AIModelOption } from '@studio/types';

const router = Router();

// Available curated models list
const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Recommended)',
    provider: 'openrouter',
    contextWindow: 200000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o Omnimodal',
    provider: 'openrouter',
    contextWindow: 128000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (Fast & Cost Efficient)',
    provider: 'openrouter',
    contextWindow: 128000,
    recommendedFor: ['script', 'scenes'],
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    provider: 'openrouter',
    contextWindow: 128000,
    recommendedFor: ['story', 'script'],
  },
  {
    id: 'deterministic-mock-v1',
    name: 'Offline Mock AI Engine (Deterministic)',
    provider: 'mock',
    contextWindow: 32000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
];

// GET /api/settings - Get current studio settings & connection statuses
router.get('/', (_req: Request, res: Response) => {
  const currentProvider = process.env.MOCK_AI === 'true' ? 'mock' : process.env.AI_PROVIDER || 'openrouter';
  const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';

  res.json({
    success: true,
    data: {
      ai: {
        provider: currentProvider,
        model: defaultModel,
        mockAi: process.env.MOCK_AI === 'true',
        hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('placeholder')),
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')),
        hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('placeholder')),
      },
      database: {
        isSupabaseConfigured: isSupabaseConfigured(),
        supabaseUrl: isSupabaseConfigured() ? process.env.SUPABASE_URL : undefined,
      },
      availableModels: AVAILABLE_MODELS,
    },
  });
});

// POST /api/settings/test-connection - Test ping to chosen AI provider
router.post('/test-connection', async (req: Request, res: Response) => {
  const parseResult = AISettingsSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid settings' },
    });
    return;
  }

  const adapter = getAIAdapter(parseResult.data);
  const result = await adapter.testConnection(parseResult.data);

  res.json({
    success: true,
    data: result,
  });
});

export default router;

