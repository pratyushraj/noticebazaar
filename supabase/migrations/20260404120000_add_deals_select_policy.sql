-- Migration: Add SELECT policy for deals table so brands can view their own deals
-- Fixes blank brand dashboard by ensuring brand_id-linked deals are readable

-- Check if deals table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'deals' AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'deals table does not exist, skipping migration';
    RETURN;
  END IF;
END
$$;

-- Enable RLS on deals if not already enabled
ALTER TABLE IF EXISTS public.deals ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view own deals" ON public.deals;
DROP POLICY IF EXISTS "brands_can_view_own_deals" ON public.deals;
DROP POLICY IF EXISTS "deals_select_own" ON public.deals;

-- Create SELECT policy: brands can view deals where they are the brand
CREATE POLICY "Users can view own deals"
  ON public.deals FOR SELECT TO authenticated
  USING (
    auth.uid() = brand_id
    OR auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ensure service role can do everything
DROP POLICY IF EXISTS "Service role can do anything on deals" ON public.deals;
CREATE POLICY "Service role can do anything on deals"
  ON public.deals FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
