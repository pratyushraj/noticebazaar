-- ============================================================================
-- DOWN MIGRATION: Backend Ultra Polish Rollback
-- Date: 2025-01-27
-- ============================================================================
-- This migration reverses the changes made in 2025_01_27_backend_ultra_polish.sql
-- Use with caution - only rollback if necessary
-- ============================================================================

-- ============================================================================
-- PART 1: REMOVE AUDIT LOGGING INFRASTRUCTURE
-- ============================================================================

-- Drop audit_logs policies
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

-- Drop audit_logs indexes
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_security;
DROP INDEX IF EXISTS idx_audit_logs_action_type;

-- Drop audit_logs table (if it was created by this migration)
-- Note: Only drop if you're sure it was created by this migration
-- DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Drop audit logging function
DROP FUNCTION IF EXISTS public.log_audit_event;

-- ============================================================================
-- PART 2: REMOVE TRANSACTION-SAFE FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_payment_received;
DROP FUNCTION IF EXISTS public.create_contract_issue;

-- ============================================================================
-- PART 3: REMOVE PERFORMANCE INDEXES
-- ============================================================================

-- Brand Deals indexes
DROP INDEX IF EXISTS idx_brand_deals_creator_status;
DROP INDEX IF EXISTS idx_brand_deals_payment_expected_date;
DROP INDEX IF EXISTS idx_brand_deals_due_date;
DROP INDEX IF EXISTS idx_brand_deals_created_at;
DROP INDEX IF EXISTS idx_brand_deals_active;

-- Contract Issues indexes
DROP INDEX IF EXISTS idx_contract_issues_creator_deal;
DROP INDEX IF EXISTS idx_contract_issues_creator_status;
DROP INDEX IF EXISTS idx_contract_issues_severity;

-- Issues indexes (if table exists)
DROP INDEX IF EXISTS idx_issues_user_status;
DROP INDEX IF EXISTS idx_issues_created_at;

-- Notifications indexes
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_notifications_user_created;

-- Opportunities indexes
DROP INDEX IF EXISTS idx_opportunities_keywords_gin;
DROP INDEX IF EXISTS idx_opportunities_platforms_gin;
DROP INDEX IF EXISTS idx_opportunities_open_deadline;

-- Brand Reviews indexes
DROP INDEX IF EXISTS idx_brand_reviews_brand_rating;

-- Payments indexes
DROP INDEX IF EXISTS idx_payments_brand_deal_id_status;
DROP INDEX IF EXISTS idx_payments_payment_status;
DROP INDEX IF EXISTS idx_payments_expected_date;

-- Messages indexes
DROP INDEX IF EXISTS idx_messages_conversation_id_created_at;
DROP INDEX IF EXISTS idx_messages_sender_created_at;

-- ============================================================================
-- PART 4: REVERT RLS POLICIES
-- ============================================================================
-- Note: This section drops the enhanced policies created by the migration
-- The original policies (if they existed) are not restored here
-- You may need to manually recreate original policies if needed

DO $$
BEGIN
  -- Brand Deals policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_deals') THEN
    DROP POLICY IF EXISTS "Creators can view their own brand deals" ON public.brand_deals;
    DROP POLICY IF EXISTS "Creators can insert their own brand deals" ON public.brand_deals;
    DROP POLICY IF EXISTS "Creators can update their own brand deals" ON public.brand_deals;
    DROP POLICY IF EXISTS "Creators can delete their own brand deals" ON public.brand_deals;
    DROP POLICY IF EXISTS "Admins can view all brand deals" ON public.brand_deals;
  END IF;

  -- Contract Issues policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contract_issues') THEN
    DROP POLICY IF EXISTS "Creators can view their own contract issues" ON public.contract_issues;
    DROP POLICY IF EXISTS "Creators can insert their own contract issues" ON public.contract_issues;
    DROP POLICY IF EXISTS "Creators can update their own contract issues" ON public.contract_issues;
    DROP POLICY IF EXISTS "Creators can delete their own contract issues" ON public.contract_issues;
    DROP POLICY IF EXISTS "Admins can view all contract issues" ON public.contract_issues;
  END IF;

  -- Issues policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'issues') THEN
    DROP POLICY IF EXISTS "Users can view their own issues" ON public.issues;
    DROP POLICY IF EXISTS "Users can create their own issues" ON public.issues;
    DROP POLICY IF EXISTS "Users can update their own issues" ON public.issues;
    DROP POLICY IF EXISTS "Users can delete their own issues" ON public.issues;
  END IF;

  -- Payments policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    DROP POLICY IF EXISTS "Creators can view their own payments" ON public.payments;
    DROP POLICY IF EXISTS "Creators can insert their own payments" ON public.payments;
    DROP POLICY IF EXISTS "Creators can update their own payments" ON public.payments;
    DROP POLICY IF EXISTS "Creators can delete their own payments" ON public.payments;
    DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
  END IF;

  -- Messages policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
    DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
  END IF;

  -- Opportunities policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'opportunities') THEN
    DROP POLICY IF EXISTS "Authenticated users can view opportunities" ON public.opportunities;
  END IF;

  -- Notifications policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
  END IF;

  -- Expenses policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
    DROP POLICY IF EXISTS "Creators can view their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Creators can create their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Creators can update their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Creators can delete their own expenses" ON public.expenses;
  END IF;

  -- Lawyer Requests policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lawyer_requests') THEN
    DROP POLICY IF EXISTS "Creators can view their own lawyer requests" ON public.lawyer_requests;
    DROP POLICY IF EXISTS "Creators can create their own lawyer requests" ON public.lawyer_requests;
    DROP POLICY IF EXISTS "Creators can update their own pending lawyer requests" ON public.lawyer_requests;
    DROP POLICY IF EXISTS "Creators can delete their own pending lawyer requests" ON public.lawyer_requests;
  END IF;

  -- Brand Messages policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_messages') THEN
    DROP POLICY IF EXISTS "Creators can view their own brand messages" ON public.brand_messages;
    DROP POLICY IF EXISTS "Creators can send brand messages" ON public.brand_messages;
  END IF;
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This down-migration removes all policies, indexes, and functions created
--    by the ultra polish migration
-- 2. Original policies (if they existed before) are NOT restored
-- 3. You may need to manually recreate original policies if needed
-- 4. The audit_logs table is NOT dropped by default (commented out)
--    Uncomment if you're sure it was created by this migration
-- 5. Always test this rollback on a staging environment first
-- 6. Consider taking a database backup before running this migration

-- ============================================================================
-- VERIFICATION QUERIES (Run after rollback to verify)
-- ============================================================================

-- Check if functions were removed
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('update_payment_received', 'create_contract_issue', 'log_audit_event');
-- Should return: 0 rows

-- Check if indexes were removed
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%';
-- Should show fewer indexes

-- Check if policies were removed
-- SELECT policyname FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('brand_deals', 'contract_issues', 'payments', 'messages');
-- Should show fewer policies

