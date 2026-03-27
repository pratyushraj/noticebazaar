-- Test RLS for lawyer user
-- This will show what auth.uid() returns and test the RLS policy

-- First, check what the current auth user is (when logged in as lawyer)
-- Note: This will only work if you're logged in as the lawyer in the Supabase dashboard
SELECT 
  auth.uid() as current_auth_user,
  '27239566-f735-4423-a898-8dbaee1ec77f'::uuid as expected_lawyer_id,
  (auth.uid() = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid) as matches;

-- Test the RLS policy by querying as if we're the lawyer
-- This simulates what the client-side query does
SELECT 
  conversation_id,
  user_id,
  role,
  (user_id = auth.uid()) as user_id_matches_auth_uid
FROM public.conversation_participants
WHERE user_id = '27239566-f735-4423-a898-8dbaee1ec77f'::uuid;

-- Also check if the is_conversation_participant function works
SELECT 
  public.is_conversation_participant(
    '61761ee7-e2d6-42be-b3ce-e990a14be241'::uuid,
    '27239566-f735-4423-a898-8dbaee1ec77f'::uuid
  ) as is_participant;

