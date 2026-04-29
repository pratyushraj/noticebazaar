-- Optimization: Add indexes for brand dashboard lookups and RLS
-- These help speed up queries filtered by brand_id or brand_email

-- Indexes for collab_requests
CREATE INDEX IF NOT EXISTS idx_collab_requests_brand_id ON public.collab_requests(brand_id) WHERE brand_id IS NOT NULL;
-- brand_email index already exists from 20260115000000

-- Indexes for brand_deals
CREATE INDEX IF NOT EXISTS idx_brand_deals_brand_email ON public.brand_deals(brand_email);
CREATE INDEX IF NOT EXISTS idx_brand_deals_brand_id ON public.brand_deals(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_brand_deals_creator_id ON public.brand_deals(creator_id);

-- Indexes for profiles (used in hydration)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
