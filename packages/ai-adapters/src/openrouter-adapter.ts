import {
  StoryPromptOptions,
  StoryDocument,
  StoryDocumentSchema,
  ScriptDocument,
  ScriptDocumentSchema,
  StructuredScene,
  StructuredSceneSchema,
  AIGenerationMetadata,
  AISettings,
  TestConnectionResponse,
} from '@studio/types';
import { z } from 'zod';
import { IAIProviderAdapter } from './types';
import { extractAndValidateJson } from './parser';
import { buildStoryPrompt, buildScriptPrompt, buildSceneBreakdownPrompt } from './prompts';

/**
 * Curated list of high-performance free models hosted on OpenRouter.
 * Automatically ordered by capability:
 * 1. Llama 3.3 70B: Outstanding narrative depth and screenplay dialogue.
 * 2. Gemini 2.0 Flash: Ultra-fast generation with large context window.
 * 3. DeepSeek R1: Advanced multi-step creative reasoning.
 * 4. Qwen 2.5 72B: Rich world-building and character dynamics.
 * 5. Llama 3.2 3B: Rapid, lightweight fallback engine.
 * 6. Mistral 7B: Stable and reliable baseline.
 * 7. Phi-3 Medium: Fast and efficient fallback.
 */
export const DEFAULT_OPENROUTER_FREE_MODELS: string[] = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
];

let cachedFreeModels: string[] | null = null;
let lastCacheTime = 0;

/**
 * Dynamically queries OpenRouter for currently active free models.
 * Falls back to DEFAULT_OPENROUTER_FREE_MODELS on network restrictions or errors.
 */
export async function getAvailableFreeModels(baseUrl: string = 'https://openrouter.ai/api/v1'): Promise<string[]> {
  const now = Date.now();
  if (cachedFreeModels && now - lastCacheTime < 1000 * 60 * 15) {
    return cachedFreeModels;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${baseUrl}/models`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data?.data)) {
        const liveFree = data.data
          .filter(
            (m: any) =>
              m.id?.endsWith(':free') ||
              (m.pricing?.prompt === '0' && m.pricing?.completion === '0')
          )
          .map((m: any) => m.id as string);

        if (liveFree.length > 0) {
          // Keep curated order first, followed by any other dynamic free models discovered
          const ordered = [
            ...DEFAULT_OPENROUTER_FREE_MODELS.filter((id) => liveFree.includes(id)),
            ...liveFree.filter((id: string) => !DEFAULT_OPENROUTER_FREE_MODELS.includes(id)),
          ];
          cachedFreeModels = ordered;
          lastCacheTime = now;
          return ordered;
        }
      }
    }
  } catch {
    // Graceful fallback to static verified list
  }

  return DEFAULT_OPENROUTER_FREE_MODELS;
}

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export class OpenRouterAIAdapter implements IAIProviderAdapter {
  readonly providerName = 'openrouter';

  private resolveConfig(settings?: Partial<AISettings>) {
    const apiKey = settings?.apiKey || getEnv('OPENROUTER_API_KEY');
    const baseUrl = settings?.baseUrl || getEnv('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
    // Default to top free model if not specified or if legacy default was present
    let model = settings?.model || getEnv('OPENROUTER_DEFAULT_MODEL') || DEFAULT_OPENROUTER_FREE_MODELS[0]!;
    if (model === 'auto' || model === 'auto-free' || model === 'openrouter/auto-free') {
      model = DEFAULT_OPENROUTER_FREE_MODELS[0]!;
    }
    const timeoutMs = settings?.timeoutMs || Number(getEnv('AI_REQUEST_TIMEOUT_MS')) || 60000;
    const temperature = settings?.temperature ?? 0.7;

    return { apiKey, baseUrl, model, timeoutMs, temperature };
  }

  /**
   * Prepares the ordered list of candidate models for generation.
   * Starts with the requested model, followed by all remaining free models as fallbacks.
   */
  private async getCandidateModels(requestedModel?: string, baseUrl?: string): Promise<string[]> {
    const freeList = await getAvailableFreeModels(baseUrl);
    const primary = requestedModel?.trim();

    if (!primary || primary === 'auto' || primary === 'auto-free' || primary === 'openrouter/auto-free') {
      return freeList;
    }

    return [primary, ...freeList.filter((m) => m !== primary)];
  }

  /**
   * Executes a chat completion with automatic model fallback.
   * If the chosen model generates an error (HTTP error, 429 rate limit, 503 capacity,
   * timeout, or invalid JSON schema), it immediately advances to the next available free model.
   */
  private async executeWithModelFallback<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T, any, any>,
    config: ReturnType<typeof this.resolveConfig>,
  ): Promise<{ data: T; tokensUsed?: number; latencyMs: number; actualModel: string }> {
    if (!config.apiKey || config.apiKey.includes('placeholder')) {
      throw new Error(
        'OpenRouter API key is not configured. Please supply a valid OPENROUTER_API_KEY in your environment or Settings panel.',
      );
    }

    const candidateModels = await this.getCandidateModels(config.model, config.baseUrl);
    const errors: { model: string; error: string }[] = [];
    const totalStart = Date.now();

    for (let i = 0; i < candidateModels.length; i++) {
      const currentCandidate = candidateModels[i]!;
      const remainingCandidates = candidateModels.slice(i);
      const attemptStart = Date.now();
      const controller = new AbortController();
      const attemptTimeout = Math.min(config.timeoutMs, 45000);
      const timeout = setTimeout(() => controller.abort(), attemptTimeout);

      try {
        console.log(`[OpenRouter] Requesting generation via "${currentCandidate}" (${i + 1}/${candidateModels.length})...`);

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
            'HTTP-Referer': 'https://github.com/google-deepmind/3d-animated-shorts-studio',
            'X-Title': '3D Animated Shorts Studio',
          },
          body: JSON.stringify({
            model: currentCandidate,
            // OpenRouter multi-model auto-routing fallback
            models: remainingCandidates,
            temperature: config.temperature,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsedError = errorText.slice(0, 300);
          try {
            const errJson = JSON.parse(errorText);
            if (errJson?.error?.message) parsedError = errJson.error.message;
          } catch {}
          throw new Error(`HTTP ${response.status}: ${parsedError}`);
        }

        const data = (await response.json()) as any;
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          throw new Error('Empty completion content returned by model.');
        }

        const validated = extractAndValidateJson(text, schema);
        const actualModel = data.model || currentCandidate;
        const latencyMs = Date.now() - attemptStart;

        console.log(`[OpenRouter] Succeeded using "${actualModel}" in ${latencyMs}ms.`);
        return {
          data: validated,
          tokensUsed: data.usage?.total_tokens,
          latencyMs: Date.now() - totalStart,
          actualModel,
        };
      } catch (err: any) {
        clearTimeout(timeout);
        const errMsg = err.name === 'AbortError' ? `Timed out after ${attemptTimeout / 1000}s` : err.message;
        errors.push({ model: currentCandidate, error: errMsg });

        const nextCandidate = candidateModels[i + 1];
        if (nextCandidate) {
          console.warn(
            `[OpenRouter Fallback] Model "${currentCandidate}" failed: ${errMsg}. Automatically switching to next free model: "${nextCandidate}"...`,
          );
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    const aggregated = errors.map((e) => `[${e.model}]: ${e.error}`).join('; ');
    throw new Error(`All OpenRouter free models exhausted. Attempted ${errors.length} models: ${aggregated}`);
  }

  async testConnection(settings?: Partial<AISettings>): Promise<TestConnectionResponse> {
    const config = this.resolveConfig(settings);
    const start = Date.now();

    try {
      const { actualModel, latencyMs } = await this.executeWithModelFallback(
        'You are an API health check. Output JSON: {"status": "ok", "message": "Connection verified"}',
        'Verify connection.',
        z.object({ status: z.string(), message: z.string().optional() }),
        config,
      );

      return {
        connected: true,
        provider: 'openrouter',
        model: actualModel,
        latencyMs,
        message: `Successfully connected to OpenRouter using free model "${actualModel}" with automatic fallback active.`,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'openrouter',
        model: config.model,
        latencyMs: Date.now() - start,
        message: err.message || 'Failed to connect to OpenRouter.',
      };
    }
  }

  async generateStory(
    options: StoryPromptOptions,
    settings?: Partial<AISettings>,
  ): Promise<{ story: StoryDocument; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }> {
    const config = this.resolveConfig(settings);
    const { system, user } = buildStoryPrompt(options);

    const { data: story, tokensUsed, latencyMs, actualModel } = await this.executeWithModelFallback(
      system,
      user,
      StoryDocumentSchema,
      config,
    );

    return {
      story,
      metadata: {
        stage: 'story',
        provider: 'openrouter',
        model: actualModel,
        promptSnippet: options.topic.slice(0, 100),
        tokensUsed,
        latencyMs,
        status: 'success',
      },
    };
  }

  async generateScript(
    story: StoryDocument,
    targetDurationSeconds: number,
    settings?: Partial<AISettings>,
  ): Promise<{ script: ScriptDocument; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }> {
    const config = this.resolveConfig(settings);
    const { system, user } = buildScriptPrompt(story, targetDurationSeconds);

    const { data: script, tokensUsed, latencyMs, actualModel } = await this.executeWithModelFallback(
      system,
      user,
      ScriptDocumentSchema,
      config,
    );

    return {
      script,
      metadata: {
        stage: 'script',
        provider: 'openrouter',
        model: actualModel,
        promptSnippet: story.title,
        tokensUsed,
        latencyMs,
        status: 'success',
      },
    };
  }

  async breakdownScenes(
    script: ScriptDocument,
    story?: StoryDocument,
    settings?: Partial<AISettings>,
  ): Promise<{ scenes: StructuredScene[]; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }> {
    const config = this.resolveConfig(settings);
    const { system, user } = buildSceneBreakdownPrompt(script, story);

    const scenesArraySchema = z.array(StructuredSceneSchema);
    const { data: scenes, tokensUsed, latencyMs, actualModel } = await this.executeWithModelFallback(
      system,
      user,
      scenesArraySchema,
      config,
    );

    return {
      scenes,
      metadata: {
        stage: 'scene_breakdown',
        provider: 'openrouter',
        model: actualModel,
        promptSnippet: script.title,
        tokensUsed,
        latencyMs,
        status: 'success',
      },
    };
  }
}
