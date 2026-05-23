-- Fix conversation participants to include the correct lawyer user ID
-- This migration updates existing conversations to ensure the lawyer (27239566-f735-4423-a898-8dbaee1ec77f)
-- is added as a participant if they should have access

-- First, let's see what conversations exist and their participants
-- Then we'll add the lawyer as a participant to conversations where they should be

-- Add lawyer user to conversations where advisor ID 2195d667-81cc-4d73-bfe3-c55e0e529664 is a participant
-- This assumes the advisor profile ID should map to the lawyer auth user ID
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

-- Also, update any existing participants with the old advisor ID to use the lawyer ID
-- This is a more aggressive fix - use with caution
-- UPDATE public.conversation_participants
-- SET user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid
-- WHERE user_id = '2195d667-81cc-4d73-bfe3-c55e0e529664'::uuid
--   AND role = 'advisor';

