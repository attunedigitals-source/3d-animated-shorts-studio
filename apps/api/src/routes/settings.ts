import { Router, Request, Response } from 'express';
import { isSupabaseConfigured, testSupabaseConnection } from '@studio/database';
import { getAIAdapter, getVoiceAdapter } from '@studio/ai-adapters';
import { AISettingsSchema, AIModelOption } from '@studio/types';
import { settingsManager } from '../services/settingsManager';

const router = Router();

// Available curated models list
const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free · Auto-Fallback)',
    provider: 'openrouter',
    contextWindow: 128000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free · Auto-Fallback)',
    provider: 'openrouter',
    contextWindow: 1000000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free · Auto-Fallback)',
    provider: 'openrouter',
    contextWindow: 64000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B (Free · Auto-Fallback)',
    provider: 'openrouter',
    contextWindow: 32000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B (Free · Fast)',
    provider: 'openrouter',
    contextWindow: 128000,
    recommendedFor: ['script', 'scenes'],
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Premium)',
    provider: 'openrouter',
    contextWindow: 200000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Premium)',
    provider: 'openrouter',
    contextWindow: 128000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Direct OpenAI)',
    provider: 'openai',
    contextWindow: 128000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Direct OpenAI)',
    provider: 'openai',
    contextWindow: 128000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet (Direct Anthropic)',
    provider: 'anthropic',
    contextWindow: 200000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 3B (Self-Hosted Ollama · AWS EC2)',
    provider: 'ollama',
    contextWindow: 128000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
  {
    id: 'deterministic-mock-v1',
    name: 'Offline Mock AI Engine (Deterministic)',
    provider: 'mock',
    contextWindow: 32000,
    recommendedFor: ['story', 'script', 'scenes'],
  },
];

function buildSafeSettingsResponse() {
  const currentProvider = process.env.MOCK_AI === 'true' ? 'mock' : process.env.AI_PROVIDER || 'openrouter';
  const defaultModel =
    currentProvider === 'ollama'
      ? process.env.OLLAMA_MODEL || 'llama3.2:3b'
      : process.env.OPENROUTER_DEFAULT_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
  const voiceProvider = process.env.VOICE_PROVIDER || 'ai33';
  const isDevDatabase = !isSupabaseConfigured();

  return {
    ai: {
      provider: currentProvider,
      model: defaultModel,
      mockAi: process.env.MOCK_AI === 'true',
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('placeholder')),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')),
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('placeholder')),
      hasOllama: Boolean(process.env.OLLAMA_BASE_URL || currentProvider === 'ollama'),
      // Private internal Ollama endpoints remain strictly server-side
      baseUrl: currentProvider === 'ollama' ? undefined : (process.env.OPENAI_BASE_URL || process.env.OPENROUTER_BASE_URL),
    },
    voice: {
      provider: voiceProvider,
      mockVoice: process.env.MOCK_VOICE === 'true',
      hasAI33Key: Boolean(process.env.AI33_API_KEY && !process.env.AI33_API_KEY.includes('placeholder')),
      baseUrl: process.env.AI33_BASE_URL || 'https://api.ai33.pro/v3',
      defaultVoiceId: process.env.AI33_DEFAULT_VOICE_ID || 'minimax_male-qn-qingse',
    },
    database: {
      isSupabaseConfigured: isSupabaseConfigured(),
      mode: isDevDatabase ? 'dev' : 'supabase',
      supabaseUrl: isSupabaseConfigured() ? process.env.SUPABASE_URL : undefined,
    },
    availableModels: AVAILABLE_MODELS,
  };
}

// GET /api/settings - Get current studio settings & connection statuses (safe, secrets omitted)
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: buildSafeSettingsResponse(),
  });
});

// POST /api/settings - Save runtime settings (API keys & Supabase credentials)
router.post('/', (req: Request, res: Response) => {
  try {
    settingsManager.updateSettings(req.body);
    res.json({
      success: true,
      message: 'Studio settings updated successfully.',
      data: buildSafeSettingsResponse(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SETTINGS_UPDATE_FAILED', message: err.message },
    });
  }
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

// POST /api/settings/test-voice - Test ping to ai33.pro voice API
router.post('/test-voice', async (req: Request, res: Response) => {
  const { apiKey, baseUrl, provider } = req.body;
  const start = Date.now();

  try {
    const voiceAdapter = getVoiceAdapter({
      provider: provider || 'ai33',
      apiKey,
      baseUrl,
      mockVoice: provider === 'mock' || !apiKey,
    });

    const result = await voiceAdapter.testConnection(apiKey);
    const latency = Date.now() - start;

    res.json({
      success: true,
      data: {
        connected: result.connected,
        provider: voiceAdapter.providerName,
        message: result.message || 'Connected to voice engine successfully.',
        latencyMs: latency,
      },
    });
  } catch (err: any) {
    res.json({
      success: true,
      data: {
        connected: false,
        provider: provider || 'ai33',
        message: err.message || 'Failed to connect to voice engine.',
        latencyMs: Date.now() - start,
      },
    });
  }
});

// POST /api/settings/test-supabase - Test ping to Supabase credentials
router.post('/test-supabase', async (req: Request, res: Response) => {
  const { supabaseUrl, supabaseAnonKey } = req.body;
  const result = await testSupabaseConnection({ supabaseUrl, supabaseAnonKey });

  res.json({
    success: true,
    data: result,
  });
});

export default router;
