-- Debug script to check conversation RLS and participant data
-- Run this in Supabase SQL Editor while logged in as the lawyer user

-- 1. Check what auth.uid() returns
SELECT 
  auth.uid() as current_auth_uid,
  auth.role() as current_auth_role;

-- 2. Check participant records for the lawyer
SELECT 
  cp.conversation_id,
  cp.user_id as participant_user_id,
  cp.role,
  auth.uid() as current_auth_uid,
  (cp.user_id = auth.uid()) as user_id_matches_auth_uid
FROM public.conversation_participants cp
WHERE cp.user_id = auth.uid();

-- 3. Check if conversations exist for these conversation_ids
SELECT 
  c.id,
  c.title,
  c.type,
  c.created_at,
  -- Check if RLS allows access
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = c.id
      AND cp.user_id = auth.uid()
  ) as rls_check_passes
FROM public.conversations c
WHERE c.id IN (
  SELECT conversation_id 
  FROM public.conversation_participants 
  WHERE user_id = auth.uid()
);

-- 4. Try to manually check the RLS policy logic
-- This simulates what the RLS policy does
SELECT 
  c.id,
  c.title,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id
        AND cp.user_id = auth.uid()
    ) THEN 'ALLOWED'
    ELSE 'BLOCKED'
  END as rls_result
FROM public.conversations c
WHERE c.id IN (
  SELECT conversation_id 
  FROM public.conversation_participants 
  WHERE user_id = auth.uid()
);

-- 5. Check all participants for the conversation (to see who's in it)
SELECT 
  c.id as conversation_id,
  c.title,
  cp.user_id,
  cp.role,
  p.first_name || ' ' || p.last_name as participant_name,
  p.role as profile_role
FROM public.conversations c
JOIN public.conversation_participants cp ON cp.conversation_id = c.id
LEFT JOIN public.profiles p ON p.id = cp.user_id
WHERE c.id IN (
  SELECT conversation_id 
  FROM public.conversation_participants 
  WHERE user_id = auth.uid()
);

