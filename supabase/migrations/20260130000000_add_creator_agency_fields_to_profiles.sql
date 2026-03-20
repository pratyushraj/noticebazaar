-- Creator agency fields: content niches/tags for matching, open to collabs, media kit
-- Enables future agency: discover creators by niche, availability, portfolio

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS content_niches jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS open_to_collabs boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS media_kit_url text;

COMMENT ON COLUMN public.profiles.content_niches IS 'Content niches/tags for agency matching (e.g. ["fashion", "fitness", "tech"])';
COMMENT ON COLUMN public.profiles.open_to_collabs IS 'Creator is open to new collaboration requests (for agency filtering)';
COMMENT ON COLUMN public.profiles.media_kit_url IS 'Optional media kit or portfolio URL';

CREATE INDEX IF NOT EXISTS idx_profiles_open_to_collabs ON public.profiles(open_to_collabs) WHERE role = 'creator';
CREATE INDEX IF NOT EXISTS idx_profiles_content_niches ON public.profiles USING gin(content_niches) WHERE content_niches IS NOT NULL AND content_niches != '[]'::jsonb;
