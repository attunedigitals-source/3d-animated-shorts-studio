/**
 * ai33.pro Neural Voice Synthesis Engine (Phase 0 Repaired)
 * High-fidelity speech synthesis with millisecond word-level timestamps.
 * - Strictly rejects fake silent audio stubs.
 * - Returns structured VoiceProviderError on authentication or network failures.
 * - Honestly flags synthetic/fallback alignment as isEstimated: true.
 * - Retries retryable network failures with exponential backoff.
 */

import { AudioNarration, WordTimestamp, AssetProvenance } from '@studio/types';

export class VoiceProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly isRetryable: boolean
  ) {
    super(message);
    this.name = 'VoiceProviderError';
  }
}

export interface VoiceSynthesisOptions {
  voiceId?: string;
  speed?: number;
  overrideKey?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export class AI33VoiceEngine {
  private readonly baseUrl: string = 'https://api.ai33.pro/v3';
  private readonly defaultTimeoutMs: number = 30000;

  constructor(private readonly apiKey?: string) {}

  private getEffectiveKey(overrideKey?: string): string {
    const key = overrideKey || this.apiKey || (typeof process !== 'undefined' ? process.env.AI33_API_KEY : '');
    if (!key || key.includes('placeholder') || key.startsWith('your_') || key.length < 10) {
      return '';
    }
    return key.trim();
  }

  async synthesizeNarration(
    scriptText: string,
    options?: VoiceSynthesisOptions
  ): Promise<AudioNarration> {
    if (!scriptText || !scriptText.trim()) {
      throw new VoiceProviderError('Script text cannot be empty for voice synthesis.', 400, 'EMPTY_SCRIPT', false);
    }

    const key = this.getEffectiveKey(options?.overrideKey);
    const speed = options?.speed ?? 1.0;
    const voiceId = options?.voiceId || 'narrator-cinematic-deep-01';
    const words = scriptText.trim().split(/\s+/).filter(Boolean);
    const msPerWord = Math.round(430 / speed);

    if (!key) {
      throw new VoiceProviderError(
        'ai33.pro API key is missing or invalid. Please configure your key in Settings or environment.',
        401,
        'MISSING_VOICE_KEY',
        false
      );
    }

    const maxRetries = options?.maxRetries ?? 2;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;

    let lastError: VoiceProviderError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const formData = new FormData();
        formData.append('text', scriptText);
        formData.append('voice_id', voiceId);
        formData.append('speed', String(speed));
        formData.append('with_transcript', 'true');

        const resp = await fetch(`${this.baseUrl}/text-to-speech`, {
          method: 'POST',
          headers: {
            'xi-api-key': key,
            'Authorization': `Bearer ${key}`,
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!resp.ok) {
          const status = resp.status;
          let errMsg = `Voice provider returned HTTP ${status}`;
          try {
            const errJson = await resp.json();
            errMsg = errJson?.error?.message || errJson?.detail || errMsg;
          } catch {
            errMsg = (await resp.text().catch(() => '')) || errMsg;
          }

          if (status === 401 || status === 403) {
            throw new VoiceProviderError(
              `ai33.pro Authentication failed (${status}): ${errMsg}`,
              status,
              'AUTHENTICATION_FAILED',
              false
            );
          }

          if (status === 429) {
            lastError = new VoiceProviderError(
              `ai33.pro rate limit exceeded (429): ${errMsg}`,
              429,
              'RATE_LIMIT_EXCEEDED',
              true
            );
          } else {
            lastError = new VoiceProviderError(
              `ai33.pro synthesis error (${status}): ${errMsg}`,
              status,
              'SYNTHESIS_FAILED',
              status >= 500
            );
          }

          if (attempt < maxRetries && lastError.isRetryable) {
            const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 200);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          throw lastError;
        }

        const result = await resp.json();

        if (!result.audio_url && !result.audio && !result.audio_base64) {
          throw new VoiceProviderError(
            'ai33.pro returned 200 OK but payload is missing audio data.',
            500,
            'EMPTY_AUDIO_RESPONSE',
            false
          );
        }

        const audioUrl = result.audio_url ||
          (result.audio_base64 ? `data:audio/mp3;base64,${result.audio_base64}` : '');

        let timestamps: WordTimestamp[] = [];
        let isEstimatedAlignment = false;

        if (Array.isArray(result?.alignment?.words) && result.alignment.words.length > 0) {
          timestamps = result.alignment.words.map((w: any) => ({
            word: String(w.word || ''),
            startMs: Math.round(Number(w.start) * 1000),
            endMs: Math.round(Number(w.end) * 1000),
            isEstimated: false,
          }));
        } else {
          // Alignment not provided by server; calculate honest estimated alignment
          timestamps = this.generateEstimatedTimestamps(words, msPerWord);
          isEstimatedAlignment = true;
        }

        const totalDuration = timestamps.length > 0
          ? timestamps[timestamps.length - 1]!.endMs / 1000
          : Math.max(2, (words.length * msPerWord) / 1000);

        return {
          audioUrl,
          durationSeconds: totalDuration,
          timestamps,
          voiceModel: voiceId,
          provenance: 'ai_generated',
          isEstimatedAlignment,
        };
      } catch (err: any) {
        clearTimeout(timer);
        if (err instanceof VoiceProviderError) {
          if (!err.isRetryable || attempt >= maxRetries) throw err;
          const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 200);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
        const providerErr = new VoiceProviderError(
          isAbort ? `Voice synthesis timed out after ${timeoutMs}ms.` : `Network failure connecting to ai33.pro: ${err.message}`,
          isAbort ? 408 : 503,
          isAbort ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          true
        );

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 200);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        throw providerErr;
      }
    }

    throw lastError || new VoiceProviderError('Exceeded maximum retries for voice synthesis.', 500, 'MAX_RETRIES_EXCEEDED', false);
  }

  /**
   * Generates honest estimated timestamps with isEstimated: true flag.
   */
  generateEstimatedTimestamps(words: string[], baseMsPerWord: number): WordTimestamp[] {
    const timestamps: WordTimestamp[] = [];
    let currentMs = 0;

    for (let i = 0; i < words.length; i++) {
      const rawWord = words[i]!;
      const cleanWord = rawWord.replace(/[^a-zA-Z0-9]/g, '');
      const charLength = Math.max(2, cleanWord.length);

      let duration = Math.round(baseMsPerWord * (0.6 + charLength * 0.08));

      const hasComma = rawWord.includes(',');
      const hasPeriod = rawWord.includes('.') || rawWord.includes('!') || rawWord.includes('?');
      const hasDash = rawWord.includes('—') || rawWord.includes('-');

      if (hasPeriod) duration += 280;
      else if (hasComma || hasDash) duration += 150;

      timestamps.push({
        word: rawWord,
        startMs: currentMs,
        endMs: currentMs + duration,
        isEstimated: true,
      });

      currentMs += duration + 40;
    }

    return timestamps;
  }
}
