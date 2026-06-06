-- Add second final and suggested song columns to shoot_workspaces table
ALTER TABLE public.shoot_workspaces 
ADD COLUMN IF NOT EXISTS song_option_2 text DEFAULT ''::text NOT NULL,
ADD COLUMN IF NOT EXISTS creator_song_2 text DEFAULT ''::text NOT NULL;
