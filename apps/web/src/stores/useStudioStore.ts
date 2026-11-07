import { create } from 'zustand';
import {
  FullProjectDetails,
  ProjectSummary,
  StoryDocument,
  ScriptDocument,
  StructuredScene,
  StoryPromptOptions,
  UserProfile,
  AISettings,
  AIModelOption,
} from '@studio/types';
import { api } from '../services/api';

export type ActiveView = 'dashboard' | 'projects' | 'story' | 'script' | 'scenes' | 'settings';

interface StudioState {
  // Auth
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  isDevAuth: boolean;

  // Navigation
  activeView: ActiveView;

  // Projects
  projects: ProjectSummary[];
  currentProject: FullProjectDetails | null;
  isLoadingProjects: boolean;

  // Active Story & Script & Scenes Drafts
  storyDraft: StoryDocument | null;
  scriptDraft: ScriptDocument | null;
  scenesDraft: StructuredScene[];

  // Form State for Story Studio
  storyPromptOptions: StoryPromptOptions;

  // AI & System Settings
  aiSettings: Partial<AISettings>;
  availableModels: AIModelOption[];
  isSupabaseConfigured: boolean;

  voiceSettings: {
    provider: 'ai33' | 'mock';
    apiKey?: string;
    baseUrl?: string;
    defaultVoiceId?: string;
  };

  supabaseSettings: {
    mode: 'dev' | 'supabase';
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseServiceRoleKey?: string;
  };

  // Loading & Error States
  isGeneratingStory: boolean;
  isGeneratingScript: boolean;
  isBreakingDownScenes: boolean;
  isSaving: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;

  // Actions
  setUser: (user: UserProfile | null, isDev?: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setActiveView: (view: ActiveView) => void;
  setNotification: (notif: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
  setStoryPromptOptions: (options: Partial<StoryPromptOptions>) => void;
  setAiSettings: (settings: Partial<AISettings>) => void;
  setVoiceSettings: (settings: Partial<StudioState['voiceSettings']>) => void;
  setSupabaseSettings: (settings: Partial<StudioState['supabaseSettings']>) => void;
  saveAllStudioSettings: () => Promise<void>;

  // Project Actions
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (title: string, description?: string) => Promise<string>;
  updateProjectTitle: (title: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<void>;

  // Story & Script & Scene Actions
  generateStory: () => Promise<void>;
  updateStoryDraft: (story: StoryDocument) => void;
  saveStoryDraft: () => Promise<void>;

  generateScript: () => Promise<void>;
  updateScriptDraft: (script: ScriptDocument) => void;
  saveScriptDraft: () => Promise<void>;

  breakdownScenes: () => Promise<void>;
  updateScene: (sceneId: string, update: Partial<StructuredScene>) => void;
  addScene: () => void;
  deleteScene: (sceneId: string) => void;
  saveScenesDraft: () => Promise<void>;

  // Init
  initStudio: () => Promise<void>;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  user: null,
  isAuthModalOpen: false,
  isDevAuth: true,
  activeView: 'dashboard',
  projects: [],
  currentProject: null,
  isLoadingProjects: false,

  storyDraft: null,
  scriptDraft: null,
  scenesDraft: [],

  storyPromptOptions: {
    topic: '',
    title: '',
    category: 'Comedy',
    targetDurationSeconds: 30,
    intendedAudience: 'General Audience',
    tone: 'Humorous and Whimsical',
    visualStyle: 'Stylized 3D Cartoon',
    language: 'English',
    additionalInstructions: '',
  },

  aiSettings: {
    provider: 'ollama',
    model: 'llama3.2:3b',
  },
  availableModels: [],
  isSupabaseConfigured: false,

  voiceSettings: {
    provider: 'ai33',
    baseUrl: 'https://api.ai33.pro/v3',
    defaultVoiceId: 'minimax_male-qn-qingse',
  },

  supabaseSettings: {
    mode: 'dev',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
  },

  isGeneratingStory: false,
  isGeneratingScript: false,
  isBreakingDownScenes: false,
  isSaving: false,
  notification: null,

  setUser: (user, isDev = true) => set({ user, isDevAuth: isDev }),
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setActiveView: (view) => set({ activeView: view }),
  setNotification: (notification) => set({ notification }),
  setStoryPromptOptions: (options) =>
    set((state) => ({ storyPromptOptions: { ...state.storyPromptOptions, ...options } })),
  setAiSettings: (settings) =>
    set((state) => {
      const next = { ...state.aiSettings, ...settings };
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('studio_ai_settings', JSON.stringify(next));
      }
      return { aiSettings: next };
    }),
  setVoiceSettings: (settings) =>
    set((state) => {
      const next = { ...state.voiceSettings, ...settings };
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('studio_voice_settings', JSON.stringify(next));
      }
      return { voiceSettings: next };
    }),
  setSupabaseSettings: (settings) =>
    set((state) => {
      const next = { ...state.supabaseSettings, ...settings };
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('studio_supabase_settings', JSON.stringify(next));
      }
      return { supabaseSettings: next };
    }),

  saveAllStudioSettings: async () => {
    set({ isSaving: true });
    try {
      const { aiSettings, voiceSettings, supabaseSettings } = get();

      // Persist immediately in browser storage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('studio_ai_settings', JSON.stringify(aiSettings));
        localStorage.setItem('studio_voice_settings', JSON.stringify(voiceSettings));
        localStorage.setItem('studio_supabase_settings', JSON.stringify(supabaseSettings));
      }

      const payload = {
        ai: {
          provider: 'ollama' as const,
          model: aiSettings.model || 'llama3.2:3b',
        },
        voice: {
          provider: voiceSettings.provider,
          apiKey: voiceSettings.apiKey,
          baseUrl: voiceSettings.baseUrl,
          defaultVoiceId: voiceSettings.defaultVoiceId,
          mockVoice: voiceSettings.provider === 'mock',
        },
        database: {
          mode: supabaseSettings.mode,
          supabaseUrl: supabaseSettings.supabaseUrl,
          supabaseAnonKey: supabaseSettings.supabaseAnonKey,
          supabaseServiceRoleKey: supabaseSettings.supabaseServiceRoleKey,
        },
      };

      const hasSupabaseKeys = Boolean(
        supabaseSettings.supabaseUrl &&
        supabaseSettings.supabaseAnonKey &&
        !supabaseSettings.supabaseUrl.includes('your-project-id') &&
        !supabaseSettings.supabaseAnonKey.includes('placeholder')
      );

      const res = await api.saveSettings(payload);
      set({
        isSupabaseConfigured: res?.data?.database?.isSupabaseConfigured ?? hasSupabaseKeys,
        notification: { type: 'success', message: 'All studio settings & credentials saved successfully!' },
      });
    } catch (err: any) {
      set({
        notification: { type: 'error', message: err.message || 'Failed to save settings.' },
      });
    } finally {
      set({ isSaving: false });
    }
  },

  initStudio: async () => {
    try {
      // 1. Check local storage first
      let localAi: any = {};
      let localVoice: any = {};
      let localDb: any = {};

      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          localAi = JSON.parse(localStorage.getItem('studio_ai_settings') || '{}');
          localVoice = JSON.parse(localStorage.getItem('studio_voice_settings') || '{}');
          localDb = JSON.parse(localStorage.getItem('studio_supabase_settings') || '{}');
        } catch {}
      }

      const [session, settingsRes] = await Promise.all([
        api.getSession().catch(() => null),
        api.getSettings().catch(() => null),
      ]);

      if (session?.user) {
        set({ user: session.user, isDevAuth: Boolean(session.isDevFallback) });
      }

      let rawModel = localAi.model || settingsRes?.ai?.model || 'llama3.2:3b';
      if (!rawModel || rawModel.includes(':free') || rawModel.includes('/')) {
        rawModel = 'llama3.2:3b';
      }

      const effectiveAi = {
        provider: 'ollama' as const,
        model: rawModel,
      };

      const effectiveVoice = {
        provider: localVoice.provider || settingsRes?.voice?.provider || 'ai33',
        apiKey: localVoice.apiKey || settingsRes?.voice?.apiKey || '',
        baseUrl: localVoice.baseUrl || settingsRes?.voice?.baseUrl || 'https://api.ai33.pro/v3',
        defaultVoiceId: localVoice.defaultVoiceId || settingsRes?.voice?.defaultVoiceId || 'minimax_male-qn-qingse',
      };

      const effectiveDb = {
        mode: localDb.mode || settingsRes?.database?.mode || 'dev',
        supabaseUrl: localDb.supabaseUrl || settingsRes?.database?.supabaseUrl || '',
        supabaseAnonKey: localDb.supabaseAnonKey || settingsRes?.database?.supabaseAnonKey || '',
        supabaseServiceRoleKey: localDb.supabaseServiceRoleKey || settingsRes?.database?.supabaseServiceRoleKey || '',
      };

      const isSupabaseConfigured = Boolean(
        settingsRes?.database?.isSupabaseConfigured ||
        (effectiveDb.supabaseUrl && effectiveDb.supabaseAnonKey && !effectiveDb.supabaseUrl.includes('your-project-id'))
      );

      set({
        aiSettings: effectiveAi,
        voiceSettings: effectiveVoice,
        supabaseSettings: effectiveDb,
        isSupabaseConfigured,
        availableModels: settingsRes?.availableModels || [
          { id: 'llama3.2:3b', name: 'Llama 3.2 3B (Self-Hosted Ollama · AWS EC2)', provider: 'ollama', tier: 'fast', description: 'Self-hosted Ollama instance running llama3.2:3b on AWS EC2' },
        ],
      });

      await get().fetchProjects();
    } catch (err: any) {
      console.error('[Studio] Init failed:', err);
    }
  },

  fetchProjects: async () => {
    set({ isLoadingProjects: true });
    try {
      const projects = await api.getProjects();
      set({ projects: Array.isArray(projects) ? projects : [], isLoadingProjects: false });
    } catch (err: any) {
      set({
        projects: [],
        isLoadingProjects: false,
        notification: { type: 'error', message: err.message || 'Failed to fetch projects' },
      });
    }
  },

  selectProject: async (projectId: string) => {
    try {
      const project = await api.getProject(projectId);
      set({
        currentProject: project,
        storyDraft: project.story || null,
        scriptDraft: project.script || null,
        scenesDraft: project.scenes || [],
        storyPromptOptions: {
          ...get().storyPromptOptions,
          title: project.title,
          topic: get().storyPromptOptions.topic?.trim() || project.description?.trim() || project.title || '',
          category: project.preferences.category,
          targetDurationSeconds: project.preferences.targetDurationSeconds,
          intendedAudience: project.preferences.intendedAudience,
          tone: project.preferences.tone,
          visualStyle: project.preferences.visualStyle,
          language: project.preferences.language,
        },
      });
    } catch (err: any) {
      set({
        notification: { type: 'error', message: err.message || 'Failed to open project' },
      });
    }
  },

  createProject: async (title: string, description?: string) => {
    try {
      const created = await api.createProject({
        title,
        description,
        preferences: {
          category: get().storyPromptOptions.category,
          targetDurationSeconds: get().storyPromptOptions.targetDurationSeconds,
          intendedAudience: get().storyPromptOptions.intendedAudience,
          tone: get().storyPromptOptions.tone,
          visualStyle: get().storyPromptOptions.visualStyle,
          language: get().storyPromptOptions.language,
          aspectRatio: '9:16',
          fps: 30,
        },
      });
      set((state) => ({
        storyPromptOptions: {
          ...state.storyPromptOptions,
          title,
          topic: state.storyPromptOptions.topic?.trim() || description || title,
        },
      }));
      await get().fetchProjects();
      await get().selectProject(created.id);
      return created.id;
    } catch (err: any) {
      set({ notification: { type: 'error', message: err.message || 'Failed to create project' } });
      throw err;
    }
  },

  updateProjectTitle: async (title: string) => {
    const current = get().currentProject;
    if (!current) return;
    try {
      await api.updateProject(current.id, { title });
      set({ currentProject: { ...current, title } });
      await get().fetchProjects();
    } catch (err: any) {
      set({ notification: { type: 'error', message: err.message } });
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      if (get().currentProject?.id === projectId) {
        set({ currentProject: null, storyDraft: null, scriptDraft: null, scenesDraft: [] });
      }
      await get().fetchProjects();
      set({ notification: { type: 'success', message: 'Project deleted successfully' } });
    } catch (err: any) {
      set({ notification: { type: 'error', message: err.message } });
    }
  },

  duplicateProject: async (projectId: string) => {
    try {
      const cloned = await api.duplicateProject(projectId);
      await get().fetchProjects();
      await get().selectProject(cloned.id);
      set({ notification: { type: 'success', message: 'Project duplicated successfully' } });
    } catch (err: any) {
      set({ notification: { type: 'error', message: err.message } });
    }
  },

  // Story
  generateStory: async () => {
    let current = get().currentProject;
    const opts = { ...get().storyPromptOptions };

    // Auto-resolve concept if topic is empty or too short, but title or project title is available
    if (!opts.topic || opts.topic.trim().length < 3) {
      const fallbackTopic = opts.title?.trim() || current?.title?.trim() || current?.description?.trim();
      if (fallbackTopic && fallbackTopic.length >= 3) {
        opts.topic = fallbackTopic;
        set((state) => ({ storyPromptOptions: { ...state.storyPromptOptions, topic: fallbackTopic } }));
      } else {
        set({ notification: { type: 'error', message: 'Please enter a story concept with at least 3 characters.' } });
        return;
      }
    }

    // Auto-create project if none selected
    if (!current) {
      const projId = await get().createProject(opts.title || opts.topic.slice(0, 30));
      current = await api.getProject(projId);
    }

    set({ isGeneratingStory: true });
    try {
      const res = await api.generateStory(current.id, opts, get().aiSettings);
      set({
        storyDraft: res.story,
        isGeneratingStory: false,
        notification: { type: 'success', message: 'Story successfully generated!' },
      });
      await get().selectProject(current.id);
      await get().fetchProjects();
    } catch (err: any) {
      set({
        isGeneratingStory: false,
        notification: { type: 'error', message: err.message || 'Story generation failed.' },
      });
    }
  },

  updateStoryDraft: (story) => set({ storyDraft: story }),

  saveStoryDraft: async () => {
    const current = get().currentProject;
    const draft = get().storyDraft;
    if (!current || !draft) return;

    set({ isSaving: true });
    try {
      const saved = await api.saveStory(current.id, draft);
      set({
        storyDraft: saved,
        isSaving: false,
        notification: { type: 'success', message: 'Story saved successfully!' },
      });
      await get().fetchProjects();
    } catch (err: any) {
      set({ isSaving: false, notification: { type: 'error', message: err.message } });
    }
  },

  // Script
  generateScript: async () => {
    const current = get().currentProject;
    if (!current || !get().storyDraft) {
      set({ notification: { type: 'error', message: 'Please create or load an approved story first.' } });
      return;
    }

    set({ isGeneratingScript: true });
    try {
      const res = await api.generateScript(
        current.id,
        current.preferences.targetDurationSeconds,
        get().aiSettings,
      );
      set({
        scriptDraft: res.script,
        isGeneratingScript: false,
        notification: { type: 'success', message: 'Narration script generated!' },
      });
      await get().selectProject(current.id);
      await get().fetchProjects();
    } catch (err: any) {
      set({
        isGeneratingScript: false,
        notification: { type: 'error', message: err.message || 'Script generation failed.' },
      });
    }
  },

  updateScriptDraft: (script) => set({ scriptDraft: script }),

  saveScriptDraft: async () => {
    const current = get().currentProject;
    const draft = get().scriptDraft;
    if (!current || !draft) return;

    set({ isSaving: true });
    try {
      const saved = await api.saveScript(current.id, draft);
      set({
        scriptDraft: saved,
        isSaving: false,
        notification: { type: 'success', message: 'Script saved successfully!' },
      });
      await get().fetchProjects();
    } catch (err: any) {
      set({ isSaving: false, notification: { type: 'error', message: err.message } });
    }
  },

  // Scenes
  breakdownScenes: async () => {
    const current = get().currentProject;
    if (!current || !get().scriptDraft) {
      set({ notification: { type: 'error', message: 'Please generate a script before breaking down scenes.' } });
      return;
    }

    set({ isBreakingDownScenes: true });
    try {
      const res = await api.breakdownScenes(current.id, get().aiSettings);
      set({
        scenesDraft: res.scenes,
        isBreakingDownScenes: false,
        notification: { type: 'success', message: 'Scenes successfully structured for 3D production!' },
      });
      await get().selectProject(current.id);
      await get().fetchProjects();
    } catch (err: any) {
      set({
        isBreakingDownScenes: false,
        notification: { type: 'error', message: err.message || 'Scene breakdown failed.' },
      });
    }
  },

  updateScene: (sceneId, update) => {
    set((state) => ({
      scenesDraft: state.scenesDraft.map((s) => (s.id === sceneId ? { ...s, ...update } : s)),
    }));
  },

  addScene: () => {
    const scenes = get().scenesDraft;
    const newNumber = scenes.length + 1;
    const newScene: StructuredScene = {
      id: `scene-${newNumber}-${Date.now().toString(36)}`,
      sceneNumber: newNumber,
      sceneTitle: `Scene ${newNumber}`,
      sceneDescription: 'Enter action and narrative description here...',
      charactersInvolved: [],
      characterActions: '',
      dialogue: [],
      narration: '',
      environmentDescription: 'Stylized 3D Stage',
      propsRequired: [],
      emotionalTone: 'Neutral',
      cameraDirectionSuggestions: 'Medium shot centered',
      approximateDurationSeconds: 5,
      continuityNotes: '',
    };
    set({ scenesDraft: [...scenes, newScene] });
  },

  deleteScene: (sceneId) => {
    set((state) => ({
      scenesDraft: state.scenesDraft
        .filter((s) => s.id !== sceneId)
        .map((s, idx) => ({ ...s, sceneNumber: idx + 1 })),
    }));
  },

  saveScenesDraft: async () => {
    const current = get().currentProject;
    const draft = get().scenesDraft;
    if (!current) return;

    set({ isSaving: true });
    try {
      const saved = await api.saveScenes(current.id, draft);
      set({
        scenesDraft: saved,
        isSaving: false,
        notification: { type: 'success', message: 'Production scenes saved successfully!' },
      });
      await get().fetchProjects();
    } catch (err: any) {
      set({ isSaving: false, notification: { type: 'error', message: err.message } });
    }
  },
}));

