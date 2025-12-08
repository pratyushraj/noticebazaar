-- Update Prateek's profile to set first_name and last_name
-- User ID: 27239566-f735-4423-a898-8dbaee1ec77f
-- Run this in Supabase SQL Editor

-- Step 1: Verify current profile
SELECT 
  id,
  first_name,
  last_name,
  role,
  email,
  created_at,
  updated_at
FROM public.profiles
WHERE id = '27239566-f735-4423-a898-8dbaee1ec77f';

-- Step 2: Update profile with Prateek's name
UPDATE public.profiles
SET 
  first_name = 'Prateek',
  last_name = '',
  updated_at = NOW()
WHERE id = '27239566-f735-4423-a898-8dbaee1ec77f';

-- Step 3: Verify the update
SELECT 
  id,
  first_name,
  last_name,
  role,
  email,
  updated_at
FROM public.profiles
WHERE id = '27239566-f735-4423-a898-8dbaee1ec77f';

-- Expected result:
-- first_name: 'Prateek'
-- last_name: '' (empty string)
-- role: 'admin' (or whatever role they have)

