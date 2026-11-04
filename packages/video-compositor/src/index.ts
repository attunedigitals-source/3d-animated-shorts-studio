/**
 * @studio/video-compositor
 * Remotion video composition schemas, sequence timing, subtitles, and audio layering.
 */

import { Project, Scene, AudioTrack } from '@studio/types';

export interface ShortCompositionProps {
  project: Project;
  scenes: Scene[];
  audioTracks: AudioTrack[];
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

export interface RenderPlan {
  totalDurationFrames: number;
  scenes: Array<{
    sceneId: string;
    startFrame: number;
    durationInFrames: number;
  }>;
}

