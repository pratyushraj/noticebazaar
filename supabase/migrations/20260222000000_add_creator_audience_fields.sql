-- Add creator audience analytics fields to profiles table
-- Safe to run multiple times

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS audience_gender_split text,
ADD COLUMN IF NOT EXISTS top_cities jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS audience_age_range text,
ADD COLUMN IF NOT EXISTS primary_audience_language text,
ADD COLUMN IF NOT EXISTS posting_frequency text;

COMMENT ON COLUMN public.profiles.audience_gender_split IS 'Audience gender split text summary';
COMMENT ON COLUMN public.profiles.top_cities IS 'Top audience cities as JSON array';
COMMENT ON COLUMN public.profiles.audience_age_range IS 'Primary audience age range';
COMMENT ON COLUMN public.profiles.primary_audience_language IS 'Primary audience language';
COMMENT ON COLUMN public.profiles.posting_frequency IS 'Posting frequency summary';
