import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
import { IDatabaseRepository } from './repository';

interface DevStoreSchema {
  profiles: Record<string, UserProfile>;
  projects: Record<string, ProjectSummary & { userId: string }>;
  stories: Record<string, StoryRecord>; // keyed by projectId
  scripts: Record<string, ScriptRecord>; // keyed by projectId
  scenes: Record<string, StructuredScene[]>; // keyed by projectId
  aiRecords: AIGenerationMetadata[];
}

export class DevDatabaseRepository implements IDatabaseRepository {
  private store: DevStoreSchema;
  private filePath: string;

  constructor(customPath?: string) {
    this.filePath = customPath || path.resolve(process.cwd(), '.temp', 'dev_store.json');
    this.store = {
      profiles: {},
      projects: {},
      stories: {},
      scripts: {},
      scenes: {},
      aiRecords: [],
    };
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.store = JSON.parse(raw);
      }
    } catch {
      // In case of read/parse error, initialize empty
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in restricted environments
    }
  }

  isDevFallback(): boolean {
    return true;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.store.profiles[userId] || null;
  }

  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    this.store.profiles[profile.id] = profile;
    this.save();
    return profile;
  }

  async getProjects(userId: string): Promise<ProjectSummary[]> {
    return Object.values(this.store.projects)
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((p) => {
        const story = this.store.stories[p.id];
        const script = this.store.scripts[p.id];
        const scenes = this.store.scenes[p.id] || [];
        return {
          ...p,
          hasStory: Boolean(story),
          hasScript: Boolean(script),
          sceneCount: scenes.length,
          estimatedDurationSeconds: script?.totalEstimatedDurationSeconds || p.preferences.targetDurationSeconds,
        };
      });
  }

  async getProject(projectId: string, userId: string): Promise<FullProjectDetails | null> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) {
      return null;
    }

    const story = this.store.stories[projectId];
    const script = this.store.scripts[projectId];
    const scenes = this.store.scenes[projectId] || [];

    return {
      ...project,
      hasStory: Boolean(story),
      hasScript: Boolean(script),
      sceneCount: scenes.length,
      estimatedDurationSeconds: script?.totalEstimatedDurationSeconds || project.preferences.targetDurationSeconds,
      story,
      script,
      scenes,
    };
  }

  async createProject(userId: string, input: CreateProjectInput): Promise<ProjectSummary> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const preferences = {
      category: 'Comedy',
      targetDurationSeconds: 30,
      intendedAudience: 'General Audience',
      tone: 'Humorous and Whimsical',
      visualStyle: 'Stylized 3D Cartoon',
      language: 'English',
      aspectRatio: '9:16' as const,
      fps: 30,
      ...(input.preferences || {}),
    };

    const project: ProjectSummary & { userId: string } = {
      id,
      userId,
      title: input.title,
      description: input.description,
      status: 'draft',
      preferences,
      createdAt: now,
      updatedAt: now,
      sceneCount: 0,
      hasStory: false,
      hasScript: false,
      estimatedDurationSeconds: preferences.targetDurationSeconds,
    };

    this.store.projects[id] = project;
    this.save();
    return project;
  }

  async updateProject(projectId: string, userId: string, input: UpdateProjectInput): Promise<ProjectSummary> {
    const existing = this.store.projects[projectId];
    if (!existing || existing.userId !== userId) {
      throw new Error(`Project ${projectId} not found or access denied`);
    }

    const updated: ProjectSummary & { userId: string } = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      status: input.status ?? existing.status,
      preferences: {
        ...existing.preferences,
        ...(input.preferences || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    this.store.projects[projectId] = updated;
    this.save();
    return updated;
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    const existing = this.store.projects[projectId];
    if (!existing || existing.userId !== userId) {
      return false;
    }

    delete this.store.projects[projectId];
    delete this.store.stories[projectId];
    delete this.store.scripts[projectId];
    delete this.store.scenes[projectId];
    this.save();
    return true;
  }

  async duplicateProject(projectId: string, userId: string): Promise<ProjectSummary> {
    const existing = await this.getProject(projectId, userId);
    if (!existing) {
      throw new Error(`Project ${projectId} not found or access denied`);
    }

    const cloned = await this.createProject(userId, {
      title: `${existing.title} (Copy)`,
      description: existing.description,
      preferences: existing.preferences,
    });

    if (existing.story) {
      await this.saveStory(cloned.id, userId, existing.story);
    }
    if (existing.script) {
      await this.saveScript(cloned.id, userId, existing.script);
    }
    if (existing.scenes && existing.scenes.length > 0) {
      await this.saveScenes(cloned.id, userId, existing.scenes);
    }

    return cloned;
  }

  async saveStory(projectId: string, userId: string, story: StoryDocument): Promise<StoryRecord> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) {
      throw new Error(`Project ${projectId} not found or access denied`);
    }

    const now = new Date().toISOString();
    const record: StoryRecord = {
      ...story,
      id: this.store.stories[projectId]?.id || crypto.randomUUID(),
      projectId,
      userId,
      createdAt: this.store.stories[projectId]?.createdAt || now,
      updatedAt: now,
    };

    this.store.stories[projectId] = record;
    project.status = 'story_generated';
    project.updatedAt = now;
    this.save();
    return record;
  }

  async getStory(projectId: string, userId: string): Promise<StoryDocument | null> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) return null;
    return this.store.stories[projectId] || null;
  }

  async saveScript(projectId: string, userId: string, script: ScriptDocument): Promise<ScriptRecord> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) {
      throw new Error(`Project ${projectId} not found or access denied`);
    }

    const now = new Date().toISOString();
    const existing = this.store.scripts[projectId];
    const record: ScriptRecord = {
      ...script,
      id: existing?.id || crypto.randomUUID(),
      projectId,
      storyId: this.store.stories[projectId]?.id,
      userId,
      revisionNumber: existing ? existing.revisionNumber + 1 : 1,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.store.scripts[projectId] = record;
    project.status = 'script_generated';
    project.updatedAt = now;
    this.save();
    return record;
  }

  async getScript(projectId: string, userId: string): Promise<ScriptDocument | null> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) return null;
    return this.store.scripts[projectId] || null;
  }

  async saveScenes(projectId: string, userId: string, scenes: StructuredScene[]): Promise<StructuredScene[]> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) {
      throw new Error(`Project ${projectId} not found or access denied`);
    }

    this.store.scenes[projectId] = scenes;
    project.status = 'scenes_broken_down';
    project.updatedAt = new Date().toISOString();
    this.save();
    return scenes;
  }

  async getScenes(projectId: string, userId: string): Promise<StructuredScene[]> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) return [];
    return this.store.scenes[projectId] || [];
  }

  async updateScene(
    sceneId: string,
    projectId: string,
    userId: string,
    sceneUpdate: Partial<StructuredScene>,
  ): Promise<StructuredScene> {
    const project = this.store.projects[projectId];
    if (!project || project.userId !== userId) {
      throw new Error(`Project ${projectId} not found or access denied`);
    }

    const scenes = this.store.scenes[projectId] || [];
    const index = scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    const updated = { ...scenes[index]!, ...sceneUpdate };
    scenes[index] = updated;
    this.store.scenes[projectId] = scenes;
    project.updatedAt = new Date().toISOString();
    this.save();
    return updated;
  }

  async recordAIGeneration(record: Omit<AIGenerationMetadata, 'id' | 'createdAt'>): Promise<AIGenerationMetadata> {
    const fullRecord: AIGenerationMetadata = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.store.aiRecords.unshift(fullRecord);
    if (this.store.aiRecords.length > 100) {
      this.store.aiRecords = this.store.aiRecords.slice(0, 100);
    }
    this.save();
    return fullRecord;
  }

  async getAIGenerationRecords(userId: string, limit = 20): Promise<AIGenerationMetadata[]> {
    return this.store.aiRecords.filter((r) => r.userId === userId).slice(0, limit);
  }
}
