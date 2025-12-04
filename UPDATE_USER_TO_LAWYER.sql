-- Update user profile to lawyer role
-- User ID: 27239566-f735-4423-a898-8dbaee1ec77f
-- Run this in Supabase SQL Editor

-- Update existing profile or create if doesn't exist
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  role,
  onboarding_complete,
  created_at,
  updated_at
)
VALUES (
  '27239566-f735-4423-a898-8dbaee1ec77f',
  'Legal',
  'Advisor',
  'lawyer',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  first_name = 'Legal',
  last_name = 'Advisor',
  role = 'lawyer',
  onboarding_complete = true,
  updated_at = NOW();

-- Verify the update
SELECT 
  id,
  first_name,
  last_name,
  role,
  onboarding_complete,
  created_at,
  updated_at
FROM profiles
WHERE id = '27239566-f735-4423-a898-8dbaee1ec77f';

-- Also check the auth user email
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '27239566-f735-4423-a898-8dbaee1ec77f';

