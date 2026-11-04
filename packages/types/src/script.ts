import { z } from 'zod';

export const ScriptDialogueLineSchema = z.object({
  characterName: z.string(),
  line: z.string(),
  deliveryInstruction: z.string().optional(),
});

export type ScriptDialogueLine = z.infer<typeof ScriptDialogueLineSchema>;

export const ScriptSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  sceneHeading: z.string().min(1, 'Scene heading is required'),
  narration: z.string().default(''),
  dialogue: z.array(ScriptDialogueLineSchema).default([]),
  actionDescriptions: z.string().min(1, 'Action description is required'),
  emotionalDirection: z.string().min(1, 'Emotional direction is required'),
  approximateDurationSeconds: z.number().positive(),
  estimatedWordCount: z.number().int().nonnegative(),
});

export type ScriptScene = z.infer<typeof ScriptSceneSchema>;

export const ScriptDocumentSchema = z.object({
  title: z.string(),
  scenes: z.array(ScriptSceneSchema).min(1, 'At least one scene is required'),
  totalWordCount: z.number().int().nonnegative(),
  totalEstimatedDurationSeconds: z.number().positive(),
  targetDurationSeconds: z.number().positive(),
});

export type ScriptDocument = z.infer<typeof ScriptDocumentSchema>;

export interface ScriptRecord extends ScriptDocument {
  id: string;
  projectId: string;
  storyId?: string;
  userId?: string;
  revisionNumber: number;
  createdAt: string;
  updatedAt: string;
}

