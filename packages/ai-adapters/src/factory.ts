import { AISettings } from '@studio/types';
import { IAIProviderAdapter } from './types';
import { OllamaAIAdapter } from './ollama-adapter';

export function getAIAdapter(_settings?: Partial<AISettings>): IAIProviderAdapter {
  return new OllamaAIAdapter();
}

