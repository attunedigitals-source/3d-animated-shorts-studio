import { z } from 'zod';
import { StoryDocument } from './story';
import { ScriptDocument } from './script';
import { StructuredScene } from './scene';

export const ProjectStatusSchema = z.enum([
  'draft',
  'story_generated',
  'script_generated',
  'scenes_broken_down',
  'ready_for_production',
]);

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectPreferencesSchema = z.object({
  category: z.string().default('Comedy'),
  targetDurationSeconds: z.number().min(10).max(180).default(30),
  intendedAudience: z.string().default('General Audience'),
  tone: z.string().default('Humorous and Whimsical'),
  visualStyle: z.string().default('Stylized 3D Cartoon'),
  language: z.string().default('English'),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  fps: z.number().default(30),
});

export type ProjectPreferences = z.infer<typeof ProjectPreferencesSchema>;

export const CreateProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100),
  description: z.string().max(500).optional(),
  preferences: ProjectPreferencesSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  preferences: ProjectPreferencesSchema.partial().optional(),
  status: ProjectStatusSchema.optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export interface ProjectSummary {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  preferences: ProjectPreferences;
  createdAt: string;
  updatedAt: string;
  sceneCount: number;
  hasStory: boolean;
  hasScript: boolean;
  estimatedDurationSeconds: number;
}

export interface FullProjectDetails extends ProjectSummary {
  story?: StoryDocument;
  script?: ScriptDocument;
  scenes: StructuredScene[];
}

