-- SQL Script to Fix User Dashboard Redirect
-- Run this in Supabase SQL Editor
-- 
-- This updates the user profile to have 'creator' role and onboarding_complete = true
-- User ID: 3f5a1cb5-cbd1-4dff-aa39-66a4d1fbd17b
-- Email: bombboy474@gmail.com

-- Step 1: Check current profile
SELECT 
  id, 
  role, 
  onboarding_complete, 
  first_name, 
  last_name,
  email
FROM profiles 
WHERE id = '3f5a1cb5-cbd1-4dff-aa39-66a4d1fbd17b';

-- Step 2: Update profile to creator role and set onboarding_complete
UPDATE profiles 
SET 
  role = 'creator',
  onboarding_complete = true,
  updated_at = NOW()
WHERE id = '3f5a1cb5-cbd1-4dff-aa39-66a4d1fbd17b';

-- Step 3: Verify the update
SELECT 
  id, 
  role, 
  onboarding_complete, 
  updated_at
FROM profiles 
WHERE id = '3f5a1cb5-cbd1-4dff-aa39-66a4d1fbd17b';

