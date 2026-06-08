-- Add approvals to shoot_videos table
ALTER TABLE public.shoot_videos 
ADD COLUMN IF NOT EXISTS approved_for_reel boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS approved_for_story boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS approved_for_ad boolean DEFAULT false NOT NULL;
