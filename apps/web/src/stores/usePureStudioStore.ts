import { create } from 'zustand';
import {
  Pure3DStudioProject,
  VideoFormat,
  GeminiModelSuiteConfig,
  DEFAULT_MODEL_SUITE,
} from '@studio/types';
import { Pure3DStudioPipelineOrchestrator } from '@studio/gemini-studio-core';

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
    model: 'deep-research-max-preview-04-2026',
    description: 'Analyzing historical facts, retention triggers, and opening hook angles.',
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
  geminiKey: string;
  ai33Key: string;
  modelSuite: GeminiModelSuiteConfig;

  isGenerating: boolean;
  currentStage: string;
  progressPercent: number;
  errorMessage: string | null;

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
  setGeminiKey: (key: string) => void;
  setAi33Key: (key: string) => void;
  setModelSuite: (suite: Partial<GeminiModelSuiteConfig>) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsSheetModalOpen: (open: boolean) => void;
  setCurrentTimeMs: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveBeatIndex: (idx: number) => void;

  generateProject: () => Promise<void>;
  loadSavedKeys: () => void;
}

export const usePureStudioStore = create<PureStudioState>((set, get) => ({
  topic: "Napoleon's disastrous winter retreat from Moscow in 1812",
  aspectRatio: '9:16',
  targetDurationSeconds: 60,
  selectedVoice: 'narrator-cinematic-deep-01',
  geminiKey: '',
  ai33Key: '',
  modelSuite: DEFAULT_MODEL_SUITE,

  isGenerating: false,
  currentStage: '',
  progressPercent: 0,
  errorMessage: null,

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
  setGeminiKey: (geminiKey) => {
    set({ geminiKey });
    try {
      localStorage.setItem('GEMINI_API_KEY', geminiKey);
    } catch {}
  },
  setAi33Key: (ai33Key) => {
    set({ ai33Key });
    try {
      localStorage.setItem('AI33_API_KEY', ai33Key);
    } catch {}
  },
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

  loadSavedKeys: () => {
    try {
      const gKey = localStorage.getItem('GEMINI_API_KEY') || '';
      const vKey = localStorage.getItem('AI33_API_KEY') || '';
      const savedSuite = localStorage.getItem('GEMINI_MODEL_SUITE');
      const suite = savedSuite ? { ...DEFAULT_MODEL_SUITE, ...JSON.parse(savedSuite) } : DEFAULT_MODEL_SUITE;
      set({ geminiKey: gKey, ai33Key: vKey, modelSuite: suite });
    } catch {}
  },

  generateProject: async () => {
    const { topic, aspectRatio, targetDurationSeconds, selectedVoice, geminiKey, ai33Key } = get();

    set({
      isGenerating: true,
      currentStage: 'researching',
      progressPercent: 5,
      errorMessage: null,
      isPlaying: false,
      currentTimeMs: 0,
      activeBeatIndex: 0,
    });

    try {
      let projectResult: Pure3DStudioProject | null = null;

      // 1. First attempt generation through the backend API
      try {
        const response = await fetch('/api/pipeline/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            aspectRatio,
            targetDurationSeconds,
            voiceId: selectedVoice,
            geminiKey,
            ai33Key,
          }),
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            projectResult = resJson.data;
          }
        }
      } catch (networkErr) {
        console.warn('[Backend API unreachable, using direct browser orchestrator]:', networkErr);
      }

      // 2. Direct browser orchestration fallback if server is unreachable
      if (!projectResult) {
        const orchestrator = new Pure3DStudioPipelineOrchestrator();
        projectResult = await orchestrator.runPipeline({
          topic,
          aspectRatio,
          targetDurationSeconds,
          voiceId: selectedVoice,
          geminiKey,
          ai33Key,
          onProgress: (stage, percent) => {
            set({ currentStage: stage, progressPercent: percent });
          },
        });
      }

      if (!projectResult) {
        throw new Error('Failed to generate 3D project. Please check your credentials.');
      }

      set({
        project: projectResult,
        isGenerating: false,
        currentStage: 'completed',
        progressPercent: 100,
        isPlaying: true,
      });
    } catch (err: any) {
      console.error('[Generate Error]:', err);
      set({
        isGenerating: false,
        errorMessage: err.message || 'Generation failed. Please try again.',
      });
    }
  },
}));

