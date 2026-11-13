/**
 * Pure AI 3D Animated Video Studio: Domain Schemas & Types
 * Strictly implements NEXT_GEN_3D_STUDIO_PROPOSAL.md
 * Autonomous High-End 3D CGI Video Creation Exclusively via Google Gemini Models & ai33.pro Voice.
 */

import { z } from 'zod';

// ==============================================================================
// 0. ASSET PROVENANCE & RELIABILITY TYPES (Phase 0 Standards)
// ==============================================================================

export const AssetProvenanceSchema = z.enum([
  'ai_generated',
  'user_uploaded',
  'preview_placeholder',
  'demo_asset',
  'failed',
  'pending',
  'needs_review',
]);

export type AssetProvenance = z.infer<typeof AssetProvenanceSchema>;

export const GeminiModelCapabilitySchema = z.enum([
  'text_generation',
  'deep_research',
  'image_generation',
  'video_generation',
  'music_generation',
  'multimodal_analysis',
  'audio_transcription',
]);

export type GeminiModelCapability = z.infer<typeof GeminiModelCapabilitySchema>;

export const GeminiApiSurfaceSchema = z.enum([
  'generateContent',
  'predict',
  'generateImages',
  'predictAudio',
  'unavailable',
]);

export type GeminiApiSurface = z.infer<typeof GeminiApiSurfaceSchema>;

export interface ModelRegistryEntry {
  id: string;
  displayName: string;
  provider: 'Google';
  apiSurface: GeminiApiSurface;
  capabilities: GeminiModelCapability[];
  inputTypes: ('text' | 'image' | 'audio' | 'video')[];
  outputTypes: ('text' | 'image' | 'audio' | 'video' | 'json')[];
  isAvailable: boolean;
  stability: 'STABLE' | 'PREVIEW' | 'DEPRECATED';
  lastVerified: string;
  notes?: string;
}

export interface ProviderErrorInfo {
  provider: 'gemini' | 'ai33' | 'lyria' | 'system';
  statusCode?: number;
  errorCode: string;
  message: string;
  isRetryable: boolean;
  retryAfterSeconds?: number;
  requestId?: string;
  timestamp: string;
}

// ==============================================================================
// 1. CHARACTER DNA & CANONICAL SHEET (100% Consistency Pillars)
// ==============================================================================

export const VisualIdentityMatrixSchema = z.object({
  promptTokens: z.string().describe('Locked immutable identity tokens, e.g. [CHAR_NAPOLEON_3D_DNA]'),
  facialGeometry: z.string().describe('Exact bone structure, eye shape, nose bridge, jawline'),
  skinTone: z.string().describe('Skin tone and subsurface scattering profile'),
  hairTexture: z.string().describe('Hair style, color, strands, volumetric properties'),
  wardrobe: z.string().describe('Exact clothing items, fabric weave, buttons, weathering'),
  renderingStyle: z.string().default('Unreal Engine 5 cinematic 3D CGI render, Pixar-style stylization, ray-traced subsurface scattering'),
  colorPalette: z.array(z.string()).describe('Hex color codes for signature traits'),
});

export type VisualIdentityMatrix = z.infer<typeof VisualIdentityMatrixSchema>;

export const CharacterDNASchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  bio: z.string().optional(),
  visualIdentityMatrix: VisualIdentityMatrixSchema,
  canonicalSheetUrl: z.string().optional(),
});

export type CharacterDNA = z.infer<typeof CharacterDNASchema>;

export const CanonicalCharacterSheetSchema = z.object({
  characterId: z.string(),
  characterName: z.string(),
  sheetImageUrl: z.string().describe('Master turnaround sheet: Front, 3/4 Angle, Profile, Action in 3D CGI style'),
  frontPoseUrl: z.string().optional(),
  threeQuarterPoseUrl: z.string().optional(),
  profilePoseUrl: z.string().optional(),
  actionPoseUrl: z.string().optional(),
  provenance: AssetProvenanceSchema.default('pending'),
  isProceduralPlaceholder: z.boolean().default(false),
  createdAt: z.string(),
});

export type CanonicalCharacterSheet = z.infer<typeof CanonicalCharacterSheetSchema>;

// ==============================================================================
// 2. NARRATIVE BEAT & SHOT DIRECTING (Gemini 2.5 Pro & Gemini 3.7 Flash)
// ==============================================================================

export const CameraTrajectorySchema = z.object({
  shotType: z.enum([
    'extreme-close-up',
    'close-up',
    'medium-shot',
    'wide-cinematic',
    'low-angle-hero',
    'dutch-angle',
    'macro-zoom',
    'over-the-shoulder',
  ]),
  motion: z.enum([
    'push-in',
    'slow-pan-right',
    'slow-pan-left',
    'orbit-arc',
    'dramatic-tilt',
    'static-hold',
    'whip-pan',
  ]),
  focalLength: z.string().default('35mm anamorphic'),
  lighting: z.string().default('Cinematic volumetric lighting with ray-traced rim accents'),
});

export type CameraTrajectory = z.infer<typeof CameraTrajectorySchema>;

export const NarrativeBeatSchema = z.object({
  beatNumber: z.number().int().min(1),
  type: z.enum(['Hook', 'Agitation', 'Escalation', 'Climax', 'Twist', 'Resolution']),
  text: z.string().describe('Spoken narration line'),
  visualSceneDescription: z.string().describe('Detailed 3D CGI environment and atmosphere'),
  action: z.string().describe('Character action and emotional expression'),
  cameraTrajectory: CameraTrajectorySchema,
  targetDurationSeconds: z.number().min(1).default(6),
  actualDurationSeconds: z.number().optional(),
});

export type NarrativeBeat = z.infer<typeof NarrativeBeatSchema>;

// ==============================================================================
// 3. VOICE SYNTHESIS & WORD TIMESTAMPS (ai33.pro)
// ==============================================================================

export const WordTimestampSchema = z.object({
  word: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  isEstimated: z.boolean().optional(),
});

export type WordTimestamp = z.infer<typeof WordTimestampSchema>;

export const AudioNarrationSchema = z.object({
  audioUrl: z.string(),
  durationSeconds: z.number().positive(),
  timestamps: z.array(WordTimestampSchema),
  voiceModel: z.string().default('ai33-neural-hd'),
  provenance: AssetProvenanceSchema.default('pending'),
  isEstimatedAlignment: z.boolean().default(false),
});

export type AudioNarration = z.infer<typeof AudioNarrationSchema>;

// ==============================================================================
// 4. MULTIMODAL 3D CGI SHOT (gemini-3-pro-image conditioned on sheet)
// ==============================================================================

export const RenderedShotSchema = z.object({
  shotId: z.string(),
  beatNumber: z.number(),
  imageUrl: z.string().describe('3D CGI keyframe conditioned on CanonicalCharacterSheet'),
  promptUsed: z.string(),
  durationSeconds: z.number().positive(),
  cameraTrajectory: CameraTrajectorySchema,
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  provenance: AssetProvenanceSchema.default('pending'),
  referenceImageUsed: z.string().optional(),
});

export type RenderedShot = z.infer<typeof RenderedShotSchema>;

// ==============================================================================
// 5. ADAPTIVE SOUNDTRACK (Lyria 3.5)
// ==============================================================================

export const DuckingMarkerSchema = z.object({
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  targetVolume: z.number().min(0).max(1).default(0.18), // -8dB ducking
});

export type DuckingMarker = z.infer<typeof DuckingMarkerSchema>;

export const SoundtrackScoreSchema = z.object({
  audioUrl: z.string(),
  tempo: z.number().positive(),
  mood: z.string(),
  genre: z.string(),
  duckingMarkers: z.array(DuckingMarkerSchema),
  provenance: AssetProvenanceSchema.default('pending'),
  isPlaceholder: z.boolean().default(false),
});

export type SoundtrackScore = z.infer<typeof SoundtrackScoreSchema>;

// ==============================================================================
// 6. VISUAL QA INSPECTOR REPORT (Gemini Omni 1.2 Flash)
// ==============================================================================

export const QACategoryScoreSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  notes: z.string(),
});

export type QACategoryScore = z.infer<typeof QACategoryScoreSchema>;

export const QAStatusSchema = z.enum(['passed', 'failed', 'needs_review', 'not_inspected']);
export type QAStatus = z.infer<typeof QAStatusSchema>;

export const QAAuditReportSchema = z.object({
  status: QAStatusSchema.default('not_inspected'),
  passed: z.boolean(),
  characterConsistencyScore: z.number().min(0).max(100),
  visualFidelityScore: z.number().min(0).max(100),
  subtitleLegibility: z.boolean(),
  feedback: z.array(z.string()),
  categories: z.object({
    characterIdentity: QACategoryScoreSchema.optional(),
    clothingAndAppearance: QACategoryScoreSchema.optional(),
    environmentConsistency: QACategoryScoreSchema.optional(),
    composition: QACategoryScoreSchema.optional(),
    lighting: QACategoryScoreSchema.optional(),
    visualDefects: QACategoryScoreSchema.optional(),
    sceneContinuity: QACategoryScoreSchema.optional(),
  }).optional(),
  inspectedAt: z.string().optional(),
});

export type QAAuditReport = z.infer<typeof QAAuditReportSchema>;

// ==============================================================================
// 7. COMPLETE 3D ANIMATED PROJECT & RENDER SPECIFICATION
// ==============================================================================

export const VideoFormatSchema = z.enum(['9:16', '16:9']);
export type VideoFormat = z.infer<typeof VideoFormatSchema>;

export const ProjectErrorDetailsSchema = z.object({
  stage: z.string(),
  provider: z.enum(['gemini', 'ai33', 'lyria', 'system']),
  errorCode: z.string(),
  message: z.string(),
  isRetryable: z.boolean(),
  timestamp: z.string(),
  retryAfterSeconds: z.number().optional(),
});

export type ProjectErrorDetails = z.infer<typeof ProjectErrorDetailsSchema>;

export const Pure3DStudioProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  aspectRatio: VideoFormatSchema.default('9:16'),
  targetDurationSeconds: z.number().default(60),
  researchNotes: z.string().optional(),
  characters: z.array(CharacterDNASchema),
  canonicalSheets: z.array(CanonicalCharacterSheetSchema),
  beats: z.array(NarrativeBeatSchema),
  narration: AudioNarrationSchema.optional(),
  shots: z.array(RenderedShotSchema).optional(),
  soundtrack: SoundtrackScoreSchema.optional(),
  qaReport: QAAuditReportSchema.optional(),
  outputVideoUrl: z.string().optional(),
  lastError: ProjectErrorDetailsSchema.optional(),
  status: z.enum([
    'idle',
    'researching',
    'scripting',
    'generating_anchor_sheet',
    'auditing_continuity',
    'synthesizing_voice',
    'directing_and_rendering_shots',
    'composing_music',
    'running_visual_qa',
    'completed',
    'failed',
  ]).default('idle'),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Pure3DStudioProject = z.infer<typeof Pure3DStudioProjectSchema>;

// ==============================================================================
// 8. GEMINI PLUS MODEL CATALOGUE (From active API Query List)
// ==============================================================================

export interface GeminiModelEntry {
  id: string;
  name: string;
  category: 'STABLE' | 'PREVIEW';
  defaultFor?: 'researcher' | 'screenwriter' | 'continuity' | 'image_generator' | 'director' | 'music' | 'qa' | 'ui';
}

export const DEEP_RESEARCH_MODELS: GeminiModelEntry[] = [
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', category: 'STABLE', defaultFor: 'researcher' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', category: 'STABLE' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', category: 'STABLE' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', category: 'STABLE' },
  { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen', category: 'STABLE' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'STABLE' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', category: 'STABLE' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'STABLE' },
];

export const AVAILABLE_GEMINI_MODELS: GeminiModelEntry[] = [
  // STABLE
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', category: 'STABLE', defaultFor: 'researcher' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', category: 'STABLE' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', category: 'STABLE' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', category: 'STABLE' },
  { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen', category: 'STABLE' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'STABLE' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', category: 'STABLE' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'STABLE' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', category: 'STABLE' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', category: 'STABLE', defaultFor: 'director' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', category: 'STABLE' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite Latest', category: 'STABLE' },
  { id: 'gemini-omni-1.1-flash', name: 'Gemini Omni 1.1 Flash', category: 'STABLE' },
  { id: 'gemini-omni-1.2-flash', name: 'Gemini Omni 1.2 Flash', category: 'STABLE', defaultFor: 'qa' },
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana (gemini-2.5-flash-image)', category: 'STABLE' },
  { id: 'gemini-3.1-flash-image', name: 'Nano Banana 2 (gemini-3.1-flash-image)', category: 'STABLE' },
  { id: 'gemini-3.1-flash-lite-image', name: 'Nano Banana 2 Lite (gemini-3.1-flash-lite-image)', category: 'STABLE' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', category: 'STABLE', defaultFor: 'screenwriter' },
  { id: 'gemini-3.5-transcribe', name: 'Gemini 3.5 Transcribe', category: 'STABLE' },
  { id: 'gemini-4-argon', name: 'Gemini 4 Argon', category: 'STABLE', defaultFor: 'continuity' },
  { id: 'gemini-4-carbon', name: 'Gemini 4 Carbon', category: 'STABLE' },
  { id: 'gemini-pro-latest', name: 'Gemini Pro Latest', category: 'STABLE' },
  { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B A4B IT', category: 'STABLE' },
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B IT', category: 'STABLE' },
  { id: 'lyria-3.5', name: 'Lyria 3.5', category: 'STABLE', defaultFor: 'music' },
  { id: 'gemini-nano-banana-2.1', name: 'Nano Banana 2.1', category: 'STABLE' },
  { id: 'gemini-3-pro-image', name: 'Nano Banana Pro (gemini-3-pro-image)', category: 'STABLE', defaultFor: 'image_generator' },
  // PREVIEW
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', category: 'PREVIEW' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite Preview', category: 'PREVIEW' },
  { id: 'gemini-omni-flash-preview', name: 'Gemini Omni Flash Preview', category: 'PREVIEW' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2 Preview (gemini-3.1-flash-image-preview)', category: 'PREVIEW' },
  { id: 'antigravity-preview-05-2026', name: 'Antigravity Agent Preview (05-2026)', category: 'PREVIEW' },
  { id: 'antigravity-preview-09-2026', name: 'Antigravity Agent Preview (09-2026)', category: 'PREVIEW' },
  { id: 'antigravity-preview-latest', name: 'Antigravity Agent Preview Latest', category: 'PREVIEW' },
  { id: 'deep-research-max-preview-04-2026', name: 'Deep Research Max Preview (deep-research-max-preview-04-2026)', category: 'PREVIEW' },
  { id: 'deep-research-preview-04-2026', name: 'Deep Research Preview (deep-research-preview-04-2026)', category: 'PREVIEW' },
  { id: 'deep-research-pro-preview-12-2025', name: 'Deep Research Pro Preview (deep-research-pro-preview-12-2025)', category: 'PREVIEW' },
  { id: 'gemini-2.5-computer-use-preview-10-2025', name: 'Gemini 2.5 Computer Use Preview', category: 'PREVIEW' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', category: 'PREVIEW' },
  { id: 'gemini-3.1-pro-preview-customtools', name: 'Gemini 3.1 Pro Preview Custom Tools', category: 'PREVIEW' },
  { id: 'gemini-robotics-er-2-preview', name: 'Gemini Robotics-ER 2 Preview', category: 'PREVIEW' },
  { id: 'lyria-3-clip-preview', name: 'Lyria 3 Clip Preview', category: 'PREVIEW' },
  { id: 'lyria-3-pro-preview', name: 'Lyria 3 Pro Preview', category: 'PREVIEW' },
  { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro (gemini-3-pro-image-preview)', category: 'PREVIEW' },
  { id: 'nano-banana-pro-preview', name: 'Nano Banana Pro (nano-banana-pro-preview)', category: 'PREVIEW' },
];

export interface GeminiModelSuiteConfig {
  researcherModel: string;
  screenwriterModel: string;
  continuityModel: string;
  imageModel: string;
  directorModel: string;
  musicModel: string;
  qaModel: string;
  uiModel: string;
}

export const DEFAULT_MODEL_SUITE: GeminiModelSuiteConfig = {
  researcherModel: 'gemini-3.1-flash-lite',
  screenwriterModel: 'gemini-2.5-pro',
  continuityModel: 'gemini-4-argon',
  imageModel: 'gemini-3-pro-image',
  directorModel: 'gemini-3.7-flash',
  musicModel: 'lyria-3.5',
  qaModel: 'gemini-omni-1.2-flash',
  uiModel: 'gemini-3.1-flash-lite',
};

