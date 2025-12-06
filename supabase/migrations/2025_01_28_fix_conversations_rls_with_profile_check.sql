-- Fix RLS policy to check both auth.uid() and profile.id
-- This handles cases where participant.user_id might be a profile ID

-- Drop existing SELECT policy
DROP POLICY IF EXISTS conversations_select_participants_only ON public.conversations;

-- Create new policy that checks both auth.uid() and profile relationship
-- This allows access if:
-- 1. The participant.user_id matches auth.uid() directly, OR
-- 2. The participant.user_id is a profile ID that corresponds to auth.uid()
CREATE POLICY conversations_select_participants_only
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND (
          -- Direct match with auth.uid()
          cp.user_id = auth.uid()
          OR
          -- Match via profile (in case user_id is stored as profile.id)
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = cp.user_id
              AND p.id = auth.uid()
          )
        )
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

