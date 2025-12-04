-- Fix: Add INSERT policy for conversations table (V2 - More robust)
-- This ensures the policy is created correctly and handles edge cases

-- First, drop ALL existing policies on conversations to avoid conflicts
DO $$
BEGIN
  -- Drop all existing policies on conversations
  DROP POLICY IF EXISTS conversations_insert_authenticated ON public.conversations;
  DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
  DROP POLICY IF EXISTS conversations_update_participants ON public.conversations;
  DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
END $$;

-- Allow authenticated users to INSERT conversations
-- This is needed because conversations are created before participants are added
CREATE POLICY conversations_insert_authenticated
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow participants to UPDATE conversations they're part of
CREATE POLICY conversations_update_participants
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
    )
  );

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND policyname LIKE '%insert%';
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'INSERT policy was not created!';
  ELSE
    RAISE NOTICE 'Successfully created % INSERT policy/policies for conversations', policy_count;
  END IF;
END $$;

