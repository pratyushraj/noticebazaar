-- RLS Security Audit Fixes
-- Addresses security vulnerabilities found in audit

-- ============================================
-- 1. ADD MISSING DELETE POLICY FOR CONTRACT_ISSUES
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contract_issues'
    AND policyname = 'Creators can delete their own contract issues'
  ) THEN
    CREATE POLICY "Creators can delete their own contract issues"
    ON public.contract_issues FOR DELETE TO authenticated
    USING (auth.uid() = creator_id);
  END IF;
END $$;

-- ============================================
-- 2. ADD MISSING DELETE POLICY FOR BRAND_MESSAGES
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'brand_messages'
    AND policyname = 'Creators can delete their own brand messages'
  ) THEN
    CREATE POLICY "Creators can delete their own brand messages"
    ON public.brand_messages FOR DELETE TO authenticated
    USING (auth.uid() = creator_id);
  END IF;
END $$;

-- ============================================
-- 3. VERIFY BRAND_DEALS RLS POLICIES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'brand_deals' AND policyname = 'Creators can view their own brand deals.') THEN
    CREATE POLICY "Creators can view their own brand deals." ON public.brand_deals FOR SELECT TO authenticated USING (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'brand_deals' AND policyname = 'Creators can insert their own brand deals.') THEN
    CREATE POLICY "Creators can insert their own brand deals." ON public.brand_deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'brand_deals' AND policyname = 'Creators can update their own brand deals.') THEN
    CREATE POLICY "Creators can update their own brand deals." ON public.brand_deals FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'brand_deals' AND policyname = 'Creators can delete their own brand deals.') THEN
    CREATE POLICY "Creators can delete their own brand deals." ON public.brand_deals FOR DELETE TO authenticated USING (auth.uid() = creator_id);
  END IF;
END $$;

-- ============================================
-- 4. ADD RLS FOR ISSUES TABLE (if missing)
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'issues') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'issues' AND policyname = 'Users can delete their own issues') THEN
      CREATE POLICY "Users can delete their own issues" ON public.issues FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- 5. ADD RLS FOR LAWYER_REQUESTS
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lawyer_requests') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lawyer_requests' AND policyname = 'Creators can delete their own pending lawyer requests') THEN
      CREATE POLICY "Creators can delete their own pending lawyer requests"
      ON public.lawyer_requests FOR DELETE TO authenticated
      USING (auth.uid() = creator_id AND status = 'pending');
    END IF;
  END IF;
END $$;

-- ============================================
-- 6. VERIFY NOTIFICATIONS TABLE RLS
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
      CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
      CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
  END IF;
END $$;
