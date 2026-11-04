import { z } from 'zod';

export const StructuredSceneSchema = z.object({
  id: z.string().min(1, 'Scene ID is required'),
  sceneNumber: z.number().int().positive(),
  sceneTitle: z.string().min(1, 'Scene title is required'),
  sceneDescription: z.string().min(1, 'Scene description is required'),
  charactersInvolved: z.array(z.string()).default([]),
  characterActions: z.string().default(''),
  dialogue: z.array(z.object({
    characterName: z.string(),
    line: z.string(),
    emotion: z.string().optional(),
  })).default([]),
  narration: z.string().default(''),
  environmentDescription: z.string().min(1, 'Environment description is required'),
  propsRequired: z.array(z.string()).default([]),
  emotionalTone: z.string().min(1, 'Emotional tone is required'),
  cameraDirectionSuggestions: z.string().min(1, 'Camera direction is required'),
  approximateDurationSeconds: z.number().positive(),
  continuityNotes: z.string().default(''),
});

export type StructuredScene = z.infer<typeof StructuredSceneSchema>;

export const SceneBreakdownDocumentSchema = z.object({
  projectId: z.string(),
  scriptId: z.string().optional(),
  scenes: z.array(StructuredSceneSchema).min(1, 'At least one scene is required'),
  totalDurationSeconds: z.number().positive(),
});

export type SceneBreakdownDocument = z.infer<typeof SceneBreakdownDocumentSchema>;

export interface SceneRecord extends StructuredScene {
  projectId: string;
  scriptId?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

