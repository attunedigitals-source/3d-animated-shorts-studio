import { SupabaseClient } from '@supabase/supabase-js';
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

export class SupabaseDatabaseRepository implements IDatabaseRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  isDevFallback(): boolean {
    return false;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const { error } = await this.client.from('projects').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name || data.email,
      createdAt: data.created_at,
    };
  }

  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('profiles')
      .upsert({
        id: profile.id,
        email: profile.email,
        display_name: profile.displayName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert profile: ${error.message}`);
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      createdAt: data.created_at,
    };
  }

  async getProjects(userId: string): Promise<ProjectSummary[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*, stories(id), scripts(id, total_estimated_duration_seconds), scenes(id)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch projects: ${error.message}`);

    return (data || []).map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      title: p.title,
      description: p.description,
      status: p.status,
      preferences: p.preferences,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      hasStory: Boolean(p.stories && p.stories.length > 0),
      hasScript: Boolean(p.scripts && p.scripts.length > 0),
      sceneCount: p.scenes ? p.scenes.length : 0,
      estimatedDurationSeconds:
        p.scripts?.[0]?.total_estimated_duration_seconds || p.preferences?.targetDurationSeconds || 30,
    }));
  }

  async getProject(projectId: string, userId: string): Promise<FullProjectDetails | null> {
    const { data: project, error: pError } = await this.client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (pError || !project) return null;

    const [storyRes, scriptRes, scenesRes] = await Promise.all([
      this.client.from('stories').select('*').eq('project_id', projectId).maybeSingle(),
      this.client.from('scripts').select('*').eq('project_id', projectId).order('revision_number', { ascending: false }).limit(1).maybeSingle(),
      this.client.from('scenes').select('*').eq('project_id', projectId).order('scene_number', { ascending: true }),
    ]);

    const story: StoryDocument | undefined = storyRes.data
      ? {
          title: storyRes.data.title,
          logline: storyRes.data.logline,
          premise: storyRes.data.premise,
          beginning: storyRes.data.beginning,
          mainConflict: storyRes.data.main_conflict,
          turningPoints: storyRes.data.turning_points,
          climax: storyRes.data.climax,
          ending: storyRes.data.ending,
          characterDescriptions: storyRes.data.character_descriptions,
          emotionalProgression: storyRes.data.emotional_progression,
        }
      : undefined;

    const script: ScriptDocument | undefined = scriptRes.data
      ? {
          title: scriptRes.data.title,
          scenes: scriptRes.data.scenes,
          totalWordCount: scriptRes.data.total_word_count,
          totalEstimatedDurationSeconds: Number(scriptRes.data.total_estimated_duration_seconds),
          targetDurationSeconds: Number(scriptRes.data.target_duration_seconds),
        }
      : undefined;

    const scenes: StructuredScene[] = (scenesRes.data || []).map((s: any) => ({
      id: s.id,
      sceneNumber: s.scene_number,
      sceneTitle: s.scene_title,
      sceneDescription: s.scene_description,
      charactersInvolved: s.characters_involved,
      characterActions: s.character_actions,
      dialogue: s.dialogue,
      narration: s.narration,
      environmentDescription: s.environment_description,
      propsRequired: s.props_required,
      emotionalTone: s.emotional_tone,
      cameraDirectionSuggestions: s.camera_direction_suggestions,
      approximateDurationSeconds: Number(s.approximate_duration_seconds),
      continuityNotes: s.continuity_notes,
    }));

    return {
      id: project.id,
      userId: project.user_id,
      title: project.title,
      description: project.description,
      status: project.status,
      preferences: project.preferences,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      hasStory: Boolean(story),
      hasScript: Boolean(script),
      sceneCount: scenes.length,
      estimatedDurationSeconds: script?.totalEstimatedDurationSeconds || project.preferences?.targetDurationSeconds || 30,
      story,
      script,
      scenes,
    };
  }

  async createProject(userId: string, input: CreateProjectInput): Promise<ProjectSummary> {
    const preferences = {
      category: 'Comedy',
      targetDurationSeconds: 30,
      intendedAudience: 'General Audience',
      tone: 'Humorous and Whimsical',
      visualStyle: 'Stylized 3D Cartoon',
      language: 'English',
      aspectRatio: '9:16',
      fps: 30,
      ...(input.preferences || {}),
    };

    const { data, error } = await this.client
      .from('projects')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        status: 'draft',
        preferences,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create project: ${error.message}`);

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      status: data.status,
      preferences: data.preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      hasStory: false,
      hasScript: false,
      sceneCount: 0,
      estimatedDurationSeconds: preferences.targetDurationSeconds,
    };
  }

  async updateProject(projectId: string, userId: string, input: UpdateProjectInput): Promise<ProjectSummary> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.preferences !== undefined) updatePayload.preferences = input.preferences;

    const { data, error } = await this.client
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update project: ${error.message}`);

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      status: data.status,
      preferences: data.preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      hasStory: false,
      hasScript: false,
      sceneCount: 0,
      estimatedDurationSeconds: data.preferences?.targetDurationSeconds || 30,
    };
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    return !error;
  }

  async duplicateProject(projectId: string, userId: string): Promise<ProjectSummary> {
    const full = await this.getProject(projectId, userId);
    if (!full) throw new Error(`Project ${projectId} not found`);

    const cloned = await this.createProject(userId, {
      title: `${full.title} (Copy)`,
      description: full.description,
      preferences: full.preferences,
    });

    if (full.story) {
      await this.saveStory(cloned.id, userId, full.story);
    }
    if (full.script) {
      await this.saveScript(cloned.id, userId, full.script);
    }
    if (full.scenes && full.scenes.length > 0) {
      await this.saveScenes(cloned.id, userId, full.scenes);
    }

    return cloned;
  }

  async saveStory(projectId: string, userId: string, story: StoryDocument): Promise<StoryRecord> {
    const { data, error } = await this.client
      .from('stories')
      .upsert({
        project_id: projectId,
        user_id: userId,
        title: story.title,
        logline: story.logline,
        premise: story.premise,
        beginning: story.beginning,
        main_conflict: story.mainConflict,
        turning_points: story.turningPoints,
        climax: story.climax,
        ending: story.ending,
        character_descriptions: story.characterDescriptions,
        emotional_progression: story.emotionalProgression,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id' })
      .select()
      .single();

    if (error) throw new Error(`Failed to save story: ${error.message}`);

    await this.client
      .from('projects')
      .update({ status: 'story_generated', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return {
      ...story,
      id: data.id,
      projectId,
      userId,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getStory(projectId: string, userId: string): Promise<StoryDocument | null> {
    const { data, error } = await this.client
      .from('stories')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      title: data.title,
      logline: data.logline,
      premise: data.premise,
      beginning: data.beginning,
      mainConflict: data.main_conflict,
      turningPoints: data.turning_points,
      climax: data.climax,
      ending: data.ending,
      characterDescriptions: data.character_descriptions,
      emotionalProgression: data.emotional_progression,
    };
  }

  async saveScript(projectId: string, userId: string, script: ScriptDocument): Promise<ScriptRecord> {
    const { data, error } = await this.client
      .from('scripts')
      .insert({
        project_id: projectId,
        user_id: userId,
        title: script.title,
        scenes: script.scenes,
        total_word_count: script.totalWordCount,
        total_estimated_duration_seconds: script.totalEstimatedDurationSeconds,
        target_duration_seconds: script.targetDurationSeconds,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save script: ${error.message}`);

    await this.client
      .from('projects')
      .update({ status: 'script_generated', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return {
      ...script,
      id: data.id,
      projectId,
      userId,
      revisionNumber: data.revision_number,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getScript(projectId: string, userId: string): Promise<ScriptDocument | null> {
    const { data, error } = await this.client
      .from('scripts')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('revision_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      title: data.title,
      scenes: data.scenes,
      totalWordCount: data.total_word_count,
      totalEstimatedDurationSeconds: Number(data.total_estimated_duration_seconds),
      targetDurationSeconds: Number(data.target_duration_seconds),
    };
  }

  async saveScenes(projectId: string, userId: string, scenes: StructuredScene[]): Promise<StructuredScene[]> {
    // Delete existing scenes for this project then insert new batch
    await this.client.from('scenes').delete().eq('project_id', projectId).eq('user_id', userId);

    const rows = scenes.map((s) => ({
      id: s.id,
      project_id: projectId,
      user_id: userId,
      scene_number: s.sceneNumber,
      scene_title: s.sceneTitle,
      scene_description: s.sceneDescription,
      characters_involved: s.charactersInvolved,
      character_actions: s.characterActions,
      dialogue: s.dialogue,
      narration: s.narration,
      environment_description: s.environmentDescription,
      props_required: s.propsRequired,
      emotional_tone: s.emotionalTone,
      camera_direction_suggestions: s.cameraDirectionSuggestions,
      approximate_duration_seconds: s.approximateDurationSeconds,
      continuity_notes: s.continuityNotes,
    }));

    const { error } = await this.client.from('scenes').insert(rows);
    if (error) throw new Error(`Failed to save scenes: ${error.message}`);

    await this.client
      .from('projects')
      .update({ status: 'scenes_broken_down', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return scenes;
  }

  async getScenes(projectId: string, userId: string): Promise<StructuredScene[]> {
    const { data, error } = await this.client
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('scene_number', { ascending: true });

    if (error) throw new Error(`Failed to fetch scenes: ${error.message}`);

    return (data || []).map((s: any) => ({
      id: s.id,
      sceneNumber: s.scene_number,
      sceneTitle: s.scene_title,
      sceneDescription: s.scene_description,
      charactersInvolved: s.characters_involved,
      characterActions: s.character_actions,
      dialogue: s.dialogue,
      narration: s.narration,
      environmentDescription: s.environment_description,
      propsRequired: s.props_required,
      emotionalTone: s.emotional_tone,
      cameraDirectionSuggestions: s.camera_direction_suggestions,
      approximateDurationSeconds: Number(s.approximate_duration_seconds),
      continuityNotes: s.continuity_notes,
    }));
  }

  async updateScene(
    sceneId: string,
    projectId: string,
    userId: string,
    sceneUpdate: Partial<StructuredScene>,
  ): Promise<StructuredScene> {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (sceneUpdate.sceneTitle !== undefined) payload.scene_title = sceneUpdate.sceneTitle;
    if (sceneUpdate.sceneDescription !== undefined) payload.scene_description = sceneUpdate.sceneDescription;
    if (sceneUpdate.characterActions !== undefined) payload.character_actions = sceneUpdate.characterActions;
    if (sceneUpdate.dialogue !== undefined) payload.dialogue = sceneUpdate.dialogue;
    if (sceneUpdate.narration !== undefined) payload.narration = sceneUpdate.narration;
    if (sceneUpdate.environmentDescription !== undefined) payload.environment_description = sceneUpdate.environmentDescription;
    if (sceneUpdate.propsRequired !== undefined) payload.props_required = sceneUpdate.propsRequired;
    if (sceneUpdate.emotionalTone !== undefined) payload.emotional_tone = sceneUpdate.emotionalTone;
    if (sceneUpdate.cameraDirectionSuggestions !== undefined) payload.camera_direction_suggestions = sceneUpdate.cameraDirectionSuggestions;
    if (sceneUpdate.approximateDurationSeconds !== undefined) payload.approximate_duration_seconds = sceneUpdate.approximateDurationSeconds;
    if (sceneUpdate.continuityNotes !== undefined) payload.continuity_notes = sceneUpdate.continuityNotes;

    const { data, error } = await this.client
      .from('scenes')
      .update(payload)
      .eq('id', sceneId)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update scene: ${error.message}`);

    return {
      id: data.id,
      sceneNumber: data.scene_number,
      sceneTitle: data.scene_title,
      sceneDescription: data.scene_description,
      charactersInvolved: data.characters_involved,
      characterActions: data.character_actions,
      dialogue: data.dialogue,
      narration: data.narration,
      environmentDescription: data.environment_description,
      propsRequired: data.props_required,
      emotionalTone: data.emotional_tone,
      cameraDirectionSuggestions: data.camera_direction_suggestions,
      approximateDurationSeconds: Number(data.approximate_duration_seconds),
      continuityNotes: data.continuity_notes,
    };
  }

  async recordAIGeneration(record: Omit<AIGenerationMetadata, 'id' | 'createdAt'>): Promise<AIGenerationMetadata> {
    const { data, error } = await this.client
      .from('ai_generation_records')
      .insert({
        project_id: record.projectId,
        user_id: record.userId,
        stage: record.stage,
        provider: record.provider,
        model: record.model,
        prompt_snippet: record.promptSnippet,
        tokens_used: record.tokensUsed,
        latency_ms: record.latencyMs,
        status: record.status,
        error_message: record.errorMessage,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to record AI generation: ${error.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      userId: data.user_id,
      stage: data.stage,
      provider: data.provider,
      model: data.model,
      promptSnippet: data.prompt_snippet,
      tokensUsed: data.tokens_used,
      latencyMs: data.latency_ms,
      status: data.status,
      errorMessage: data.error_message,
      createdAt: data.created_at,
    };
  }

  async getAIGenerationRecords(userId: string, limit = 20): Promise<AIGenerationMetadata[]> {
    const { data, error } = await this.client
      .from('ai_generation_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch AI records: ${error.message}`);

    return (data || []).map((r: any) => ({
      id: r.id,
      projectId: r.project_id,
      userId: r.user_id,
      stage: r.stage,
      provider: r.provider,
      model: r.model,
      promptSnippet: r.prompt_snippet,
      tokensUsed: r.tokens_used,
      latencyMs: r.latency_ms,
      status: r.status,
      errorMessage: r.error_message,
      createdAt: r.created_at,
    }));
  }
}

