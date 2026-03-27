ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS portfolio_links jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.portfolio_links IS 'Featured links to creator work (Reels, TikToks, YouTube shorts, etc.)';
