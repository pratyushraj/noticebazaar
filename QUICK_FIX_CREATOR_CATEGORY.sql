-- Quick fix: Add creator_category column if it doesn't exist
-- Run this in Supabase SQL Editor if you get "column creator_category does not exist" error

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS creator_category TEXT;

COMMENT ON COLUMN public.profiles.creator_category IS 'Creator category (Fashion, Tech, Fitness, etc.)';

