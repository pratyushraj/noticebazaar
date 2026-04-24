-- Ensure creator vibe selections have a dedicated persisted field.
-- Older environments had content_niches but not content_vibes, which made
-- the dashboard look saved locally while refresh lost the vibe selection.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS content_vibes text[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.content_vibes IS 'Creator content style/vibe tags shown on the collab page';
