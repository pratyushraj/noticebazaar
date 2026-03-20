-- ============================================================================
-- QUICK FIX: Run this in Supabase SQL Editor to fix infinite recursion
-- ============================================================================
-- Copy and paste this entire file into Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS participants_select_own ON public.conversation_participants;

-- Step 2: Create the SECURITY DEFINER function (bypasses RLS to avoid recursion)
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

-- Step 3: Recreate the policy using the function (no more recursion!)
CREATE POLICY participants_select_own
  ON public.conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_conversation_participant(conversation_id, auth.uid())
  );

-- ============================================================================
-- ✅ DONE! Refresh your Lawyer Dashboard and the error should be gone.
-- ============================================================================

