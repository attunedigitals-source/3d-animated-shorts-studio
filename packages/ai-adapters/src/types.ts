import {
  StoryPromptOptions,
  StoryDocument,
  ScriptDocument,
  StructuredScene,
  AIGenerationMetadata,
  AISettings,
  TestConnectionResponse,
  AI33TTSRequest,
  AI33DialogueRequest,
  AI33Voice,
  AI33VoiceProvider,
  VoiceSynthesisResult,
} from '@studio/types';

export interface IAIProviderAdapter {
  readonly providerName: string;

  generateStory(
    options: StoryPromptOptions,
    settings?: Partial<AISettings>,
  ): Promise<{ story: StoryDocument; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }>;

  generateScript(
    story: StoryDocument,
    targetDurationSeconds: number,
    settings?: Partial<AISettings>,
  ): Promise<{ script: ScriptDocument; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }>;

  breakdownScenes(
    script: ScriptDocument,
    story?: StoryDocument,
    settings?: Partial<AISettings>,
  ): Promise<{ scenes: StructuredScene[]; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }>;

  testConnection(settings: Partial<AISettings>): Promise<TestConnectionResponse>;
}

export interface IVoiceAdapter {
  readonly providerName: string;

  synthesizeSpeech(
    request: AI33TTSRequest,
    apiKey?: string,
  ): Promise<VoiceSynthesisResult>;

  synthesizeDialogue(
    request: AI33DialogueRequest,
    apiKey?: string,
  ): Promise<VoiceSynthesisResult>;

  listVoices(
    options?: {
      provider?: AI33VoiceProvider;
      language?: string;
      gender?: string;
      search?: string;
    },
    apiKey?: string,
  ): Promise<AI33Voice[]>;

  testConnection(apiKey?: string): Promise<{ connected: boolean; message?: string }>;
}

