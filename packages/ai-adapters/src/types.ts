import {
  StoryPromptOptions,
  StoryDocument,
  ScriptDocument,
  StructuredScene,
  AIGenerationMetadata,
  AISettings,
  TestConnectionResponse,
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

