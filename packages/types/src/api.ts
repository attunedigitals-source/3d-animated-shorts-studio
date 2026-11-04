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

