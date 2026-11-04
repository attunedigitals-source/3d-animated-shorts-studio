/**
 * @studio/types
 * Core domain types and validation schemas for 3D Animated Shorts Studio.
 */

export * from './story';
export * from './script';
export * from './scene';
export * from './project';
export * from './auth';
export * from './ai';
export * from './api';

// ==============================================================================
// 3D & MEDIA PIPELINE TYPES (Forward compatibility for Phases 2–8)
// ==============================================================================

export type CharacterEmotion = 'neutral' | 'happy' | 'excited' | 'sad' | 'angry' | 'surprised' | 'scared' | 'confused';

export interface CharacterColorPalette {
  primary: string;
  secondary: string;
  skin: string;
  hair: string;
  eyes: string;
  clothingTop: string;
  clothingBottom: string;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  rigType: 'humanoid-stylized' | 'creature-stylized' | 'custom-mesh';
  modelAssetUrl?: string;
  palette: CharacterColorPalette;
  proportions: {
    headScale: number;
    torsoScale: number;
    limbScale: number;
    totalHeight: number;
  };
  voiceId?: string;
}

export type LightingPreset = 'daylight-sunny' | 'golden-hour' | 'night-cyberpunk' | 'studio-warm' | 'dramatic-noir';

export interface EnvironmentDefinition {
  id: string;
  name: string;
  preset: 'indoor-room' | 'outdoor-park' | 'sci-fi-corridor' | 'custom-stage';
  skyboxUrl?: string;
  ambientLightColor: string;
  ambientLightIntensity: number;
  sunPosition: [number, number, number];
  lightingPreset: LightingPreset;
  fogColor?: string;
  fogDensity?: number;
}

export type AudioTrackType = 'voiceover' | 'music' | 'sfx';

export interface AudioTrack {
  id: string;
  type: AudioTrackType;
  label: string;
  assetUrl: string;
  startTimeSeconds: number;
  durationSeconds: number;
  volume: number;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}

export type RenderJobStatus = 'queued' | 'processing' | 'stitching' | 'completed' | 'failed';

export interface RenderJobProgress {
  jobId: string;
  status: RenderJobStatus;
  percentage: number;
  currentScene?: number;
  totalScenes?: number;
  renderedFrames?: number;
  totalFrames?: number;
  errorMessage?: string;
  outputVideoUrl?: string;
}
