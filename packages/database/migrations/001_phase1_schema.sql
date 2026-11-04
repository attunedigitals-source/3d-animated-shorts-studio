-- ==============================================================================
-- 3D ANIMATED SHORTS STUDIO: PHASE 1 SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to create profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'displayName', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  preferences JSONB NOT NULL DEFAULT '{"category": "Comedy", "targetDurationSeconds": 30, "aspectRatio": "9:16", "fps": 30}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- 4. Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  logline TEXT NOT NULL,
  premise TEXT NOT NULL,
  beginning TEXT NOT NULL,
  main_conflict TEXT NOT NULL,
  turning_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  climax TEXT NOT NULL,
  ending TEXT NOT NULL,
  character_descriptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  emotional_progression TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_stories_project UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_project_id ON public.stories(project_id);

-- 5. Scripts Table
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  revision_number INTEGER NOT NULL DEFAULT 1,
  scenes JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_word_count INTEGER NOT NULL DEFAULT 0,
  total_estimated_duration_seconds NUMERIC NOT NULL DEFAULT 0,
  target_duration_seconds NUMERIC NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scripts_project_id ON public.scripts(project_id);

-- 6. Scenes Table (Structured 3D production scenes)
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  scene_title TEXT NOT NULL,
  scene_description TEXT NOT NULL,
  characters_involved JSONB NOT NULL DEFAULT '[]'::jsonb,
  character_actions TEXT NOT NULL DEFAULT '',
  dialogue JSONB NOT NULL DEFAULT '[]'::jsonb,
  narration TEXT NOT NULL DEFAULT '',
  environment_description TEXT NOT NULL,
  props_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  emotional_tone TEXT NOT NULL,
  camera_direction_suggestions TEXT NOT NULL,
  approximate_duration_seconds NUMERIC NOT NULL DEFAULT 5.0,
  continuity_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON public.scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order ON public.scenes(project_id, scene_number ASC);

-- 7. AI Generation Records Table
CREATE TABLE IF NOT EXISTS public.ai_generation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- 'story', 'script', 'scene_breakdown'
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_snippet TEXT NOT NULL,
  tokens_used INTEGER,
  latency_ms INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_records_user_id ON public.ai_generation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_records_project_id ON public.ai_generation_records(project_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_records ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects: Full access to owned projects only
CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Stories: Full access to stories of owned projects
CREATE POLICY "Users can manage own stories" ON public.stories
  FOR ALL USING (auth.uid() = user_id);

-- Scripts: Full access to scripts of owned projects
CREATE POLICY "Users can manage own scripts" ON public.scripts
  FOR ALL USING (auth.uid() = user_id);

-- Scenes: Full access to scenes of owned projects
CREATE POLICY "Users can manage own scenes" ON public.scenes
  FOR ALL USING (auth.uid() = user_id);

-- AI Records: Users can view their own AI generation records
CREATE POLICY "Users can view own AI records" ON public.ai_generation_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI records" ON public.ai_generation_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

