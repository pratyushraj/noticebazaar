ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_stage text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS link_shared_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_offer_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_deal_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_deals integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offers_received integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offers_accepted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storefront_views integer DEFAULT 0;

UPDATE public.profiles
SET
  creator_stage = COALESCE(creator_stage, CASE
    WHEN COALESCE(total_earnings, 0) >= 200000 OR COALESCE(completed_deals, 0) >= 10 THEN 'power'
    WHEN COALESCE(completed_deals, 0) >= 3 OR COALESCE(total_deals, 0) >= 3 THEN 'active'
    WHEN COALESCE(completed_deals, 0) >= 1 THEN 'first_deal'
    WHEN COALESCE(offers_received, 0) >= 1 OR COALESCE(total_deals, 0) >= 1 THEN 'first_offer'
    WHEN link_shared_at IS NOT NULL THEN 'link_shared'
    WHEN COALESCE(reel_price, avg_rate_reel, 0) > 0 THEN 'priced'
    ELSE 'new'
  END),
  total_deals = COALESCE(total_deals, 0),
  total_earnings = COALESCE(total_earnings, 0),
  offers_received = COALESCE(offers_received, 0),
  offers_accepted = COALESCE(offers_accepted, 0),
  storefront_views = COALESCE(storefront_views, 0)
WHERE role = 'creator';

COMMENT ON COLUMN public.profiles.creator_stage IS 'Lifecycle stage for creator activation and lifecycle nudges';
COMMENT ON COLUMN public.profiles.link_shared_at IS 'Timestamp when creator first shared their collab link';
COMMENT ON COLUMN public.profiles.first_offer_at IS 'Timestamp when creator first received an offer';
COMMENT ON COLUMN public.profiles.first_deal_at IS 'Timestamp when creator first completed a deal';
COMMENT ON COLUMN public.profiles.total_deals IS 'Total deal count tracked for creator lifecycle';
COMMENT ON COLUMN public.profiles.total_earnings IS 'Total earnings tracked for creator lifecycle';
COMMENT ON COLUMN public.profiles.offers_received IS 'Offer count tracked for creator lifecycle';
COMMENT ON COLUMN public.profiles.offers_accepted IS 'Accepted offer count tracked for creator lifecycle';
COMMENT ON COLUMN public.profiles.storefront_views IS 'Collab storefront view count used in dashboard performance';
