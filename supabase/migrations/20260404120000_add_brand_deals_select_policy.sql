-- Migration: Add SELECT policy for brand_deals table so brands and creators can view their own deals
-- Fixes blank brand dashboard by ensuring brand_id-linked deals are readable

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'brand_deals' AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'brand_deals table does not exist, skipping migration';
    RETURN;
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.brand_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own brand_deals" ON public.brand_deals;
DROP POLICY IF EXISTS "brands_can_view_own_deals" ON public.brand_deals;

CREATE POLICY "Users can view own brand_deals"
  ON public.brand_deals FOR SELECT TO authenticated
  USING (
    auth.uid() = brand_id
    OR auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role can do anything on brand_deals" ON public.brand_deals;
CREATE POLICY "Service role can do anything on brand_deals"
  ON public.brand_deals FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.brand_deals TO authenticated;
GRANT ALL ON public.brand_deals TO service_role;
