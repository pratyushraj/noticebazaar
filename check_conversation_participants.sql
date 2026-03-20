-- Check who is in the conversation
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

