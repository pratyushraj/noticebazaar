-- Add instagram sync fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram_profile_photo text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_instagram_sync timestamptz;
