/**
 * @studio/3d-engine
 * Core 3D engine utilities, procedural character rigs, lighting presets, and camera interpolations.
 */

export interface Vector3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface ProceduralBone {
  name: string;
  parentName?: string;
  defaultPosition: [number, number, number];
  defaultRotation: [number, number, number];
}

export interface CharacterRig {
  id: string;
  bones: ProceduralBone[];
  applyPose(poseId: string, blendFactor?: number): void;
  setExpression(emotion: string, intensity?: number): void;
}

export interface SceneRenderContext {
  width: number;
  height: number;
  fps: number;
  currentFrame: number;
  totalFrames: number;
}

