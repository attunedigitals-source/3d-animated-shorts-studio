import {
  AI33TTSRequest,
  AI33DialogueRequest,
  AI33Voice,
  AI33VoiceProvider,
  VoiceSynthesisResult,
} from '@studio/types';
import { IVoiceAdapter } from './types';

/**
 * AI33.pro Unified v3 Voice API Adapter.
 * Integrates ElevenLabs, Minimax, Clone, Edge, Kokoro, Vbee, and FishAudio voice models
 * into the 3D Animated Shorts Studio pipeline.
 */
const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export class AI33VoiceAdapter implements IVoiceAdapter {
  readonly providerName = 'ai33';
  private readonly defaultBaseUrl = 'https://api.ai33.pro/v3';

  constructor(private readonly apiKey?: string, private readonly baseUrl?: string) {}

  private getEffectiveApiKey(overrideKey?: string): string {
    const key = overrideKey || this.apiKey || getEnv('AI33_API_KEY');
    if (!key || key.includes('placeholder')) {
      throw new Error('AI33_API_KEY is not configured or contains placeholder value.');
    }
    return key;
  }

  private getEffectiveBaseUrl(): string {
    return this.baseUrl || getEnv('AI33_BASE_URL') || this.defaultBaseUrl;
  }

  /**
   * Synthesize single speaker speech via POST /v3/text-to-speech (FormData)
   */
  async synthesizeSpeech(
    request: AI33TTSRequest,
    overrideApiKey?: string,
  ): Promise<VoiceSynthesisResult> {
    const apiKey = this.getEffectiveApiKey(overrideApiKey);
    const url = `${this.getEffectiveBaseUrl()}/text-to-speech`;

    const formData = new FormData();
    formData.append('text', request.text);
    formData.append('voice_id', request.voice_id);
    formData.append('speed', String(request.speed ?? 1));
    formData.append('with_transcript', String(Boolean(request.with_transcript)));

    if (request.file_name) formData.append('file_name', request.file_name);
    if (request.receive_url) formData.append('receive_url', request.receive_url);
    if (request.pronunciation_dictionary_id !== undefined) {
      formData.append('pronunciation_dictionary_id', String(request.pronunciation_dictionary_id));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`ai33.pro TTS error (${response.status}): ${errText}`);
    }

    const json = (await response.json()) as { success: boolean; task_id: string; message?: string };
    const wordCount = request.text.trim().split(/\s+/).length;
    const estimatedDuration = Math.max(1, Math.round((wordCount / 140) * 60 / (request.speed ?? 1)));

    return {
      taskId: json.task_id,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  /**
   * Synthesize multi-speaker dialogue via POST /v3/text-to-speech/dialogue (FormData)
   */
  async synthesizeDialogue(
    request: AI33DialogueRequest,
    overrideApiKey?: string,
  ): Promise<VoiceSynthesisResult> {
    const apiKey = this.getEffectiveApiKey(overrideApiKey);
    const url = `${this.getEffectiveBaseUrl()}/text-to-speech/dialogue`;

    const formData = new FormData();
    formData.append('text', request.text);
    formData.append('speakers', JSON.stringify(request.speakers));
    formData.append('delay', String(request.delay ?? 0));
    formData.append('with_transcript', String(Boolean(request.with_transcript)));

    if (request.file_name) formData.append('file_name', request.file_name);
    if (request.receive_url) formData.append('receive_url', request.receive_url);
    if (request.pronunciation_dictionary_id !== undefined) {
      formData.append('pronunciation_dictionary_id', String(request.pronunciation_dictionary_id));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`ai33.pro Dialogue error (${response.status}): ${errText}`);
    }

    const json = (await response.json()) as { success: boolean; task_id: string; message?: string };
    const wordCount = request.text.trim().split(/\s+/).length;
    const speakerGaps = (request.speakers.length - 1) * (request.delay ?? 0);
    const estimatedDuration = Math.max(1, Math.round((wordCount / 140) * 60 + speakerGaps));

    return {
      taskId: json.task_id,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  /**
   * Retrieve normalized voice catalog via GET /v3/voices
   */
  async listVoices(
    options?: {
      provider?: AI33VoiceProvider;
      language?: string;
      gender?: string;
      search?: string;
    },
    overrideApiKey?: string,
  ): Promise<AI33Voice[]> {
    const apiKey = this.getEffectiveApiKey(overrideApiKey);
    const params = new URLSearchParams();

    if (options?.provider) params.append('provider', options.provider);
    if (options?.language) params.append('language', options.language);
    if (options?.gender) params.append('gender', options.gender);
    if (options?.search) params.append('search', options.search);

    const url = `${this.getEffectiveBaseUrl()}/voices?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`ai33.pro list voices error (${response.status}): ${errText}`);
    }

    const json = (await response.json()) as { success: boolean; data: AI33Voice[] };
    return json.data || [];
  }

  /**
   * Test API connectivity
   */
  async testConnection(overrideApiKey?: string): Promise<{ connected: boolean; message?: string }> {
    try {
      const apiKey = this.getEffectiveApiKey(overrideApiKey);
      const url = `${this.getEffectiveBaseUrl()}/voices?provider=edge&page=1&limit=1`;
      const response = await fetch(url, {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (response.ok) {
        return { connected: true, message: 'ai33.pro API connected successfully.' };
      }
      return { connected: false, message: `ai33.pro API responded with status ${response.status}.` };
    } catch (err: any) {
      return { connected: false, message: err.message };
    }
  }
}

