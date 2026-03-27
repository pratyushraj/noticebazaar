-- Check if the conversation actually exists
-- Run this in Supabase SQL Editor

-- 1. First, check what conversation_id the participant has
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  auth.uid() as current_auth_uid
FROM public.conversation_participants cp
WHERE cp.user_id = auth.uid();

-- 2. Check if that conversation exists in the conversations table
SELECT 
  c.id,
  c.title,
  c.type,
  c.created_at,
  c.updated_at
FROM public.conversations c
WHERE c.id IN (
  SELECT conversation_id 
  FROM public.conversation_participants 
  WHERE user_id = auth.uid()
);

-- 3. Check ALL conversations (without RLS, using postgres role if possible)
-- This will show if conversations exist but RLS is blocking
SELECT 
  c.id,
  c.title,
  c.type,
  c.created_at
FROM public.conversations c
ORDER BY c.created_at DESC
LIMIT 10;

-- 4. Check ALL participants to see the full picture
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  p.first_name || ' ' || p.last_name as participant_name
FROM public.conversation_participants cp
LEFT JOIN public.profiles p ON p.id = cp.user_id
ORDER BY cp.conversation_id;

-- 5. Find orphaned participant records (participants without conversations)
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  CASE 
    WHEN c.id IS NULL THEN 'ORPHANED - Conversation does not exist'
    ELSE 'OK'
  END as status
FROM public.conversation_participants cp
LEFT JOIN public.conversations c ON c.id = cp.conversation_id
WHERE cp.user_id = auth.uid();

