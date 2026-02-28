-- Manual content impact overrides for public collab profile.
-- These fields are optional and used when Instagram performance snapshots are unavailable.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avg_reel_views_manual integer,
ADD COLUMN IF NOT EXISTS avg_likes_manual integer;

COMMENT ON COLUMN public.profiles.avg_reel_views_manual IS 'Manual override for average reel views shown on collab profile';
COMMENT ON COLUMN public.profiles.avg_likes_manual IS 'Manual override for average likes shown on collab profile';
