-- Security hardening for Supabase linter findings:
-- 1) Ensure RLS is enabled on externally exposed public tables
-- 2) Add/normalize policies for tables that need authenticated access
-- 3) Force views to run as SECURITY INVOKER (not DEFINER)

BEGIN;

-- ---------------------------------------------------------------------------
-- Enable RLS on tables flagged by linter (safe + idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.protection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.protection_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gst_company_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instagram_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_offers ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- instagram_connections: creator can manage only their own connection row
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'instagram_connections'
      AND policyname = 'instagram_connections_select_own'
  ) THEN
    CREATE POLICY instagram_connections_select_own
      ON public.instagram_connections
      FOR SELECT
      TO authenticated
      USING (creator_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'instagram_connections'
      AND policyname = 'instagram_connections_insert_own'
  ) THEN
    CREATE POLICY instagram_connections_insert_own
      ON public.instagram_connections
      FOR INSERT
      TO authenticated
      WITH CHECK (creator_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'instagram_connections'
      AND policyname = 'instagram_connections_update_own'
  ) THEN
    CREATE POLICY instagram_connections_update_own
      ON public.instagram_connections
      FOR UPDATE
      TO authenticated
      USING (creator_id = auth.uid())
      WITH CHECK (creator_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'instagram_connections'
      AND policyname = 'instagram_connections_delete_own'
  ) THEN
    CREATE POLICY instagram_connections_delete_own
      ON public.instagram_connections
      FOR DELETE
      TO authenticated
      USING (creator_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- instagram_performance_snapshots: creator can read/insert their own snapshots
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'instagram_performance_snapshots'
      AND policyname = 'instagram_snapshots_select_own'
  ) THEN
    CREATE POLICY instagram_snapshots_select_own
      ON public.instagram_performance_snapshots
      FOR SELECT
      TO authenticated
      USING (creator_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'instagram_performance_snapshots'
      AND policyname = 'instagram_snapshots_insert_own'
  ) THEN
    CREATE POLICY instagram_snapshots_insert_own
      ON public.instagram_performance_snapshots
      FOR INSERT
      TO authenticated
      WITH CHECK (creator_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- gst_company_cache: internal cache (service role only)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gst_company_cache'
      AND policyname = 'gst_company_cache_service_role_all'
  ) THEN
    CREATE POLICY gst_company_cache_service_role_all
      ON public.gst_company_cache
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- campaigns + campaign_offers: lock down by default (service role only)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'campaigns'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaigns'
      AND policyname = 'campaigns_service_role_all'
  ) THEN
    CREATE POLICY campaigns_service_role_all
      ON public.campaigns
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'campaign_offers'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_offers'
      AND policyname = 'campaign_offers_service_role_all'
  ) THEN
    CREATE POLICY campaign_offers_service_role_all
      ON public.campaign_offers
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Views: avoid SECURITY DEFINER behavior flagged by linter
-- ---------------------------------------------------------------------------
ALTER VIEW IF EXISTS public.analytics_dashboard SET (security_invoker = true);
ALTER VIEW IF EXISTS public.performance_metrics SET (security_invoker = true);

COMMIT;
