import { IVoiceAdapter } from './types';
import { AI33VoiceAdapter } from './ai33-voice-adapter';
import { MockVoiceAdapter } from './mock-voice-adapter';

export interface VoiceAdapterOptions {
  provider?: 'ai33' | 'mock';
  apiKey?: string;
  baseUrl?: string;
  mockVoice?: boolean;
}

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

/**
 * Returns an instance of IVoiceAdapter based on runtime configuration.
 */
export function getVoiceAdapter(options?: VoiceAdapterOptions): IVoiceAdapter {
  const forceMock = options?.mockVoice ?? (getEnv('MOCK_VOICE') === 'true');
  const provider = options?.provider ?? getEnv('VOICE_PROVIDER') ?? 'ai33';
  const apiKey = options?.apiKey ?? getEnv('AI33_API_KEY');

  if (forceMock || provider === 'mock') {
    return new MockVoiceAdapter();
  }

  if (!apiKey || apiKey.includes('placeholder')) {
    console.warn('[Voice Adapters] AI33_API_KEY not configured or is placeholder. Falling back to MockVoiceAdapter for local development.');
    return new MockVoiceAdapter();
  }

  return new AI33VoiceAdapter(apiKey, options?.baseUrl);
}

