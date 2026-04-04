ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS niche text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS reel_price numeric,
  ADD COLUMN IF NOT EXISTS story_price numeric,
  ADD COLUMN IF NOT EXISTS post_price numeric,
  ADD COLUMN IF NOT EXISTS barter_min_value numeric,
  ADD COLUMN IF NOT EXISTS delivery_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS revisions integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS audience_type text,
  ADD COLUMN IF NOT EXISTS past_collabs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_logos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS case_studies jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS takes_advance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_deals integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_hours numeric,
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS repeat_brands integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS on_time_delivery_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storefront_completion integer DEFAULT 0;

UPDATE public.profiles
SET
  city = COALESCE(city, collab_region_label, location),
  niche = COALESCE(niche, creator_category),
  language = COALESCE(language, primary_audience_language),
  reel_price = COALESCE(reel_price, avg_rate_reel, pricing_min),
  barter_min_value = COALESCE(barter_min_value, suggested_barter_value_min),
  upi_id = COALESCE(upi_id, bank_upi),
  response_hours = COALESCE(response_hours, collab_response_hours_override),
  completed_deals = COALESCE(completed_deals, collab_brands_count_override, 0)
WHERE role = 'creator';

COMMENT ON COLUMN public.profiles.city IS 'Creator city shown on storefront and dashboard checklist';
COMMENT ON COLUMN public.profiles.niche IS 'Primary niche label for creator storefront';
COMMENT ON COLUMN public.profiles.language IS 'Creator spoken or audience language';
COMMENT ON COLUMN public.profiles.reel_price IS 'Starting reel price used in progressive onboarding';
COMMENT ON COLUMN public.profiles.story_price IS 'Starting story price used in progressive onboarding';
COMMENT ON COLUMN public.profiles.post_price IS 'Starting post price used in progressive onboarding';
COMMENT ON COLUMN public.profiles.barter_min_value IS 'Minimum barter value the creator accepts';
COMMENT ON COLUMN public.profiles.delivery_days IS 'Typical content delivery time in days';
COMMENT ON COLUMN public.profiles.revisions IS 'Default revisions included';
COMMENT ON COLUMN public.profiles.audience_type IS 'Short audience description such as women 18-30 in metro cities';
COMMENT ON COLUMN public.profiles.past_collabs IS 'List of notable past collaborations';
COMMENT ON COLUMN public.profiles.brand_logos IS 'List of brand logo URLs or labels';
COMMENT ON COLUMN public.profiles.testimonials IS 'List of testimonial quotes';
COMMENT ON COLUMN public.profiles.case_studies IS 'List of case study summaries';
COMMENT ON COLUMN public.profiles.upi_id IS 'Preferred UPI payout identifier';
COMMENT ON COLUMN public.profiles.takes_advance IS 'Whether creator usually requests advance payment';
COMMENT ON COLUMN public.profiles.completed_deals IS 'Total completed deals, optionally system-derived later';
COMMENT ON COLUMN public.profiles.response_hours IS 'Average response time in hours';
COMMENT ON COLUMN public.profiles.availability_status IS 'Current availability for new collaborations';
COMMENT ON COLUMN public.profiles.repeat_brands IS 'Count of repeat brands';
COMMENT ON COLUMN public.profiles.on_time_delivery_rate IS 'On-time delivery percentage';
COMMENT ON COLUMN public.profiles.conversion_rate IS 'Offer-to-booking conversion rate';
COMMENT ON COLUMN public.profiles.storefront_completion IS 'Storefront strength percentage for progressive profile completion';
