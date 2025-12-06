-- Check what auth.uid() returns vs what's stored in participant records
-- Run this in Supabase SQL Editor while logged in as the lawyer

-- 1. Check what auth.uid() returns
SELECT 
  auth.uid() as current_auth_uid,
  'This is what auth.uid() returns' as description;

-- 2. Check the participant record for the conversation
SELECT 
  cp.conversation_id,
  cp.user_id as stored_user_id,
  cp.role,
  auth.uid() as current_auth_uid,
  (cp.user_id = auth.uid()) as do_they_match,
  CASE 
    WHEN cp.user_id = auth.uid() THEN 'MATCH - RLS should work'
    ELSE 'MISMATCH - RLS will block'
  END as status
FROM public.conversation_participants cp
WHERE cp.conversation_id = '61761ee7-e2d6-42be-b3ce-e990a14be241'::uuid
  AND cp.user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid;

-- 3. Check if there's a profile with this ID and what its auth user ID is
SELECT 
  p.id as profile_id,
  p.first_name || ' ' || p.last_name as name,
  p.role,
  -- Check if profile.id matches any auth.users.id
  (SELECT id FROM auth.users WHERE id = p.id) as auth_user_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = p.id) THEN 'Profile ID exists in auth.users'
    ELSE 'Profile ID does NOT exist in auth.users'
  END as auth_user_exists
FROM public.profiles p
WHERE p.id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid;

-- 4. Check all auth.users to see what IDs exist
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid;

