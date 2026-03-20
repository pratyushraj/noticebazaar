-- Check what conversations and participants actually exist

-- 1. Check all conversations
SELECT 
  id,
  title,
  type,
  risk_tag,
  created_at,
  updated_at
FROM public.conversations
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check all conversation participants
SELECT 
  conversation_id,
  user_id,
  role
FROM public.conversation_participants
LIMIT 20;

-- 3. Check specific conversation (the one we know exists: 61761ee7-e2d6-42be-b3ce-e990a14be241)
SELECT 
  c.id as conversation_id,
  c.title,
  cp.user_id,
  cp.role,
  p.first_name || ' ' || p.last_name as name,
  p.role as profile_role
FROM public.conversations c
LEFT JOIN public.conversation_participants cp ON cp.conversation_id = c.id
LEFT JOIN public.profiles p ON p.id = cp.user_id
WHERE c.id = '61761ee7-e2d6-42be-b3ce-e990a14be241'::uuid;

-- 4. Check if lawyer user exists in profiles
SELECT 
  id,
  first_name,
  last_name,
  role
FROM public.profiles
WHERE id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid;

-- 5. Check if advisor user exists in profiles
SELECT 
  id,
  first_name,
  last_name,
  role
FROM public.profiles
WHERE id = '2195d667-81cc-4d73-bfe3-c55e0e529664'::uuid;

