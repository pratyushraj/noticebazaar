-- Update notice@yopmail.com to creator role
-- Run this in Supabase SQL Editor

-- First, verify the user exists and check current role
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.onboarding_complete,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'notice@yopmail.com';

-- Update or create profile with creator role
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
WHERE u.email = 'notice@yopmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'creator',
  updated_at = NOW();

-- Verify the update
SELECT 
  p.id,
  p.role,
  p.onboarding_complete,
  p.first_name,
  p.last_name,
  u.email,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.email = 'notice@yopmail.com';

