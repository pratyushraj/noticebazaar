-- Add Instagram sync metadata columns for creator profiles
-- Safe to run multiple times

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_profile_photo text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_instagram_sync timestamptz;

