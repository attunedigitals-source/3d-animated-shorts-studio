import { z } from 'zod';

export const StoryPromptOptionsSchema = z.object({
  topic: z.string().min(3, 'Story idea must be at least 3 characters long'),
  title: z.string().optional(),
  category: z.string().default('Comedy'),
  targetDurationSeconds: z.number().min(10).max(180).default(30),
  intendedAudience: z.string().default('General Audience'),
  tone: z.string().default('Humorous and Whimsical'),
  visualStyle: z.string().default('Stylized 3D Cartoon'),
  language: z.string().default('English'),
  additionalInstructions: z.string().optional(),
});

export type StoryPromptOptions = z.infer<typeof StoryPromptOptionsSchema>;

export const CharacterDescriptionSchema = z.object({
  name: z.string(),
  role: z.string(),
  personality: z.string(),
  appearance: z.string(),
  visualDistinctives: z.string().optional(),
});

export type CharacterDescription = z.infer<typeof CharacterDescriptionSchema>;

export const StoryDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  logline: z.string().min(10, 'Logline must be at least 10 characters'),
  premise: z.string().min(10, 'Premise is required'),
  beginning: z.string().min(10, 'Beginning is required'),
  mainConflict: z.string().min(10, 'Main conflict is required'),
  turningPoints: z.array(z.string()).min(1, 'At least one turning point is required'),
  climax: z.string().min(10, 'Climax is required'),
  ending: z.string().min(10, 'Ending is required'),
  characterDescriptions: z.array(CharacterDescriptionSchema).min(1, 'At least one character is required'),
  emotionalProgression: z.string().min(5, 'Emotional progression is required'),
});

export type StoryDocument = z.infer<typeof StoryDocumentSchema>;

export interface StoryRecord extends StoryDocument {
  id: string;
  projectId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

