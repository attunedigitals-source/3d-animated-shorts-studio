import {
  AI33TTSRequest,
  AI33DialogueRequest,
  AI33Voice,
  AI33VoiceProvider,
  VoiceSynthesisResult,
} from '@studio/types';
import { IVoiceAdapter } from './types';

/**
 * Mock Voice Adapter for deterministic offline testing and local development.
 */
export class MockVoiceAdapter implements IVoiceAdapter {
  readonly providerName = 'mock';

  private mockVoices: AI33Voice[] = [
    {
      voice_id: 'minimax_male-qn-qingse',
      name: 'Qingse (Expressive Cartoon Male)',
      language: 'en-US',
      gender: 'Male',
      tags: ['cartoon', 'expressive', 'minimax'],
      preview_url: 'https://example.com/previews/minimax-male.mp3',
    },
    {
      voice_id: 'edge_en-US-GuyNeural',
      name: 'Guy Neural (Clear Friendly)',
      language: 'en-US',
      gender: 'Male',
      tags: ['narrator', 'edge', 'standard'],
      preview_url: 'https://example.com/previews/edge-guy.mp3',
    },
    {
      voice_id: 'elevenlabs_hpp4J3VqNfWAUOO0d1Us',
      name: 'Barnaby Bot (Robotic Whimsical)',
      language: 'en-US',
      gender: 'Male',
      tags: ['robot', 'elevenlabs', 'character'],
      preview_url: 'https://example.com/previews/elevenlabs-bot.mp3',
    },
    {
      voice_id: 'kokoro_female-sweet',
      name: 'Sweet Lily (Playful Cartoon Female)',
      language: 'en-US',
      gender: 'Female',
      tags: ['cartoon', 'kokoro', 'playful'],
      preview_url: 'https://example.com/previews/kokoro-female.mp3',
    },
  ];

  async synthesizeSpeech(request: AI33TTSRequest): Promise<VoiceSynthesisResult> {
    const wordCount = request.text.trim().split(/\s+/).length;
    const duration = Math.max(1, Math.round((wordCount / 140) * 60 / (request.speed ?? 1)));

    return {
      taskId: `mock-task-${Date.now()}`,
      durationSeconds: duration,
      format: 'mp3',
      audioUrl: `https://mock.storage.local/audio/tts-${Date.now()}.mp3`,
      transcript: {
        text: request.text,
      },
    };
  }

  async synthesizeDialogue(request: AI33DialogueRequest): Promise<VoiceSynthesisResult> {
    const wordCount = request.text.trim().split(/\s+/).length;
    const speakerGaps = (request.speakers.length - 1) * (request.delay ?? 0);
    const duration = Math.max(1, Math.round((wordCount / 140) * 60 + speakerGaps));

    return {
      taskId: `mock-dialogue-task-${Date.now()}`,
      durationSeconds: duration,
      format: 'mp3',
      audioUrl: `https://mock.storage.local/audio/dialogue-${Date.now()}.mp3`,
      transcript: {
        text: request.text,
      },
    };
  }

  async listVoices(options?: {
    provider?: AI33VoiceProvider;
    language?: string;
    gender?: string;
    search?: string;
  }): Promise<AI33Voice[]> {
    let list = [...this.mockVoices];
    if (options?.provider) {
      list = list.filter((v) => v.voice_id.startsWith(`${options.provider}_`));
    }
    if (options?.gender) {
      list = list.filter((v) => v.gender?.toLowerCase() === options.gender?.toLowerCase());
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.voice_id.toLowerCase().includes(q));
    }
    return list;
  }

  async testConnection(): Promise<{ connected: boolean; message?: string }> {
    return {
      connected: true,
      message: 'Mock Voice Adapter is online and operating deterministically.',
    };
  }
}

