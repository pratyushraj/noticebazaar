-- Add category column to shoot_workspaces table
ALTER TABLE public.shoot_workspaces 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'treatment'::text NOT NULL;
