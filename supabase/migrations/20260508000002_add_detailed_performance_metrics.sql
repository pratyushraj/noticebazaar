-- Add detailed Meta Insight metrics to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hook_rate numeric,
ADD COLUMN IF NOT EXISTS interaction_rate numeric,
ADD COLUMN IF NOT EXISTS accounts_reached_30d bigint,
ADD COLUMN IF NOT EXISTS accounts_engaged_30d bigint,
ADD COLUMN IF NOT EXISTS is_responsive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_strong_hooks boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.hook_rate IS 'Creator 90-day hook rate percentage';
COMMENT ON COLUMN public.profiles.interaction_rate IS 'Creator 90-day interaction rate percentage';
COMMENT ON COLUMN public.profiles.accounts_reached_30d IS 'Total accounts reached in the last 30 days';
COMMENT ON COLUMN public.profiles.accounts_engaged_30d IS 'Total accounts engaged in the last 30 days';
COMMENT ON COLUMN public.profiles.is_responsive IS 'Badge for high responsiveness based on Meta data';
COMMENT ON COLUMN public.profiles.has_strong_hooks IS 'Badge for high hook rate performance';
