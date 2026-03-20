-- Fix conversation participants for lawyer dashboard
-- This script adds the lawyer user (27239566-f735-4423-a898-8dbaee1ec77f) 
-- to conversations where they should have access

-- Option 1: Add lawyer to all conversations where advisor 2195d667-81cc-4d73-bfe3-c55e0e529664 is a participant
-- This assumes the advisor and lawyer are the same person with different IDs
INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT DISTINCT
  cp.conversation_id,
  '27239566-f735-4423-a898-8dbaee1ec77f'::uuid,
  'advisor'
FROM public.conversation_participants cp
WHERE cp.user_id = '2195d667-81cc-4d73-bfe3-c55e0e529664'::uuid
  AND cp.role = 'advisor'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.conversation_participants cp2 
    WHERE cp2.conversation_id = cp.conversation_id 
      AND cp2.user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid
  )
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Option 2: Replace the old advisor ID with the lawyer ID (more aggressive)
-- Uncomment this if you want to replace the advisor ID entirely
-- UPDATE public.conversation_participants
-- SET user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid
-- WHERE user_id = '2195d667-81cc-4d73-bfe3-c55e0e529664'::uuid
--   AND role = 'advisor';

-- Verify the fix
SELECT 
  c.id as conversation_id,
  c.title,
  cp.user_id,
  cp.role,
  p.first_name || ' ' || p.last_name as name
FROM public.conversations c
JOIN public.conversation_participants cp ON cp.conversation_id = c.id
LEFT JOIN public.profiles p ON p.id = cp.user_id
WHERE cp.user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid
ORDER BY c.updated_at DESC;

