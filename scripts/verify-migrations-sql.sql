-- Quick Migration Verification SQL
-- Run this in Supabase Dashboard → SQL Editor to check which columns exist

-- Check for creator_category and related fields
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('creator_category', 'pricing_min', 'pricing_avg', 'pricing_max', 
                         'bank_account_name', 'bank_account_number', 'bank_ifsc', 'bank_upi',
                         'gst_number', 'pan_number', 'referral_code',
                         'instagram_followers', 'youtube_subs', 'tiktok_followers', 
                         'twitter_followers', 'facebook_followers') 
    THEN 'creator_profile (2025_11_21)'
    WHEN column_name IN ('is_trial', 'trial_started_at', 'trial_expires_at', 'trial_locked')
    THEN 'trial (2025_11_20)'
    WHEN column_name IN ('phone', 'location', 'bio', 'platforms', 'goals')
    THEN 'profile_fields (2025_11_26)'
    ELSE 'other'
  END as migration_source
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    -- Creator profile fields
    'creator_category', 'pricing_min', 'pricing_avg', 'pricing_max',
    'bank_account_name', 'bank_account_number', 'bank_ifsc', 'bank_upi',
    'gst_number', 'pan_number', 'referral_code',
    'instagram_followers', 'youtube_subs', 'tiktok_followers',
    'twitter_followers', 'facebook_followers',
    -- Trial fields
    'is_trial', 'trial_started_at', 'trial_expires_at', 'trial_locked',
    -- Profile fields
    'phone', 'location', 'bio', 'platforms', 'goals'
  )
ORDER BY migration_source, column_name;

-- If the above returns no rows, the migrations haven't been run yet.
-- Expected result: Should return all columns listed above if migrations are applied.

