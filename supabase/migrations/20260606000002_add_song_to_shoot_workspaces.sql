-- Add song_option column to shoot_workspaces table
ALTER TABLE public.shoot_workspaces 
ADD COLUMN IF NOT EXISTS song_option text DEFAULT ''::text NOT NULL;
