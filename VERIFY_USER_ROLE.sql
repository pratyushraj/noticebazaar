-- Verify user exists and check current role
-- Run this in Supabase SQL Editor to check the user's current status

-- First, check if user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'pratyushraj@outlook.com';

-- Then, check the profile
SELECT 
  p.id,
  p.role,
  p.onboarding_complete,
  p.first_name,
  p.last_name,
  p.created_at,
  p.updated_at,
  u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.email = 'pratyushraj@outlook.com';

-- If profile doesn't exist, create it with creator role
INSERT INTO public.profiles (id, role, onboarding_complete, created_at, updated_at)
SELECT 
  u.id,
  'creator',
  false,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'pratyushraj@outlook.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO NOTHING
RETURNING *;

