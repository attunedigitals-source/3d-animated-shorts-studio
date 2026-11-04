import { AISettings, AIProviderType } from '@studio/types';
import { IAIProviderAdapter } from './types';
import { MockAIAdapter } from './mock-adapter';
import { OpenRouterAIAdapter } from './openrouter-adapter';
import { OpenAICompatibleAdapter } from './openai-adapter';
import { AnthropicAIAdapter } from './anthropic-adapter';

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export function getAIAdapter(settings?: Partial<AISettings>): IAIProviderAdapter {
  const isMockExplicit =
    settings?.mockAi === true ||
    settings?.provider === 'mock' ||
    getEnv('MOCK_AI') === 'true' ||
    getEnv('AI_PROVIDER') === 'mock';

  if (isMockExplicit) {
    return new MockAIAdapter();
  }

  const provider: AIProviderType = settings?.provider || (getEnv('AI_PROVIDER') as AIProviderType) || 'openrouter';

  switch (provider) {
    case 'openrouter': {
      const apiKey = settings?.apiKey || getEnv('OPENROUTER_API_KEY');
      if (!apiKey || apiKey.includes('placeholder')) {
        console.warn(
          '[AI Adapters] OpenRouter API key not configured or is placeholder. Using MockAIAdapter for local execution.',
        );
        return new MockAIAdapter();
      }
      return new OpenRouterAIAdapter();
    }
    case 'openai': {
      return new OpenAICompatibleAdapter();
    }
    case 'anthropic': {
      const apiKey = settings?.apiKey || getEnv('ANTHROPIC_API_KEY');
      if (!apiKey || apiKey.includes('placeholder')) {
        console.warn(
          '[AI Adapters] Anthropic API key not configured or is placeholder. Using MockAIAdapter for local execution.',
        );
        return new MockAIAdapter();
      }
      return new AnthropicAIAdapter();
    }
    case 'mock':
    default:
      return new MockAIAdapter();
  }
}

