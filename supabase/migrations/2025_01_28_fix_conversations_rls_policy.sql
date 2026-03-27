-- Fix RLS policy for conversations table to work correctly with participant checks
-- The issue is that the policy might not be evaluating correctly with .in() queries

-- Drop existing SELECT policy
DROP POLICY IF EXISTS conversations_select_participants_only ON public.conversations;
DROP POLICY IF EXISTS conversations_select_admin ON public.conversations;

-- Recreate SELECT policy with explicit check
-- This policy allows users to see conversations where they are participants
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

-- Admin policy (unchanged)
CREATE POLICY conversations_select_admin
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Verify the policy was created
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

