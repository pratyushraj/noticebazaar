-- Add final and suggested caption columns to shoot_workspaces table
ALTER TABLE public.shoot_workspaces 
ADD COLUMN IF NOT EXISTS caption_option text DEFAULT ''::text NOT NULL,
ADD COLUMN IF NOT EXISTS creator_caption text DEFAULT ''::text NOT NULL;
