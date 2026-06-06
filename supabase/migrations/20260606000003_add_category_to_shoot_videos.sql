-- Add category column to shoot_videos table
ALTER TABLE public.shoot_videos 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'treatment'::text NOT NULL;
