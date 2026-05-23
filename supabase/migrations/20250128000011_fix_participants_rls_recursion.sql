-- ============================================================================
-- FIX: Infinite Recursion in conversation_participants RLS Policy
-- ============================================================================
-- The participants_select_own policy was querying conversation_participants
-- within its own USING clause, causing infinite recursion.
--
-- Solution: Use a SECURITY DEFINER function to check participation without RLS
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS participants_select_own ON public.conversation_participants;

-- Create a function that checks if user is a participant (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
  );
$$;

-- Create the fixed policy using the function
CREATE POLICY participants_select_own
  ON public.conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_conversation_participant(conversation_id, auth.uid())
  );

