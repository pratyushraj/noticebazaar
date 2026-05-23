-- ================================================
-- Migration Verification Script
-- ================================================
-- Run this script after applying migrations to verify
-- that all tables, indexes, policies, and functions exist
-- ================================================

-- ================================================
-- 1. CHECK TABLES EXIST
-- ================================================
SELECT 
  'Tables Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones', 'partner_rewards', 'referral_events', 'notification_preferences')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones', 'partner_rewards', 'referral_events', 'notification_preferences')
ORDER BY table_name;

-- ================================================
-- 2. CHECK RLS IS ENABLED
-- ================================================
SELECT 
  'RLS Check' as check_type,
  tablename as table_name,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones', 'partner_rewards', 'referral_events', 'notification_preferences')
ORDER BY tablename;

-- ================================================
-- 3. CHECK INDEXES EXIST
-- ================================================
SELECT 
  'Indexes Check' as check_type,
  tablename,
  indexname,
  '✅ EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones', 'partner_rewards', 'referral_events', 'notification_preferences')
ORDER BY tablename, indexname;

-- ================================================
-- 4. CHECK FUNCTIONS EXIST
-- ================================================
SELECT 
  'Functions Check' as check_type,
  routine_name as function_name,
  '✅ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    -- Notifications functions
    'mark_notification_read',
    'mark_all_notifications_read',
    'get_unread_notification_count',
    'handle_new_user_notification_preferences',
    -- Partner program functions
    'get_or_create_referral_link',
    'initialize_partner_stats',
    'refresh_partner_stats',
    'refresh_partner_stats_complete',
    'record_referral_commission',
    'issue_voucher_reward',
    'check_and_award_milestones',
    'add_free_month_credit',
    'calculate_commission',
    'update_partner_tier',
    'apply_tds',
    'activate_referral',
    'track_referral_event',
    'update_partner_ranks',
    'get_total_partners'
  )
ORDER BY routine_name;

-- ================================================
-- 5. CHECK PARTNER_STATS COLUMNS (including enhancements)
-- ================================================
SELECT 
  'Partner Stats Columns' as check_type,
  column_name,
  data_type,
  '✅ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'partner_stats'
  AND column_name IN (
    'user_id',
    'total_referrals',
    'active_referrals',
    'total_earnings',
    'tier',
    'next_payout_date',
    'free_months_credit',
    'updated_at',
    -- Enhanced columns
    'total_clicks',
    'total_signups',
    'total_paid_users',
    'current_month_earnings',
    'partner_rank',
    'next_reward_referrals',
    'created_at'
  )
ORDER BY column_name;

-- ================================================
-- 6. CHECK NOTIFICATIONS COLUMNS
-- ================================================
SELECT 
  'Notifications Columns' as check_type,
  column_name,
  data_type,
  '✅ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
  AND column_name IN (
    'id',
    'user_id',
    'type',
    'category',
    'title',
    'message',
    'data',
    'link',
    'read',
    'read_at',
    'created_at',
    'expires_at',
    'priority',
    'icon',
    'action_label',
    'action_link'
  )
ORDER BY column_name;

-- ================================================
-- 7. SUMMARY
-- ================================================
SELECT 
  'SUMMARY' as check_type,
  'Total Tables' as metric,
  COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones', 'partner_rewards', 'referral_events', 'notification_preferences')

UNION ALL

SELECT 
  'SUMMARY' as check_type,
  'Total Functions' as metric,
  COUNT(*)::text as value
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'mark_notification_read',
    'mark_all_notifications_read',
    'get_unread_notification_count',
    'handle_new_user_notification_preferences',
    'get_or_create_referral_link',
    'initialize_partner_stats',
    'refresh_partner_stats',
    'refresh_partner_stats_complete',
    'record_referral_commission',
    'issue_voucher_reward',
    'check_and_award_milestones',
    'add_free_month_credit',
    'calculate_commission',
    'update_partner_tier',
    'apply_tds',
    'activate_referral',
    'track_referral_event',
    'update_partner_ranks',
    'get_total_partners'
  );

-- ================================================
-- 8. QUICK TEST QUERIES
-- ================================================
-- Uncomment to test:

-- Test notifications table
-- SELECT COUNT(*) as notification_count FROM public.notifications;

-- Test partner_stats table
-- SELECT COUNT(*) as partner_count FROM public.partner_stats;

-- Test functions
-- SELECT get_total_partners() as total_partners;

