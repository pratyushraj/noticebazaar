-- Update Prateek's profile to set first_name and last_name
-- User ID: 27239566-f735-4423-a898-8dbaee1ec77f
-- Run this in Supabase SQL Editor

-- Step 1: Verify current profile
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  u.email,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = '27239566-f735-4423-a898-8dbaee1ec77f';

-- Step 2: Update profile with Prateek's name
UPDATE public.profiles
SET 
  first_name = 'Prateek',
  last_name = '',
  updated_at = NOW()
WHERE id = '27239566-f735-4423-a898-8dbaee1ec77f';

-- Step 3: Verify the update
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  u.email,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = '27239566-f735-4423-a898-8dbaee1ec77f';

-- Expected result:
-- first_name: 'Prateek'
-- last_name: '' (empty string)
-- role: 'admin' (or whatever role they have)

