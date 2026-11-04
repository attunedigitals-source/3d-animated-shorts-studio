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

export class OpenAICompatibleAdapter implements IAIProviderAdapter {
  readonly providerName = 'openai';

  private resolveConfig(settings?: Partial<AISettings>) {
    const apiKey = settings?.apiKey || getEnv('OPENAI_API_KEY') || 'no-key-required';
    const baseUrl = settings?.baseUrl || getEnv('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    const model = settings?.model || getEnv('OPENAI_DEFAULT_MODEL') || 'gpt-4o';
    const timeoutMs = settings?.timeoutMs || Number(getEnv('AI_REQUEST_TIMEOUT_MS')) || 60000;
    const temperature = settings?.temperature ?? 0.7;

    return { apiKey, baseUrl, model, timeoutMs, temperature };
  }

  private async executeChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config: ReturnType<typeof this.resolveConfig>,
  ): Promise<{ text: string; tokensUsed?: number; latencyMs: number }> {
    if (config.baseUrl.includes('openai.com') && (!config.apiKey || config.apiKey.includes('placeholder'))) {
      throw new Error(
        'OpenAI API key is not configured. Please supply an OPENAI_API_KEY in your environment or Settings panel.',
      );
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature: config.temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API request failed [HTTP ${response.status}]: ${errorText.slice(0, 300)}`);
      }

      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('OpenAI returned an empty response with no completion text.');
      }

      const tokensUsed = data.usage?.total_tokens;
      return { text, tokensUsed, latencyMs };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`OpenAI request timed out after ${config.timeoutMs / 1000} seconds.`);
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
        provider: 'openai',
        model: config.model,
        latencyMs: result.latencyMs,
        message: `Successfully connected to OpenAI-compatible endpoint using model "${config.model}".`,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'openai',
        model: config.model,
        latencyMs: Date.now() - start,
        message: err.message || 'Failed to connect to OpenAI endpoint.',
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
        provider: 'openai',
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
        provider: 'openai',
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
        provider: 'openai',
        model: config.model,
        promptSnippet: script.title,
        tokensUsed,
        latencyMs,
        status: 'success',
      },
    };
  }
}

