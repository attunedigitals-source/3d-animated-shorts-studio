/**
 * Pure AI 3D Animated Video Studio State Store (Phase 0 Repaired)
 * - Zero cleartext API key persistence in browser localStorage.
 * - In-memory session credentials transmitted exclusively via secure request headers.
 * - Honest pipeline stage reporting with zero simulated fallbacks.
 * - Full retryability for failed stages.
 */

import { create } from 'zustand';
import {
  Pure3DStudioProject,
  VideoFormat,
  GeminiModelSuiteConfig,
  DEFAULT_MODEL_SUITE,
} from '@studio/types';

export interface GenerationStageInfo {
  id: string;
  name: string;
  model: string;
  description: string;
}

export const GENERATION_STAGES: GenerationStageInfo[] = [
  {
    id: 'researching',
    name: 'Deep Research & Viral Hooks',
    model: 'gemini-3.1-flash-lite (8-Model Auto-Switch Pool)',
    description: 'Analyzing historical facts, retention triggers, and opening hook angles across the 8-model pool.',
  },
  {
    id: 'scripting',
    name: '8-Beat Screenplay & Visual DNA',
    model: 'gemini-2.5-pro',
    description: 'Writing cinematic narrative and generating locked Visual Identity Matrix.',
  },
  {
    id: 'generating_anchor_sheet',
    name: 'Master 3D Character Anchor Sheet',
    model: 'gemini-3-pro-image (Nano Banana Pro)',
    description: 'Rendering 4-angle turnaround sheet (Front, 3/4, Profile, Action) for 100% character lock.',
  },
  {
    id: 'auditing_continuity',
    name: 'Spatial & Continuity Supervision',
    model: 'gemini-4-argon',
    description: 'Auditing 3D spatial vectors, object permanence, and lighting color temperatures.',
  },
  {
    id: 'synthesizing_voice',
    name: 'Neural Voice & Word Timestamps',
    model: 'ai33.pro Neural Voice',
    description: 'Synthesizing voiceover and calculating millisecond word alignments.',
  },
  {
    id: 'directing_and_rendering_shots',
    name: 'Multimodal 3D CGI Scene Keyframes',
    model: 'gemini-3-pro-image (Conditioned)',
    description: 'Generating 3D CGI shots conditioned on the canonical character sheet.',
  },
  {
    id: 'composing_music',
    name: 'Adaptive Cinematic Score',
    model: 'lyria-3.5',
    description: 'Composing original soundtrack with automatic -8dB speech ducking.',
  },
  {
    id: 'running_visual_qa',
    name: 'Multimodal Visual QA Inspector',
    model: 'gemini-omni-1.2-flash',
    description: 'Auditing facial consistency, wardrobe match, and subtitle legibility.',
  },
];

export type StepExecutionStatus = 'idle' | 'generating' | 'completed' | 'failed';

interface PureStudioState {
  topic: string;
  aspectRatio: VideoFormat;
  targetDurationSeconds: number;
  selectedVoice: string;

  // In-memory session credentials (Never persisted to localStorage)
  sessionGeminiKey: string;
  sessionAi33Key: string;
  modelSuite: GeminiModelSuiteConfig;

  isGenerating: boolean;
  currentStage: string;
  progressPercent: number;
  errorMessage: string | null;
  isRetryableError: boolean;

  // Per-step execution status & errors
  stepStatuses: Record<string, StepExecutionStatus>;
  stepErrors: Record<string, string | null>;

  project: Pure3DStudioProject | null;

  isPlaying: boolean;
  currentTimeMs: number;
  activeBeatIndex: number;

  isSettingsOpen: boolean;
  isSheetModalOpen: boolean;

  setTopic: (topic: string) => void;
  setAspectRatio: (format: VideoFormat) => void;
  setTargetDuration: (seconds: number) => void;
  setSelectedVoice: (voice: string) => void;
  setSessionGeminiKey: (key: string) => void;
  setSessionAi33Key: (key: string) => void;
  setModelSuite: (suite: Partial<GeminiModelSuiteConfig>) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsSheetModalOpen: (open: boolean) => void;
  setCurrentTimeMs: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveBeatIndex: (idx: number) => void;

  generateStep: (stepId: string) => Promise<boolean>;
  generateProject: () => Promise<void>;
  retryGeneration: () => Promise<void>;
  loadSavedPreferences: () => void;
}

const INITIAL_STEP_STATUSES: Record<string, StepExecutionStatus> = {
  researching: 'idle',
  scripting: 'idle',
  generating_anchor_sheet: 'idle',
  auditing_continuity: 'idle',
  synthesizing_voice: 'idle',
  directing_and_rendering_shots: 'idle',
  composing_music: 'idle',
  running_visual_qa: 'idle',
};

export const usePureStudioStore = create<PureStudioState>((set, get) => ({
  topic: "Napoleon's disastrous winter retreat from Moscow in 1812",
  aspectRatio: '9:16',
  targetDurationSeconds: 60,
  selectedVoice: 'narrator-cinematic-deep-01',
  sessionGeminiKey: '',
  sessionAi33Key: '',
  modelSuite: DEFAULT_MODEL_SUITE,

  isGenerating: false,
  currentStage: '',
  progressPercent: 0,
  errorMessage: null,
  isRetryableError: false,

  stepStatuses: { ...INITIAL_STEP_STATUSES },
  stepErrors: {},

  project: null,

  isPlaying: false,
  currentTimeMs: 0,
  activeBeatIndex: 0,

  isSettingsOpen: false,
  isSheetModalOpen: false,

  setTopic: (topic) => set({ topic }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setTargetDuration: (targetDurationSeconds) => set({ targetDurationSeconds }),
  setSelectedVoice: (selectedVoice) => set({ selectedVoice }),

  // Strictly in-memory session key updates
  setSessionGeminiKey: (sessionGeminiKey) => set({ sessionGeminiKey: sessionGeminiKey.trim() }),
  setSessionAi33Key: (sessionAi33Key) => set({ sessionAi33Key: sessionAi33Key.trim() }),

  setModelSuite: (suite) => {
    const updated = { ...get().modelSuite, ...suite };
    set({ modelSuite: updated });
    try {
      localStorage.setItem('GEMINI_MODEL_SUITE', JSON.stringify(updated));
    } catch {}
  },

  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setIsSheetModalOpen: (isSheetModalOpen) => set({ isSheetModalOpen }),
  setCurrentTimeMs: (currentTimeMs) => set({ currentTimeMs }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setActiveBeatIndex: (activeBeatIndex) => set({ activeBeatIndex }),

  loadSavedPreferences: () => {
    try {
      const savedSuite = localStorage.getItem('GEMINI_MODEL_SUITE');
      if (savedSuite) {
        set({ modelSuite: { ...DEFAULT_MODEL_SUITE, ...JSON.parse(savedSuite) } });
      }
    } catch {}
  },

  generateStep: async (stepId: string) => {
    const {
      topic,
      aspectRatio,
      targetDurationSeconds,
      selectedVoice,
      sessionGeminiKey,
      sessionAi33Key,
      modelSuite,
      project,
    } = get();

    const setStepState = (status: StepExecutionStatus, err: string | null = null) => {
      set((state) => ({
        stepStatuses: { ...state.stepStatuses, [stepId]: status },
        stepErrors: { ...state.stepErrors, [stepId]: err },
      }));
    };

    const ensureBaseProject = (): Pure3DStudioProject => {
      const existing = get().project;
      if (existing) return { ...existing, updatedAt: new Date().toISOString() };
      const now = new Date().toISOString();
      return {
        id: `proj_${Date.now()}`,
        title: `${topic} — 3D Cinematic`,
        topic,
        aspectRatio,
        targetDurationSeconds,
        characters: [],
        canonicalSheets: [],
        beats: [],
        status: 'idle',
        createdAt: now,
        updatedAt: now,
      };
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionGeminiKey) headers['x-gemini-key'] = sessionGeminiKey;
    if (sessionAi33Key) headers['x-ai33-key'] = sessionAi33Key;

    setStepState('generating', null);

    try {
      let endpoint = '';
      let payload: Record<string, any> = {};

      if (stepId === 'researching') {
        if (!topic.trim()) throw new Error('Please enter a story topic first.');
        endpoint = '/api/generate/research';
        payload = { topic, modelId: modelSuite.researcherModel };
      } else if (stepId === 'scripting') {
        if (!topic.trim()) throw new Error('Please enter a story topic first.');
        endpoint = '/api/generate/story';
        payload = {
          topic,
          research: project?.research,
          aspectRatio,
          modelId: modelSuite.screenwriterModel,
        };
      } else if (stepId === 'generating_anchor_sheet') {
        const char = project?.characters?.[0];
        if (!char) {
          throw new Error('Please generate Step 2 (8-Beat Screenplay & Visual DNA) first so character attributes exist.');
        }
        endpoint = '/api/generate/character-sheet';
        payload = { character: char, modelId: modelSuite.imageModel };
      } else if (stepId === 'auditing_continuity') {
        const char = project?.characters?.[0];
        const beats = project?.beats;
        if (!char || !beats || beats.length === 0) {
          throw new Error('Please generate Step 2 (8-Beat Screenplay & Visual DNA) first.');
        }
        endpoint = '/api/generate/continuity';
        payload = { beats, character: char, modelId: modelSuite.continuityModel };
      } else if (stepId === 'synthesizing_voice') {
        const beats = project?.beats;
        if (!beats || beats.length === 0) {
          throw new Error('Please generate Step 2 (8-Beat Screenplay & Visual DNA) first so dialogue lines exist.');
        }
        const scriptText = beats.map((b) => b.text).join(' ');
        endpoint = '/api/generate/voice';
        payload = { scriptText, voiceId: selectedVoice, speed: 1.0 };
      } else if (stepId === 'directing_and_rendering_shots') {
        const char = project?.characters?.[0];
        const sheet = project?.canonicalSheets?.[0];
        const beats = project?.beats;
        if (!char || !beats || beats.length === 0 || !sheet) {
          throw new Error('Please generate Step 2 (Screenplay) and Step 3 (Character Anchor Sheet) first.');
        }
        endpoint = '/api/generate/shots';
        payload = {
          beats,
          character: char,
          anchorSheet: sheet,
          aspectRatio,
          modelId: modelSuite.imageModel,
        };
      } else if (stepId === 'composing_music') {
        endpoint = '/api/generate/music';
        payload = {
          mood: 'Intense cinematic orchestral score with driving rhythm',
          durationSeconds: project?.narration?.durationSeconds || targetDurationSeconds,
          timestamps: project?.narration?.timestamps,
          modelId: modelSuite.musicModel,
        };
      } else if (stepId === 'running_visual_qa') {
        const sheet = project?.canonicalSheets?.[0];
        const shots = project?.shots;
        if (!sheet || !shots || shots.length === 0) {
          throw new Error('Please generate Step 3 (Character Anchor Sheet) and Step 6 (3D CGI Scene Keyframes) first.');
        }
        endpoint = '/api/qa/inspect';
        payload = {
          canonicalSheet: sheet,
          shots,
          beats: project?.beats || [],
          modelId: modelSuite.qaModel,
        };
      } else {
        throw new Error(`Unknown step ID: ${stepId}`);
      }

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success) {
        const msg = json?.error?.message || `Step failed with HTTP ${resp.status}`;
        throw new Error(msg);
      }

      const data = json.data;
      const updatedProject = ensureBaseProject();

      if (stepId === 'researching') {
        updatedProject.research = data;
        updatedProject.researchNotes = data.summary;
      } else if (stepId === 'scripting') {
        updatedProject.title = data.title;
        updatedProject.characters = [data.character];
        updatedProject.beats = data.beats;
      } else if (stepId === 'generating_anchor_sheet') {
        updatedProject.canonicalSheets = [data];
        if (updatedProject.characters[0]) {
          updatedProject.characters[0] = {
            ...updatedProject.characters[0],
            canonicalSheetUrl: data.sheetImageUrl,
          };
        }
      } else if (stepId === 'auditing_continuity') {
        updatedProject.continuityAudit = data;
      } else if (stepId === 'synthesizing_voice') {
        updatedProject.narration = data;
      } else if (stepId === 'directing_and_rendering_shots') {
        updatedProject.shots = data;
      } else if (stepId === 'composing_music') {
        updatedProject.soundtrack = data;
      } else if (stepId === 'running_visual_qa') {
        updatedProject.qaReport = data;
        updatedProject.status = 'completed';
      }

      set((state) => ({
        project: updatedProject,
        stepStatuses: { ...state.stepStatuses, [stepId]: 'completed' },
        stepErrors: { ...state.stepErrors, [stepId]: null },
      }));
      return true;
    } catch (err: any) {
      setStepState('failed', err.message || 'Step generation failed.');
      return false;
    }
  },

  generateProject: async () => {
    const { topic, aspectRatio, targetDurationSeconds, selectedVoice, sessionGeminiKey, sessionAi33Key, modelSuite } = get();

    set({
      isGenerating: true,
      currentStage: 'researching',
      progressPercent: 10,
      errorMessage: null,
      isRetryableError: false,
      isPlaying: false,
      currentTimeMs: 0,
      activeBeatIndex: 0,
      stepStatuses: {
        ...INITIAL_STEP_STATUSES,
        researching: 'generating',
      },
      stepErrors: {},
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (sessionGeminiKey) {
      headers['x-gemini-key'] = sessionGeminiKey;
    }
    if (sessionAi33Key) {
      headers['x-ai33-key'] = sessionAi33Key;
    }

    try {
      const progressTimer = setInterval(() => {
        const curr = get().progressPercent;
        if (curr < 90 && get().isGenerating) {
          set({ progressPercent: curr + 10 });
        }
      }, 3000);

      const response = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic,
          aspectRatio,
          targetDurationSeconds,
          voiceId: selectedVoice,
          modelSuite,
        }),
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMessage = errJson?.error?.message || `Pipeline server returned HTTP ${response.status}`;
        const isRetryable = Boolean(errJson?.error?.isRetryable);

        set({
          isGenerating: false,
          errorMessage: errMessage,
          isRetryableError: isRetryable,
        });
        return;
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        set({
          isGenerating: false,
          errorMessage: result?.error?.message || 'Production failed to return generated assets.',
          isRetryableError: Boolean(result?.error?.isRetryable),
        });
        return;
      }

      set({
        project: result.data,
        isGenerating: false,
        currentStage: 'completed',
        progressPercent: 100,
        isPlaying: true,
        stepStatuses: {
          researching: 'completed',
          scripting: 'completed',
          generating_anchor_sheet: 'completed',
          auditing_continuity: 'completed',
          synthesizing_voice: 'completed',
          directing_and_rendering_shots: 'completed',
          composing_music: 'completed',
          running_visual_qa: 'completed',
        },
        stepErrors: {},
      });
    } catch (err: any) {
      console.error('[Pipeline Fetch Error]:', err);
      set({
        isGenerating: false,
        errorMessage: err.message || 'Network error reaching production backend. Please check connectivity.',
        isRetryableError: true,
      });
    }
  },

  retryGeneration: async () => {
    await get().generateProject();
  },
}));
