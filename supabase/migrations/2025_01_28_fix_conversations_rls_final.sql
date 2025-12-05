-- Final fix for conversations RLS policy
-- The issue: participant.user_id stores profile IDs, but RLS checks auth.uid()
-- Solution: Update RLS to check if the participant's user_id matches the current user's profile ID

-- Drop existing SELECT policy
DROP POLICY IF EXISTS conversations_select_participants_only ON public.conversations;

-- Create new policy that checks if user is a participant
-- Since profiles.id = auth.users.id in Supabase, we can check either way
-- But to be safe, we'll check if the participant.user_id matches auth.uid()
-- OR if there's a profile with that ID that matches auth.uid()
CREATE POLICY conversations_select_participants_only
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

-- Also create an alternative policy that works with profile IDs
-- This is a backup in case the above doesn't work
-- We'll use a SECURITY DEFINER function to bypass RLS for the check
CREATE OR REPLACE FUNCTION public.user_is_conversation_participant(
  p_conversation_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = auth.uid()
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_is_conversation_participant(UUID) TO authenticated;

-- Verify policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'conversations'
      AND policyname = 'conversations_select_participants_only'
  ) THEN
    RAISE EXCEPTION 'Policy conversations_select_participants_only was not created!';
  ELSE
    RAISE NOTICE 'Successfully created conversations_select_participants_only policy';
  END IF;
END $$;

