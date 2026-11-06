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

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export class OllamaAIAdapter implements IAIProviderAdapter {
  readonly providerName = 'ollama';

  private resolveConfig(settings?: Partial<AISettings>) {
    // Server-side environment variables take authoritative priority to keep private configurations secure
    const rawBaseUrl = getEnv('OLLAMA_BASE_URL') || settings?.baseUrl || 'http://127.0.0.1:11434';
    // Normalize URL: remove trailing slashes, /v1, and /api suffixes to prevent path duplication
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '').replace(/\/v1$/, '').replace(/\/api$/, '');
    const model = getEnv('OLLAMA_MODEL') || settings?.model || 'llama3.2:3b';
    const apiKey = getEnv('OLLAMA_API_KEY') || settings?.apiKey || undefined;
    const timeoutMs = Number(getEnv('OLLAMA_TIMEOUT_MS')) || settings?.timeoutMs || Number(getEnv('AI_REQUEST_TIMEOUT_MS')) || 180000;
    const temperature = settings?.temperature ?? 0.7;

    return { baseUrl, model, apiKey, timeoutMs, temperature };
  }

  private async executeChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config: ReturnType<typeof this.resolveConfig>,
  ): Promise<{ text: string; tokensUsed?: number; latencyMs: number }> {
    // Strict guard: completely prohibit any direct browser execution of Ollama adapter
    if (typeof window !== 'undefined') {
      throw new Error(
        'Direct browser connection to Ollama is prohibited. All Ollama requests must route through the backend Express API.',
      );
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['X-API-Key'] = config.apiKey;
    }

    const endpoint = `${config.baseUrl}/api/chat`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          format: 'json',
          options: {
            temperature: config.temperature,
          },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        let message = errorText;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) message = parsed.error;
        } catch {}
        throw new Error(`Ollama API request failed [HTTP ${response.status}]: ${message.slice(0, 300)}`);
      }

      const data = (await response.json()) as any;
      const text = data.message?.content;
      if (!text) {
        throw new Error('Ollama returned an empty response with no completion text.');
      }

      const tokensUsed = (data.prompt_eval_count || 0) + (data.eval_count || 0);
      return { text, tokensUsed: tokensUsed > 0 ? tokensUsed : undefined, latencyMs };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Ollama request timed out after ${config.timeoutMs / 1000}s. Local inference on model "${config.model}" may be slow or the server is unresponsive.`,
        );
      }
      if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(
          `Could not connect to Ollama server at ${config.baseUrl}. Please ensure Ollama is running and accessible: ${err.message}`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection(settings?: Partial<AISettings>): Promise<TestConnectionResponse> {
    const config = this.resolveConfig(settings);
    const start = Date.now();

    try {
      const result = await this.executeChatCompletion(
        'You are an API health check. Output JSON: {"status": "ok"}',
        'Verify connection.',
        config,
      );

      return {
        connected: true,
        provider: 'ollama',
        model: config.model,
        latencyMs: result.latencyMs,
        message: `Successfully connected to Ollama instance at ${config.baseUrl} running model "${config.model}".`,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'ollama',
        model: config.model,
        latencyMs: Date.now() - start,
        message: err.message || `Failed to connect to Ollama endpoint at ${config.baseUrl}.`,
      };
    }
  }

  async generateStory(
    options: StoryPromptOptions,
    settings?: Partial<AISettings>,
  ): Promise<{ story: StoryDocument; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }> {
    const config = this.resolveConfig(settings);
    const { system, user } = buildStoryPrompt(options);

    const { text, tokensUsed, latencyMs } = await this.executeChatCompletion(system, user, config);
    const story = extractAndValidateJson(text, StoryDocumentSchema);

    return {
      story,
      metadata: {
        stage: 'story',
        provider: 'ollama',
        model: config.model,
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

    const { text, tokensUsed, latencyMs } = await this.executeChatCompletion(system, user, config);
    const script = extractAndValidateJson(text, ScriptDocumentSchema);

    return {
      script,
      metadata: {
        stage: 'script',
        provider: 'ollama',
        model: config.model,
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

    const { text, tokensUsed, latencyMs } = await this.executeChatCompletion(system, user, config);
    const scenesArraySchema = z.array(StructuredSceneSchema);
    const scenes = extractAndValidateJson(text, scenesArraySchema);

    return {
      scenes,
      metadata: {
        stage: 'scene_breakdown',
        provider: 'ollama',
        model: config.model,
        promptSnippet: script.title,
        tokensUsed,
        latencyMs,
        status: 'success',
      },
    };
  }
}

