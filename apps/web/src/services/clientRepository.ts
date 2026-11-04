/**
 * Client-Side Direct Repository & AI Execution Engine
 *
 * Provides direct browser-side data persistence (via Supabase client or LocalStorage)
 * and direct AI story/script/scene generation (via OpenRouter or deterministic Mock engine)
 * when running in standalone web mode or when the backend server is unreachable.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreateProjectInput,
  FullProjectDetails,
  ProjectSummary,
  ProjectPreferences,
  UpdateProjectInput,
  StoryPromptOptions,
  StoryDocument,
  StoryRecord,
  ScriptDocument,
  ScriptRecord,
  StructuredScene,
  AISettings,
} from '@studio/types';
import {
  OpenRouterAIAdapter,
  MockAIAdapter,
  IAIProviderAdapter,
} from '@studio/ai-adapters';

const LOCAL_PROJECTS_KEY = 'studio_local_projects';

const DEFAULT_PREFERENCES: ProjectPreferences = {
  category: 'Comedy',
  targetDurationSeconds: 30,
  intendedAudience: 'General Audience',
  tone: 'Humorous and Whimsical',
  visualStyle: 'Stylized 3D Cartoon',
  language: 'English',
  aspectRatio: '9:16',
  fps: 30,
};

export class ClientRepository {
  private supabaseClient: SupabaseClient | null = null;
  private currentSupabaseUrl: string = '';
  private currentSupabaseKey: string = '';

  constructor() {
    this.refreshSupabaseClient();
  }

  refreshSupabaseClient() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem('studio_supabase_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        const url = parsed.supabaseUrl?.trim();
        const key = parsed.supabaseAnonKey?.trim();

        if (url && key && !url.includes('your-project-id') && !key.includes('placeholder')) {
          if (this.currentSupabaseUrl !== url || this.currentSupabaseKey !== key) {
            this.supabaseClient = createClient(url, key, { auth: { persistSession: false } });
            this.currentSupabaseUrl = url;
            this.currentSupabaseKey = key;
          }
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    this.supabaseClient = null;
    this.currentSupabaseUrl = '';
    this.currentSupabaseKey = '';
  }

  isSupabaseActive(): boolean {
    this.refreshSupabaseClient();
    return Boolean(this.supabaseClient);
  }

  // ----------------------------------------------------
  // Projects
  // ----------------------------------------------------

  async getProjects(userId: string = 'dev-user-001'): Promise<ProjectSummary[]> {
    this.refreshSupabaseClient();

    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('projects')
          .select('*, stories(id), scripts(id, total_estimated_duration_seconds), scenes(id)')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            userId: p.user_id || userId,
            title: p.title,
            description: p.description || '',
            status: p.status,
            preferences: p.preferences || DEFAULT_PREFERENCES,
            sceneCount: p.scenes ? p.scenes.length : 0,
            hasStory: Boolean(p.stories && p.stories.length > 0),
            hasScript: Boolean(p.scripts && p.scripts.length > 0),
            estimatedDurationSeconds: p.scripts?.[0]?.total_estimated_duration_seconds || p.preferences?.targetDurationSeconds || 30,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));
        }
      } catch (err) {
        console.warn('[ClientRepository] Supabase getProjects failed, falling back to LocalStorage:', err);
      }
    }

    // LocalStorage fallback
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_PROJECTS_KEY) : null;
    const projects: FullProjectDetails[] = raw ? JSON.parse(raw) : [];
    return projects
      .filter((p) => p.userId === userId || !p.userId)
      .map((p) => ({
        id: p.id,
        userId: p.userId || userId,
        title: p.title,
        description: p.description,
        status: p.status,
        preferences: p.preferences || DEFAULT_PREFERENCES,
        sceneCount: p.scenes.length,
        hasStory: Boolean(p.story),
        hasScript: Boolean(p.script),
        estimatedDurationSeconds: p.script?.totalEstimatedDurationSeconds || p.preferences.targetDurationSeconds,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getProject(projectId: string): Promise<FullProjectDetails> {
    this.refreshSupabaseClient();

    if (this.supabaseClient) {
      try {
        const { data: p, error } = await this.supabaseClient
          .from('projects')
          .select('*, stories(*), scripts(*), scenes(*)')
          .eq('id', projectId)
          .single();

        if (!error && p) {
          const storyData = p.stories?.[0]?.story_data;
          const scriptData = p.scripts?.[0]?.script_data;
          const scenesData = p.scenes ? p.scenes.map((s: any) => s.scene_data) : [];

          const prefs = p.preferences || DEFAULT_PREFERENCES;
          return {
            id: p.id,
            userId: p.user_id,
            title: p.title,
            description: p.description || '',
            status: p.status,
            preferences: prefs,
            sceneCount: scenesData.length,
            hasStory: Boolean(storyData),
            hasScript: Boolean(scriptData),
            estimatedDurationSeconds: scriptData?.totalEstimatedDurationSeconds || prefs.targetDurationSeconds,
            story: storyData,
            script: scriptData,
            scenes: scenesData,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          };
        }
      } catch (err) {
        console.warn('[ClientRepository] Supabase getProject error, falling back:', err);
      }
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_PROJECTS_KEY) : null;
    const projects: FullProjectDetails[] = raw ? JSON.parse(raw) : [];
    const found = projects.find((p) => p.id === projectId);
    if (!found) throw new Error(`Project ${projectId} not found.`);
    return found;
  }

  async createProject(input: CreateProjectInput, userId: string = 'dev-user-001'): Promise<ProjectSummary> {
    this.refreshSupabaseClient();
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const preferences: ProjectPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(input.preferences || {}),
    };

    const fullProject: FullProjectDetails = {
      id,
      userId,
      title: input.title,
      description: input.description || '',
      status: 'draft',
      preferences,
      sceneCount: 0,
      hasStory: false,
      hasScript: false,
      estimatedDurationSeconds: preferences.targetDurationSeconds,
      scenes: [],
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabaseClient) {
      try {
        const { error } = await this.supabaseClient.from('projects').insert({
          id,
          user_id: userId,
          title: fullProject.title,
          description: fullProject.description,
          status: fullProject.status,
          preferences: fullProject.preferences,
          created_at: now,
          updated_at: now,
        });

        if (!error) {
          return {
            id,
            userId,
            title: fullProject.title,
            description: fullProject.description,
            status: fullProject.status,
            preferences: fullProject.preferences,
            sceneCount: 0,
            hasStory: false,
            hasScript: false,
            estimatedDurationSeconds: preferences.targetDurationSeconds,
            createdAt: now,
            updatedAt: now,
          };
        }
      } catch (err) {
        console.warn('[ClientRepository] Supabase createProject failed, storing locally:', err);
      }
    }

    // Local fallback
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
      const projects: FullProjectDetails[] = raw ? JSON.parse(raw) : [];
      projects.push(fullProject);
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    }

    return {
      id,
      userId,
      title: fullProject.title,
      description: fullProject.description,
      status: fullProject.status,
      preferences: fullProject.preferences,
      sceneCount: 0,
      hasStory: false,
      hasScript: false,
      estimatedDurationSeconds: preferences.targetDurationSeconds,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateProject(projectId: string, input: UpdateProjectInput): Promise<ProjectSummary> {
    this.refreshSupabaseClient();
    const now = new Date().toISOString();

    if (this.supabaseClient) {
      try {
        const updateData: any = { updated_at: now };
        if (input.title) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.status) updateData.status = input.status;
        if (input.preferences) updateData.preferences = input.preferences;

        await this.supabaseClient.from('projects').update(updateData).eq('id', projectId);
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
      const projects: FullProjectDetails[] = raw ? JSON.parse(raw) : [];
      const index = projects.findIndex((p) => p.id === projectId);
      if (index !== -1) {
        const p = projects[index]!;
        if (input.title) p.title = input.title;
        if (input.description !== undefined) p.description = input.description;
        if (input.status) p.status = input.status;
        if (input.preferences) p.preferences = { ...p.preferences, ...input.preferences };
        p.updatedAt = now;
        projects[index] = p;
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        return {
          id: p.id,
          userId: p.userId,
          title: p.title,
          description: p.description,
          status: p.status,
          preferences: p.preferences,
          sceneCount: p.scenes.length,
          hasStory: Boolean(p.story),
          hasScript: Boolean(p.script),
          estimatedDurationSeconds: p.script?.totalEstimatedDurationSeconds || p.preferences.targetDurationSeconds,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      }
    }

    return {
      id: projectId,
      userId: 'dev-user-001',
      title: input.title || 'Updated Project',
      description: input.description || '',
      status: input.status || 'draft',
      preferences: DEFAULT_PREFERENCES,
      sceneCount: 0,
      hasStory: false,
      hasScript: false,
      estimatedDurationSeconds: 30,
      createdAt: now,
      updatedAt: now,
    };
  }

  async deleteProject(projectId: string): Promise<void> {
    this.refreshSupabaseClient();
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('projects').delete().eq('id', projectId);
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (raw) {
        const projects: FullProjectDetails[] = JSON.parse(raw);
        const filtered = projects.filter((p) => p.id !== projectId);
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(filtered));
      }
    }
  }

  // ----------------------------------------------------
  // Story, Script & Scene Operations
  // ----------------------------------------------------

  private getAIAdapterInstance(settings?: Partial<AISettings>): IAIProviderAdapter {
    const provider = settings?.provider || 'openrouter';
    const apiKey = settings?.apiKey || '';

    if (provider === 'mock' || !apiKey || apiKey.includes('placeholder')) {
      return new MockAIAdapter();
    }

    return new OpenRouterAIAdapter();
  }

  async generateStory(
    projectId: string,
    options: StoryPromptOptions,
    settings?: Partial<AISettings>,
  ): Promise<{ story: StoryRecord }> {
    const adapter = this.getAIAdapterInstance(settings);
    const { story } = await adapter.generateStory(options, settings);

    const now = new Date().toISOString();
    const record: StoryRecord = {
      ...story,
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveStory(projectId, story, options);
    return { story: record };
  }

  async saveStory(
    projectId: string,
    story: StoryDocument,
    promptOptions?: StoryPromptOptions,
  ): Promise<StoryRecord> {
    this.refreshSupabaseClient();
    const now = new Date().toISOString();

    const record: StoryRecord = {
      ...story,
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('stories').upsert({
          id: record.id,
          project_id: projectId,
          story_data: story,
          prompt_options: promptOptions || {
            topic: story.premise || story.title,
            category: 'Comedy',
            targetDurationSeconds: 30,
            intendedAudience: 'General Audience',
            tone: 'Humorous',
            visualStyle: 'Stylized 3D Cartoon',
            language: 'English',
          },
          updated_at: now,
        });
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (raw) {
        const projects: FullProjectDetails[] = JSON.parse(raw);
        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
          proj.story = story;
          proj.hasStory = true;
          proj.updatedAt = now;
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        }
      }
    }

    return record;
  }

  async generateScript(
    projectId: string,
    targetDurationSeconds: number = 30,
    settings?: Partial<AISettings>,
  ): Promise<{ script: ScriptRecord }> {
    const project = await this.getProject(projectId);
    if (!project.story) {
      throw new Error('Please create or load an approved story before generating a script.');
    }

    const adapter = this.getAIAdapterInstance(settings);
    const { script } = await adapter.generateScript(project.story, targetDurationSeconds, settings);

    const now = new Date().toISOString();
    const record: ScriptRecord = {
      ...script,
      id: `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      revisionNumber: 1,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveScript(projectId, script);
    return { script: record };
  }

  async saveScript(projectId: string, script: ScriptDocument): Promise<ScriptRecord> {
    this.refreshSupabaseClient();
    const now = new Date().toISOString();

    const record: ScriptRecord = {
      ...script,
      id: `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      revisionNumber: 1,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('scripts').upsert({
          id: record.id,
          project_id: projectId,
          script_data: script,
          total_estimated_duration_seconds: script.totalEstimatedDurationSeconds,
          updated_at: now,
        });
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (raw) {
        const projects: FullProjectDetails[] = JSON.parse(raw);
        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
          proj.script = script;
          proj.hasScript = true;
          proj.estimatedDurationSeconds = script.totalEstimatedDurationSeconds;
          proj.updatedAt = now;
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        }
      }
    }

    return record;
  }

  async breakdownScenes(projectId: string, settings?: Partial<AISettings>): Promise<{ scenes: StructuredScene[] }> {
    const project = await this.getProject(projectId);
    if (!project.script) {
      throw new Error('Please create or load an approved script before breaking down scenes.');
    }

    const adapter = this.getAIAdapterInstance(settings);
    const { scenes } = await adapter.breakdownScenes(project.script, project.story, settings);

    await this.saveScenes(projectId, scenes);
    return { scenes };
  }

  async saveScenes(projectId: string, scenes: StructuredScene[]): Promise<StructuredScene[]> {
    this.refreshSupabaseClient();
    const now = new Date().toISOString();

    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('scenes').delete().eq('project_id', projectId);
        if (scenes.length > 0) {
          await this.supabaseClient.from('scenes').insert(
            scenes.map((s) => ({
              id: s.id,
              project_id: projectId,
              scene_number: s.sceneNumber,
              scene_data: s,
              created_at: now,
              updated_at: now,
            })),
          );
        }
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (raw) {
        const projects: FullProjectDetails[] = JSON.parse(raw);
        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
          proj.scenes = scenes;
          proj.sceneCount = scenes.length;
          proj.updatedAt = now;
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        }
      }
    }

    return scenes;
  }
}

export const clientRepository = new ClientRepository();
