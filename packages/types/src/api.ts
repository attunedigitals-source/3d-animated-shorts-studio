export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    durationMs?: number;
  };
}

export interface TestConnectionResponse {
  connected: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  message: string;
}

export interface TestSupabaseResponse {
  connected: boolean;
  message: string;
  latencyMs: number;
  url?: string;
}

export interface TestVoiceResponse {
  connected: boolean;
  provider: string;
  message: string;
  latencyMs: number;
  sampleVoices?: string[];
}

export interface StudioSettingsPayload {
  ai?: {
    provider?: 'openrouter' | 'openai' | 'anthropic' | 'mock';
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    mockAi?: boolean;
  };
  voice?: {
    provider?: 'ai33' | 'mock';
    apiKey?: string;
    baseUrl?: string;
    defaultVoiceId?: string;
    mockVoice?: boolean;
  };
  database?: {
    mode?: 'dev' | 'supabase';
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseServiceRoleKey?: string;
  };
}

