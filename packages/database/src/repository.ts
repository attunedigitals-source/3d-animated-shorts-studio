import {
  CreateProjectInput,
  FullProjectDetails,
  ProjectSummary,
  UpdateProjectInput,
  StoryDocument,
  StoryRecord,
  ScriptDocument,
  ScriptRecord,
  StructuredScene,
  AIGenerationMetadata,
  UserProfile,
} from '@studio/types';

export interface IDatabaseRepository {
  // Profiles
  getProfile(userId: string): Promise<UserProfile | null>;
  upsertProfile(profile: UserProfile): Promise<UserProfile>;

  // Projects
  getProjects(userId: string): Promise<ProjectSummary[]>;
  getProject(projectId: string, userId: string): Promise<FullProjectDetails | null>;
  createProject(userId: string, input: CreateProjectInput): Promise<ProjectSummary>;
  updateProject(projectId: string, userId: string, input: UpdateProjectInput): Promise<ProjectSummary>;
  deleteProject(projectId: string, userId: string): Promise<boolean>;
  duplicateProject(projectId: string, userId: string): Promise<ProjectSummary>;

  // Stories
  saveStory(projectId: string, userId: string, story: StoryDocument): Promise<StoryRecord>;
  getStory(projectId: string, userId: string): Promise<StoryDocument | null>;

  // Scripts
  saveScript(projectId: string, userId: string, script: ScriptDocument): Promise<ScriptRecord>;
  getScript(projectId: string, userId: string): Promise<ScriptDocument | null>;

  // Scenes
  saveScenes(projectId: string, userId: string, scenes: StructuredScene[]): Promise<StructuredScene[]>;
  getScenes(projectId: string, userId: string): Promise<StructuredScene[]>;
  updateScene(sceneId: string, projectId: string, userId: string, scene: Partial<StructuredScene>): Promise<StructuredScene>;

  // AI Records
  recordAIGeneration(record: Omit<AIGenerationMetadata, 'id' | 'createdAt'>): Promise<AIGenerationMetadata>;
  getAIGenerationRecords(userId: string, limit?: number): Promise<AIGenerationMetadata[]>;

  // Health
  isHealthy(): Promise<boolean>;
  isDevFallback(): boolean;
}

