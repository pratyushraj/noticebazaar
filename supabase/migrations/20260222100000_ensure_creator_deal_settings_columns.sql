-- Ensure creator deal settings and audience fields exist on profiles.
-- This migration is intentionally idempotent so it is safe on partially migrated projects.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS creator_category text,
ADD COLUMN IF NOT EXISTS avg_rate_reel numeric,
ADD COLUMN IF NOT EXISTS pricing_min integer,
ADD COLUMN IF NOT EXISTS pricing_avg integer,
ADD COLUMN IF NOT EXISTS pricing_max integer,
ADD COLUMN IF NOT EXISTS open_to_collabs boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS content_niches jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS media_kit_url text,
ADD COLUMN IF NOT EXISTS audience_gender_split text,
ADD COLUMN IF NOT EXISTS top_cities jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS audience_age_range text,
ADD COLUMN IF NOT EXISTS primary_audience_language text,
ADD COLUMN IF NOT EXISTS posting_frequency text;

COMMENT ON COLUMN public.profiles.creator_category IS 'Creator category (Fashion, Beauty, Tech, etc.)';
COMMENT ON COLUMN public.profiles.avg_rate_reel IS 'Creator typical reel rate in INR';
COMMENT ON COLUMN public.profiles.pricing_min IS 'Creator minimum deal budget in INR';
COMMENT ON COLUMN public.profiles.pricing_avg IS 'Creator average deal budget in INR';
COMMENT ON COLUMN public.profiles.pricing_max IS 'Creator maximum deal budget in INR';
COMMENT ON COLUMN public.profiles.open_to_collabs IS 'Whether creator is open to incoming collaborations';
COMMENT ON COLUMN public.profiles.content_niches IS 'Creator content niche tags';
COMMENT ON COLUMN public.profiles.media_kit_url IS 'Optional media kit URL';
COMMENT ON COLUMN public.profiles.audience_gender_split IS 'Audience gender split summary text';
COMMENT ON COLUMN public.profiles.top_cities IS 'Top audience cities as a JSON array';
COMMENT ON COLUMN public.profiles.audience_age_range IS 'Audience age range summary';
COMMENT ON COLUMN public.profiles.primary_audience_language IS 'Primary audience language';
COMMENT ON COLUMN public.profiles.posting_frequency IS 'Posting cadence summary';

CREATE INDEX IF NOT EXISTS idx_profiles_open_to_collabs_creator
ON public.profiles(open_to_collabs)
WHERE role = 'creator';

CREATE INDEX IF NOT EXISTS idx_profiles_content_niches_gin
ON public.profiles USING gin(content_niches)
WHERE content_niches IS NOT NULL AND content_niches != '[]'::jsonb;
