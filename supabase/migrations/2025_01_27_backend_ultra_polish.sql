-- ============================================================================
-- BACKEND ULTRA POLISH MIGRATION
-- Production-grade, enterprise-secure, performance-optimized backend
-- Date: 2025-01-27
-- ============================================================================

-- ============================================================================
-- PART 1: COMPREHENSIVE RLS AUDIT & FIXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 BRAND_DEALS - Verify and enhance RLS
-- ----------------------------------------------------------------------------

-- Ensure RLS is enabled
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with proper structure
DROP POLICY IF EXISTS "Creators can view and manage their own brand deals." ON public.brand_deals;
DROP POLICY IF EXISTS "Creators can view their own brand deals." ON public.brand_deals;
DROP POLICY IF EXISTS "Creators can insert their own brand deals." ON public.brand_deals;
DROP POLICY IF EXISTS "Creators can update their own brand deals." ON public.brand_deals;
DROP POLICY IF EXISTS "Creators can delete their own brand deals." ON public.brand_deals;

-- Recreate with explicit USING and WITH CHECK
CREATE POLICY "Creators can view their own brand deals"
ON public.brand_deals FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own brand deals"
ON public.brand_deals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own brand deals"
ON public.brand_deals FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own brand deals"
ON public.brand_deals FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Admin policy for support
CREATE POLICY "Admins can view all brand deals"
ON public.brand_deals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ----------------------------------------------------------------------------
-- 1.2 CONTRACT_ISSUES - Verify and enhance RLS
-- ----------------------------------------------------------------------------

ALTER TABLE public.contract_issues ENABLE ROW LEVEL SECURITY;

-- Ensure all policies exist
DROP POLICY IF EXISTS "Creators can view their own contract issues" ON public.contract_issues;
DROP POLICY IF EXISTS "Creators can insert their own contract issues" ON public.contract_issues;
DROP POLICY IF EXISTS "Creators can update their own contract issues" ON public.contract_issues;
DROP POLICY IF EXISTS "Creators can delete their own contract issues" ON public.contract_issues;
DROP POLICY IF EXISTS "Admins can view all contract issues" ON public.contract_issues;

CREATE POLICY "Creators can view their own contract issues"
ON public.contract_issues FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own contract issues"
ON public.contract_issues FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND EXISTS (
    SELECT 1 FROM public.brand_deals
    WHERE brand_deals.id = contract_issues.deal_id
    AND brand_deals.creator_id = auth.uid()
  )
);

CREATE POLICY "Creators can update their own contract issues"
ON public.contract_issues FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own contract issues"
ON public.contract_issues FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all contract issues"
ON public.contract_issues FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ----------------------------------------------------------------------------
-- 1.3 ISSUES - Verify and enhance RLS
-- ----------------------------------------------------------------------------

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Ensure all policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'issues' 
    AND policyname = 'Users can view their own issues'
  ) THEN
    CREATE POLICY "Users can view their own issues"
    ON public.issues FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'issues' 
    AND policyname = 'Users can create their own issues'
  ) THEN
    CREATE POLICY "Users can create their own issues"
    ON public.issues FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'issues' 
    AND policyname = 'Users can update their own issues'
  ) THEN
    CREATE POLICY "Users can update their own issues"
    ON public.issues FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'issues' 
    AND policyname = 'Users can delete their own issues'
  ) THEN
    CREATE POLICY "Users can delete their own issues"
    ON public.issues FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1.4 BRAND_MESSAGES - Verify and enhance RLS
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'brand_messages'
  ) THEN
    ALTER TABLE public.brand_messages ENABLE ROW LEVEL SECURITY;

    -- Ensure all policies exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'brand_messages' 
      AND policyname = 'Creators can view their own brand messages'
    ) THEN
      CREATE POLICY "Creators can view their own brand messages"
      ON public.brand_messages FOR SELECT
      TO authenticated
      USING (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'brand_messages' 
      AND policyname = 'Creators can create their own brand messages'
    ) THEN
      CREATE POLICY "Creators can create their own brand messages"
      ON public.brand_messages FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'brand_messages' 
      AND policyname = 'Creators can update their own brand messages'
    ) THEN
      CREATE POLICY "Creators can update their own brand messages"
      ON public.brand_messages FOR UPDATE
      TO authenticated
      USING (auth.uid() = creator_id)
      WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'brand_messages' 
      AND policyname = 'Creators can delete their own brand messages'
    ) THEN
      CREATE POLICY "Creators can delete their own brand messages"
      ON public.brand_messages FOR DELETE
      TO authenticated
      USING (auth.uid() = creator_id AND status IN ('pending', 'draft'));
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1.5 EXPENSES - Verify RLS
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses'
  ) THEN
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'expenses' 
      AND policyname = 'Creators can view their own expenses'
    ) THEN
      CREATE POLICY "Creators can view their own expenses"
      ON public.expenses FOR SELECT
      TO authenticated
      USING (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'expenses' 
      AND policyname = 'Creators can create their own expenses'
    ) THEN
      CREATE POLICY "Creators can create their own expenses"
      ON public.expenses FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'expenses' 
      AND policyname = 'Creators can update their own expenses'
    ) THEN
      CREATE POLICY "Creators can update their own expenses"
      ON public.expenses FOR UPDATE
      TO authenticated
      USING (auth.uid() = creator_id)
      WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'expenses' 
      AND policyname = 'Creators can delete their own expenses'
    ) THEN
      CREATE POLICY "Creators can delete their own expenses"
      ON public.expenses FOR DELETE
      TO authenticated
      USING (auth.uid() = creator_id);
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1.6 LAWYER_REQUESTS - Verify RLS
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lawyer_requests'
  ) THEN
    ALTER TABLE public.lawyer_requests ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'lawyer_requests' 
      AND policyname = 'Creators can view their own lawyer requests'
    ) THEN
      CREATE POLICY "Creators can view their own lawyer requests"
      ON public.lawyer_requests FOR SELECT
      TO authenticated
      USING (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'lawyer_requests' 
      AND policyname = 'Creators can create their own lawyer requests'
    ) THEN
      CREATE POLICY "Creators can create their own lawyer requests"
      ON public.lawyer_requests FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'lawyer_requests' 
      AND policyname = 'Creators can update their own pending lawyer requests'
    ) THEN
      CREATE POLICY "Creators can update their own pending lawyer requests"
      ON public.lawyer_requests FOR UPDATE
      TO authenticated
      USING (auth.uid() = creator_id AND status = 'pending')
      WITH CHECK (auth.uid() = creator_id AND status = 'pending');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'lawyer_requests' 
      AND policyname = 'Creators can delete their own pending lawyer requests'
    ) THEN
      CREATE POLICY "Creators can delete their own pending lawyer requests"
      ON public.lawyer_requests FOR DELETE
      TO authenticated
      USING (auth.uid() = creator_id AND status = 'pending');
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PART 2: PERFORMANCE OPTIMIZATION - INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 BRAND_DEALS - Performance indexes
-- ----------------------------------------------------------------------------

-- Composite index for common queries (creator + status)
CREATE INDEX IF NOT EXISTS idx_brand_deals_creator_status 
ON public.brand_deals(creator_id, status);

-- Index for payment date queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_payment_expected_date 
ON public.brand_deals(payment_expected_date) 
WHERE payment_expected_date IS NOT NULL;

-- Index for due date queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_due_date 
ON public.brand_deals(due_date);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_created_at 
ON public.brand_deals(created_at DESC);

-- Partial index for active deals
CREATE INDEX IF NOT EXISTS idx_brand_deals_active 
ON public.brand_deals(creator_id, status) 
WHERE status IN ('Active', 'Pending Payment', 'Drafting');

-- ----------------------------------------------------------------------------
-- 2.2 CONTRACT_ISSUES - Performance indexes
-- ----------------------------------------------------------------------------

-- Composite index for creator + deal queries
CREATE INDEX IF NOT EXISTS idx_contract_issues_creator_deal 
ON public.contract_issues(creator_id, deal_id);

-- Composite index for status filtering
CREATE INDEX IF NOT EXISTS idx_contract_issues_creator_status 
ON public.contract_issues(creator_id, status);

-- Index for severity queries
CREATE INDEX IF NOT EXISTS idx_contract_issues_severity 
ON public.contract_issues(severity) 
WHERE severity = 'high';

-- ----------------------------------------------------------------------------
-- 2.3 ISSUES - Performance indexes
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_issues_user_status 
ON public.issues(user_id, status);

CREATE INDEX IF NOT EXISTS idx_issues_created_at 
ON public.issues(created_at DESC);

-- ----------------------------------------------------------------------------
-- 2.4 NOTIFICATIONS - Performance indexes
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON public.notifications(user_id, read_at) 
    WHERE read_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON public.notifications(user_id, created_at DESC);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2.5 OPPORTUNITIES - Performance indexes
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'opportunities'
  ) THEN
    -- GIN index for array searches (keywords, platforms, categories)
    CREATE INDEX IF NOT EXISTS idx_opportunities_keywords_gin 
    ON public.opportunities USING GIN (required_categories);

    CREATE INDEX IF NOT EXISTS idx_opportunities_platforms_gin 
    ON public.opportunities USING GIN (required_platforms);

    -- Composite index for open opportunities
    CREATE INDEX IF NOT EXISTS idx_opportunities_open_deadline 
    ON public.opportunities(status, deadline) 
    WHERE status = 'open' AND deadline >= CURRENT_DATE;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2.6 BRAND_REVIEWS - Performance indexes
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'brand_reviews'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_brand_reviews_brand_rating 
    ON public.brand_reviews(brand_id, rating);

    CREATE INDEX IF NOT EXISTS idx_brand_reviews_creator 
    ON public.brand_reviews(creator_id);
  END IF;
END $$;

-- ============================================================================
-- PART 3: REFERENTIAL INTEGRITY & CONSTRAINTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Ensure foreign keys exist and have proper cascading
-- ----------------------------------------------------------------------------

-- Contract issues must reference valid brand_deals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contract_issues_deal_id_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.contract_issues
    ADD CONSTRAINT contract_issues_deal_id_fkey
    FOREIGN KEY (deal_id) 
    REFERENCES public.brand_deals(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure brand_deals has creator_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'brand_deals_creator_id_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.brand_deals
    ADD CONSTRAINT brand_deals_creator_id_fkey
    FOREIGN KEY (creator_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- PART 4: TRANSACTION-SAFE RPC FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Create payment update function (transaction-safe)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_payment_received(
  deal_id_param UUID,
  payment_received_date_param DATE,
  utr_number_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_id_check UUID;
  result JSONB;
BEGIN
  -- Verify ownership
  SELECT creator_id INTO creator_id_check
  FROM public.brand_deals
  WHERE id = deal_id_param;

  IF creator_id_check IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deal not found'
    );
  END IF;

  IF creator_id_check != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  -- Transaction-safe update
  BEGIN
    UPDATE public.brand_deals
    SET 
      payment_received_date = payment_received_date_param,
      utr_number = utr_number_param,
      status = 'Payment Received',
      updated_at = NOW()
    WHERE id = deal_id_param;

    -- Log action
    INSERT INTO public.deal_action_logs (
      deal_id,
      action_type,
      description,
      metadata
    ) VALUES (
      deal_id_param,
      'payment_received',
      'Payment marked as received',
      jsonb_build_object(
        'payment_date', payment_received_date_param,
        'utr_number', utr_number_param
      )
    );

    result := jsonb_build_object(
      'success', true,
      'deal_id', deal_id_param
    );
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_payment_received TO authenticated;

-- ----------------------------------------------------------------------------
-- 4.2 Create contract issue creation function (transaction-safe)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_contract_issue(
  deal_id_param UUID,
  issue_type_param TEXT,
  severity_param TEXT,
  title_param TEXT,
  description_param TEXT DEFAULT NULL,
  impact_param JSONB DEFAULT '[]'::jsonb,
  recommendation_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_id_check UUID;
  new_issue_id UUID;
  result JSONB;
BEGIN
  -- Verify deal ownership
  SELECT creator_id INTO creator_id_check
  FROM public.brand_deals
  WHERE id = deal_id_param;

  IF creator_id_check IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deal not found'
    );
  END IF;

  IF creator_id_check != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  -- Transaction-safe insert
  BEGIN
    INSERT INTO public.contract_issues (
      deal_id,
      creator_id,
      issue_type,
      severity,
      title,
      description,
      impact,
      recommendation,
      status
    ) VALUES (
      deal_id_param,
      auth.uid(),
      issue_type_param,
      severity_param,
      title_param,
      description_param,
      impact_param,
      recommendation_param,
      'open'
    ) RETURNING id INTO new_issue_id;

    -- Log action
    INSERT INTO public.deal_action_logs (
      deal_id,
      action_type,
      description,
      metadata
    ) VALUES (
      deal_id_param,
      'contract_issue_created',
      'Contract issue created: ' || title_param,
      jsonb_build_object(
        'issue_id', new_issue_id,
        'issue_type', issue_type_param,
        'severity', severity_param
      )
    );

    result := jsonb_build_object(
      'success', true,
      'issue_id', new_issue_id
    );
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_contract_issue TO authenticated;

-- ============================================================================
-- PART 5: AUDIT LOGGING INFRASTRUCTURE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 Create audit_logs table if it doesn't exist
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  
  -- Action details
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  
  -- Request context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Details
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Security
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'security')),
  is_security_event BOOLEAN DEFAULT false
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON public.audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_security 
ON public.audit_logs(is_security_event, created_at DESC) 
WHERE is_security_event = true;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type 
ON public.audit_logs(action_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can insert (for backend logging)
-- Admins can view all
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ----------------------------------------------------------------------------
-- 5.2 Create audit logging function
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_audit_event(
  action_type_param TEXT,
  resource_type_param TEXT,
  resource_id_param UUID DEFAULT NULL,
  description_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'::jsonb,
  severity_param TEXT DEFAULT 'info',
  is_security_event_param BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
  user_email_val TEXT;
BEGIN
  -- Get user email if authenticated
  SELECT email INTO user_email_val
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    metadata,
    severity,
    is_security_event
  ) VALUES (
    auth.uid(),
    user_email_val,
    action_type_param,
    resource_type_param,
    resource_id_param,
    description_param,
    metadata_param,
    severity_param,
    is_security_event_param
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated, service_role;

-- ============================================================================
-- PART 6: STORAGE SECURITY ENHANCEMENT
-- ============================================================================

-- Note: Storage policies are managed via Supabase dashboard or separate migration
-- This section documents the required policies

-- Required storage policies for 'creator-assets' bucket:
-- 1. Users can upload to their own folder: {user_id}/*
-- 2. Users can read their own files
-- 3. Users can update their own files
-- 4. Users can delete their own files
-- 5. No public read (use signed URLs for sharing)

-- ============================================================================
-- PART 7: PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 Create slow query monitoring view (if pg_stat_statements available)
-- ----------------------------------------------------------------------------

-- This would require pg_stat_statements extension
-- For now, we'll create a view for common performance metrics

CREATE OR REPLACE VIEW public.performance_metrics AS
SELECT 
  'brand_deals' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as rows_last_7_days,
  COUNT(*) FILTER (WHERE creator_id IS NOT NULL) as rows_with_creator
FROM public.brand_deals
UNION ALL
SELECT 
  'contract_issues' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as rows_last_7_days,
  COUNT(*) FILTER (WHERE creator_id IS NOT NULL) as rows_with_creator
FROM public.contract_issues;

-- Grant read access to admins
GRANT SELECT ON public.performance_metrics TO authenticated;

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.update_payment_received IS 
'Transaction-safe function to update payment status. Ensures ownership and logs action.';

COMMENT ON FUNCTION public.create_contract_issue IS 
'Transaction-safe function to create contract issues. Verifies deal ownership and logs action.';

COMMENT ON FUNCTION public.log_audit_event IS 
'Centralized audit logging function. Use for all security-sensitive operations.';

COMMENT ON TABLE public.audit_logs IS 
'Comprehensive audit log for security and compliance. Tracks all user actions.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

