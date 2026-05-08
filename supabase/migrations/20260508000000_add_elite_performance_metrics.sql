-- Migration: Add missing Elite and Performance metrics to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avg_reel_views_manual bigint,
  ADD COLUMN IF NOT EXISTS engagement_rate numeric,
  ADD COLUMN IF NOT EXISTS response_hours integer,
  ADD COLUMN IF NOT EXISTS reliability_score integer DEFAULT 98,
  ADD COLUMN IF NOT EXISTS past_brands text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_elite_verified boolean DEFAULT false;

-- Add index for username search
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
