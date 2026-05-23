-- Migration: Add SELECT policy for deals table so brands can view their own deals
-- Fixes blank brand dashboard by ensuring brand_id-linked deals are readable

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'deals' AND schemaname = 'public'
  ) THEN
    EXECUTE 'ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own deals" ON public.deals';
    EXECUTE 'DROP POLICY IF EXISTS "brands_can_view_own_deals" ON public.deals';
    EXECUTE 'DROP POLICY IF EXISTS "deals_select_own" ON public.deals';
    
    EXECUTE 'CREATE POLICY "Users can view own deals"
      ON public.deals FOR SELECT TO authenticated
      USING (
        auth.uid() = brand_id
        OR auth.uid() = creator_id
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
      
    EXECUTE 'DROP POLICY IF EXISTS "Service role can do anything on deals" ON public.deals';
    EXECUTE 'CREATE POLICY "Service role can do anything on deals"
      ON public.deals FOR ALL TO service_role USING (true) WITH CHECK (true)';
      
    EXECUTE 'GRANT SELECT ON public.deals TO authenticated';
    EXECUTE 'GRANT ALL ON public.deals TO service_role';
  ELSE
    RAISE NOTICE 'deals table does not exist, skipping migration';
  END IF;
END
$$;
