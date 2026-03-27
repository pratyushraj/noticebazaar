-- Update sprateek7599@gmail.com to creator role
-- User ID: 2195d667-81cc-4d73-bfe3-c55e0e529664
-- Run this in Supabase SQL Editor

-- Step 1: Verify the user exists and check current role
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.onboarding_complete,
  p.first_name,
  p.last_name,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '2195d667-81cc-4d73-bfe3-c55e0e529664'
   OR u.email = 'sprateek7599@gmail.com';

-- Step 2: Update or create profile with creator role
INSERT INTO public.profiles (
  id,
  role,
  onboarding_complete,
  updated_at,
  created_at
)
SELECT 
  u.id,
  'creator',
  COALESCE(p.onboarding_complete, false),
  NOW(),
  COALESCE(p.created_at, NOW())
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '2195d667-81cc-4d73-bfe3-c55e0e529664'
   OR u.email = 'sprateek7599@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'creator',
  onboarding_complete = COALESCE(profiles.onboarding_complete, false),
  updated_at = NOW();

-- Step 3: Verify the update
SELECT 
  p.id,
  p.role,
  p.onboarding_complete,
  p.first_name,
  p.last_name,
  u.email,
  u.email_confirmed_at,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = '2195d667-81cc-4d73-bfe3-c55e0e529664'
   OR u.email = 'sprateek7599@gmail.com';

