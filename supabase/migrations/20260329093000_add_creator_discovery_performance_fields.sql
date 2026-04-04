ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followers_count integer,
  ADD COLUMN IF NOT EXISTS avg_views integer,
  ADD COLUMN IF NOT EXISTS engagement_rate numeric(6,2),
  ADD COLUMN IF NOT EXISTS starting_price integer,
  ADD COLUMN IF NOT EXISTS completed_deals integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reliability_score integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS response_hours integer,
  ADD COLUMN IF NOT EXISTS profile_completion integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_budget_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_badge text,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric(6,2),
  ADD COLUMN IF NOT EXISTS repeat_brands integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS on_time_delivery_rate numeric(6,2);

UPDATE public.profiles
SET
  followers_count = COALESCE(followers_count, instagram_followers, 0),
  avg_views = COALESCE(avg_views, avg_reel_views_manual, 0),
  engagement_rate = COALESCE(engagement_rate, CASE
    WHEN COALESCE(avg_reel_views_manual, 0) > 0 AND COALESCE(avg_likes_manual, 0) > 0
      THEN ROUND((avg_likes_manual::numeric / NULLIF(avg_reel_views_manual, 0)::numeric) * 100, 2)
    ELSE NULL
  END),
  starting_price = COALESCE(starting_price, pricing_min, avg_rate_reel, pricing_avg, 0),
  completed_deals = COALESCE(completed_deals, collab_brands_count_override, 0),
  reliability_score = COALESCE(reliability_score, 100),
  response_hours = COALESCE(response_hours, collab_response_hours_override),
  profile_completion = COALESCE(profile_completion, CASE
    WHEN role = 'creator' THEN
      LEAST(
        100,
        (
          (CASE WHEN COALESCE(first_name, '') <> '' OR COALESCE(business_name, '') <> '' THEN 15 ELSE 0 END) +
          (CASE WHEN COALESCE(username, '') <> '' THEN 15 ELSE 0 END) +
          (CASE WHEN COALESCE(creator_category, '') <> '' THEN 15 ELSE 0 END) +
          (CASE WHEN COALESCE(bio, '') <> '' THEN 15 ELSE 0 END) +
          (CASE WHEN COALESCE(instagram_handle, '') <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN COALESCE(media_kit_url, '') <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN COALESCE(pricing_min, starting_price, avg_rate_reel, 0) > 0 THEN 10 ELSE 0 END) +
          (CASE WHEN COALESCE(instagram_followers, followers_count, 0) > 0 THEN 10 ELSE 0 END)
        )
      )
    ELSE profile_completion
  END),
  availability_status = COALESCE(NULLIF(availability_status, ''), CASE WHEN open_to_collabs IS FALSE THEN 'busy' ELSE 'available' END),
  last_active_at = COALESCE(last_active_at, updated_at, created_at),
  is_verified = COALESCE(is_verified, false),
  is_featured = COALESCE(is_featured, false),
  is_budget_friendly = COALESCE(is_budget_friendly, CASE WHEN COALESCE(pricing_min, starting_price, avg_rate_reel, 0) BETWEEN 1 AND 12000 THEN true ELSE false END),
  repeat_brands = COALESCE(repeat_brands, 0)
WHERE role = 'creator';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_availability_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_availability_status_check
      CHECK (availability_status IN ('available', 'busy', 'next_week', 'unavailable'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_creator_discovery_role
  ON public.profiles (role, creator_category, availability_status);

CREATE INDEX IF NOT EXISTS idx_profiles_creator_discovery_verified
  ON public.profiles (is_verified, is_featured, is_budget_friendly);

CREATE INDEX IF NOT EXISTS idx_profiles_creator_discovery_scores
  ON public.profiles (reliability_score DESC, response_hours ASC, starting_price ASC);
