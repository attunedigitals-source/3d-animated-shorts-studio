/**
 * Pure AI 3D Animated Video Studio: Domain Schemas & Types
 * Strictly implements NEXT_GEN_3D_STUDIO_PROPOSAL.md
 * Autonomous High-End 3D CGI Video Creation Exclusively via Google Gemini Models & ai33.pro Voice.
 */

import { z } from 'zod';

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
});

export type WordTimestamp = z.infer<typeof WordTimestampSchema>;

export const AudioNarrationSchema = z.object({
  audioUrl: z.string(),
  durationSeconds: z.number().positive(),
  timestamps: z.array(WordTimestampSchema),
  voiceModel: z.string().default('ai33-neural-hd'),
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
});

export type SoundtrackScore = z.infer<typeof SoundtrackScoreSchema>;

// ==============================================================================
// 6. VISUAL QA INSPECTOR REPORT (Gemini Omni 1.2 Flash)
// ==============================================================================

export const QAAuditReportSchema = z.object({
  passed: z.boolean(),
  characterConsistencyScore: z.number().min(0).max(100),
  visualFidelityScore: z.number().min(0).max(100),
  subtitleLegibility: z.boolean(),
  feedback: z.array(z.string()),
});

export type QAAuditReport = z.infer<typeof QAAuditReportSchema>;

// ==============================================================================
// 7. COMPLETE 3D ANIMATED PROJECT & RENDER SPECIFICATION
// ==============================================================================

export const VideoFormatSchema = z.enum(['9:16', '16:9']);
export type VideoFormat = z.infer<typeof VideoFormatSchema>;

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
