-- Test if the conversation exists and if RLS allows access
-- Run this in Supabase SQL Editor

-- 1. Check if conversation exists (bypassing RLS by checking directly)
SELECT 
  c.id,
  c.title,
  c.type,
  c.created_at
FROM public.conversations c
WHERE c.id = '61761ee7-e2d6-42be-b3ce-e990a14be241'::uuid;

-- 2. Check if the participant record matches auth.uid()
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  auth.uid() as current_auth_uid,
  (cp.user_id = auth.uid()) as matches,
  CASE 
    WHEN cp.user_id = auth.uid() THEN 'MATCH - RLS should allow'
    ELSE 'NO MATCH - RLS will block'
  END as rls_status
FROM public.conversation_participants cp
WHERE cp.conversation_id = '61761ee7-e2d6-42be-b3ce-e990a14be241'::uuid
  AND cp.user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid;

-- 3. Test the RLS policy logic directly
SELECT 
  c.id,
  c.title,
  EXISTS (
    SELECT 1 
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = c.id
      AND cp.user_id = auth.uid()
  ) as rls_check_result
FROM public.conversations c
WHERE c.id = '61761ee7-e2d6-42be-b3ce-e990a14be241'::uuid;

