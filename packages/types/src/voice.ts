import { z } from 'zod';

/**
 * Supported underlying voice engines accessible through the ai33.pro Unified v3 API.
 */
export const AI33_VOICE_PROVIDERS = [
  'elevenlabs',
  'minimax',
  'clone',
  'edge',
  'kokoro',
  'vbee',
  'fishaudio',
] as const;

export type AI33VoiceProvider = (typeof AI33_VOICE_PROVIDERS)[number];

/**
 * Normalized Voice Model definition from the ai33.pro Voice Library.
 */
export const AI33VoiceSchema = z.object({
  voice_id: z.string().describe('Prefixed voice identifier (e.g. minimax_male-qn-qingse, edge_vi-VN-HoaiMyNeural)'),
  name: z.string(),
  language: z.string(),
  gender: z.string().optional(),
  tags: z.array(z.string()).default([]),
  preview_url: z.string().url().optional(),
});

export type AI33Voice = z.infer<typeof AI33VoiceSchema>;

/**
 * Text-to-Speech synthesis request payload.
 */
export const AI33TTSRequestSchema = z.object({
  voice_id: z.string().min(1, 'voice_id is required and must include provider prefix'),
  text: z.string().min(1).max(1000000, 'text cannot exceed 1,000,000 characters'),
  speed: z.number().min(0.5).max(1.5).default(1),
  with_transcript: z.boolean().default(false),
  file_name: z.string().optional(),
  receive_url: z.string().url().optional(),
  pronunciation_dictionary_id: z.number().optional(),
});

export type AI33TTSRequest = z.infer<typeof AI33TTSRequestSchema>;

/**
 * Speaker specification for multi-speaker dialogue synthesis.
 */
export const AI33SpeakerSchema = z.object({
  voice_id: z.string().min(1, 'Speaker voice_id is required'),
  speed: z.number().min(0.5).max(1.5).default(1),
});

export type AI33Speaker = z.infer<typeof AI33SpeakerSchema>;

/**
 * Multi-speaker dialogue synthesis request payload.
 * Text uses speaker labels (A>, B>, C>) mapping to the speakers array by index.
 */
export const AI33DialogueRequestSchema = z.object({
  text: z.string().min(1, 'Dialogue script is required (e.g. A> Line 1\nB> Line 2)'),
  speakers: z.array(AI33SpeakerSchema).min(2, 'Multi-speaker dialogue requires at least 2 speakers'),
  delay: z.number().min(0).max(5).default(0).describe('Gap between speakers in seconds'),
  with_transcript: z.boolean().default(false),
  file_name: z.string().optional(),
  receive_url: z.string().url().optional(),
  pronunciation_dictionary_id: z.number().optional(),
});

export type AI33DialogueRequest = z.infer<typeof AI33DialogueRequestSchema>;

/**
 * Response returned when initiating asynchronous TTS or Dialogue tasks.
 */
export const AI33TaskResponseSchema = z.object({
  success: z.boolean(),
  task_id: z.string(),
  message: z.string().optional(),
});

export type AI33TaskResponse = z.infer<typeof AI33TaskResponseSchema>;

/**
 * Pronunciation rule for brand names, acronyms, and custom cartoon terminology.
 */
export const AI33PronunciationRuleSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  matchType: z.enum(['word', 'contains']).default('word'),
  caseSensitive: z.boolean().default(false),
});

export type AI33PronunciationRule = z.infer<typeof AI33PronunciationRuleSchema>;

/**
 * Pronunciation Dictionary specification.
 */
export const AI33PronunciationDictionarySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  rules: z.array(AI33PronunciationRuleSchema),
});

export type AI33PronunciationDictionary = z.infer<typeof AI33PronunciationDictionarySchema>;

/**
 * Generic voice synthesis result for pipeline consumption.
 */
export interface VoiceSynthesisResult {
  audioUrl?: string;
  audioBuffer?: Buffer;
  durationSeconds: number;
  format: 'mp3' | 'wav';
  taskId?: string;
  transcript?: {
    words?: Array<{ word: string; start: number; end: number }>;
    text?: string;
  };
}

