-- Add missing collab settings fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS past_brands jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recent_campaign_types jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.past_brands IS 'List of brands the creator has worked with in the past';
COMMENT ON COLUMN public.profiles.recent_campaign_types IS 'Types of campaigns the creator has recently worked on (e.g., Unboxing, Review)';
