-- Add second final and suggested hook columns to shoot_workspaces table
ALTER TABLE public.shoot_workspaces 
ADD COLUMN IF NOT EXISTS hook_option_2 text DEFAULT ''::text NOT NULL,
ADD COLUMN IF NOT EXISTS creator_hook_2 text DEFAULT ''::text NOT NULL;
