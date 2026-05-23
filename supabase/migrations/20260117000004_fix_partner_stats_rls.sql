-- Fix partner_stats RLS policy (idempotent - skips if table doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_stats') THEN
    DROP POLICY IF EXISTS "Users can view their own stats" ON public.partner_stats;
    CREATE POLICY "Users can view their own stats"
    ON public.partner_stats FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  ELSE
    RAISE NOTICE 'Table partner_stats does not exist, skipping RLS fix';
  END IF;
END $$;
