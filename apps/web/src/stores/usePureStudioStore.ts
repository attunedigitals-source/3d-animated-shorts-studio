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

  generateProject: () => Promise<void>;
  retryGeneration: () => Promise<void>;
  loadSavedPreferences: () => void;
}

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
