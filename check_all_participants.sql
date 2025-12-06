-- Check ALL participants to see what user_id values are actually stored
-- This will help us understand if there's a mismatch

-- 1. Check all participants (no filter)
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  p.first_name || ' ' || p.last_name as participant_name,
  p.role as profile_role,
  p.id as profile_id
FROM public.conversation_participants cp
LEFT JOIN public.profiles p ON p.id = cp.user_id
ORDER BY cp.conversation_id;

-- 2. Check what auth.uid() returns vs what's in participant records
SELECT 
  auth.uid() as current_auth_uid,
  'Current authenticated user ID' as description;

-- 3. Check if there are participants with user_id matching the lawyer's profile ID
-- The lawyer's profile ID is: 27239566-f735-4423-a898-8dbaee1ec77f
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  CASE 
    WHEN cp.user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid THEN 'MATCHES LAWYER PROFILE ID'
    WHEN cp.user_id = auth.uid() THEN 'MATCHES AUTH.UID()'
    ELSE 'NO MATCH'
  END as match_status
FROM public.conversation_participants cp
WHERE cp.user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid
   OR cp.user_id = auth.uid();

-- 4. Check all conversations to see what exists
SELECT 
  c.id,
  c.title,
  c.type,
  c.created_at
FROM public.conversations c
ORDER BY c.created_at DESC
LIMIT 20;

