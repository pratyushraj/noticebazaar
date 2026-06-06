-- Add creator suggested script and song columns to shoot_workspaces table
ALTER TABLE public.shoot_workspaces 
ADD COLUMN IF NOT EXISTS creator_script text DEFAULT ''::text NOT NULL,
ADD COLUMN IF NOT EXISTS creator_song text DEFAULT ''::text NOT NULL;
