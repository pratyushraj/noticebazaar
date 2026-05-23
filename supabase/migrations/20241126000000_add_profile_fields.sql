-- Add missing profile fields for creator onboarding and profile settings
-- This migration adds: phone, location, bio, platforms, goals

-- Add phone field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;

-- Add location field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location text;

-- Add bio field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text;

-- Add platforms field (JSONB array to store selected platforms)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS platforms jsonb DEFAULT '[]'::jsonb;

-- Add goals field (JSONB array to store selected goals)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description';
COMMENT ON COLUMN public.profiles.platforms IS 'Array of platforms user creates on (youtube, instagram, twitter, etc.)';
COMMENT ON COLUMN public.profiles.goals IS 'Array of user goals (protect, earnings, taxes, etc.)';

