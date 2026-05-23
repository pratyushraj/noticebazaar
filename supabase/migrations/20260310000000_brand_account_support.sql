-- Migration to support automatic brand account creation and brand dashboards
-- Date: 2026-03-10

-- 1. Add brand_id to collab_requests for linking to authenticated brand users
ALTER TABLE public.collab_requests ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_collab_requests_brand_id ON public.collab_requests(brand_id);

-- 2. Add brand_id to brand_deals for linking to authenticated brand users
ALTER TABLE public.brand_deals ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_brand_deals_brand_id ON public.brand_deals(brand_id);

-- 3. Update handle_new_user to respect metadata role
-- This allows us to set the role during auth.admin.createUser
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Extract role from raw_user_meta_data if it exists, default to 'creator'
  assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'creator');
  
  INSERT INTO public.profiles (id, role, onboarding_complete, updated_at)
  VALUES (
    NEW.id,
    assigned_role,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role,
      updated_at = NOW()
  WHERE public.profiles.role = 'creator' AND EXCLUDED.role = 'brand'; -- Allow upgrading if needed
      
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS for Brands on collab_requests
-- Ensure brands can see the offers they've sent
DROP POLICY IF EXISTS "Brands can view their own submitted requests" ON public.collab_requests;
CREATE POLICY "Brands can view their own submitted requests"
ON public.collab_requests FOR SELECT
TO authenticated
USING (auth.uid() = brand_id OR (auth.uid() IS NOT NULL AND brand_email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- 5. RLS for Brands on brand_deals
-- Ensure brands can see their active and past deals
DROP POLICY IF EXISTS "Brands can view their own deals" ON public.brand_deals;
CREATE POLICY "Brands can view their own deals"
ON public.brand_deals FOR SELECT
TO authenticated
USING (auth.uid() = brand_id OR (auth.uid() IS NOT NULL AND brand_email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- 6. Add policy for creators to see their brand's info in a deal (if we add brand_id)
-- Already covered by "Creators can view their own brand deals"

-- 7. Add business fields to profiles if missing (some might be creator specific but usable for brands)
-- brand_name -> business_name
-- brand_website -> website (need to check if exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry TEXT;

COMMENT ON COLUMN public.profiles.company_size IS 'Estimated size of the brand company';
COMMENT ON COLUMN public.profiles.industry IS 'Business industry for brands';
