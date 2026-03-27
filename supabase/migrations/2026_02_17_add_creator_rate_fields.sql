-- Add creator average rate fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avg_rate_reel numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learned_avg_rate_reel numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learned_deal_count integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.avg_rate_reel IS 'Manually set average rate per Reel during onboarding or in settings';
COMMENT ON COLUMN public.profiles.learned_avg_rate_reel IS 'Learned average rate per Reel calculated from accepted paid deals';
COMMENT ON COLUMN public.profiles.learned_deal_count IS 'Number of paid deals used to calculate the learned_avg_rate_reel';
