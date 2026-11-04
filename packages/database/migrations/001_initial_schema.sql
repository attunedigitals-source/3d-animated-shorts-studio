-- =============================================================================
-- 3D ANIMATED SHORTS STUDIO: INITIAL SCHEMA MIGRATION (BLUEPRINT)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  target_duration_seconds INTEGER NOT NULL DEFAULT 30,
  fps INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Stories & Scripts Table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  concept_prompt TEXT NOT NULL,
  logline TEXT,
  narrative_arc JSONB NOT NULL DEFAULT '{}'::jsonb,
  scenes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Characters Table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rig_type TEXT NOT NULL DEFAULT 'humanoid-stylized',
  model_asset_url TEXT,
  palette JSONB NOT NULL DEFAULT '{}'::jsonb,
  proportions JSONB NOT NULL DEFAULT '{}'::jsonb,
  voice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Scenes Table
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  duration_seconds NUMERIC NOT NULL DEFAULT 5.0,
  environment JSONB NOT NULL DEFAULT '{}'::jsonb,
  objects JSONB NOT NULL DEFAULT '[]'::jsonb,
  character_animations JSONB NOT NULL DEFAULT '[]'::jsonb,
  camera JSONB NOT NULL DEFAULT '{}'::jsonb,
  script JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Audio Tracks Table
CREATE TABLE IF NOT EXISTS audio_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'voiceover', 'music', 'sfx'
  label TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  start_time_seconds NUMERIC NOT NULL DEFAULT 0.0,
  duration_seconds NUMERIC NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 1.0,
  fade_in_seconds NUMERIC DEFAULT 0.0,
  fade_out_seconds NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Render Jobs Table
CREATE TABLE IF NOT EXISTS render_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'stitching', 'completed', 'failed'
  percentage NUMERIC NOT NULL DEFAULT 0.0,
  current_scene INTEGER,
  total_scenes INTEGER,
  rendered_frames INTEGER DEFAULT 0,
  total_frames INTEGER DEFAULT 0,
  resolution JSONB NOT NULL DEFAULT '{"width": 1080, "height": 1920}'::jsonb,
  fps INTEGER NOT NULL DEFAULT 30,
  output_video_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

