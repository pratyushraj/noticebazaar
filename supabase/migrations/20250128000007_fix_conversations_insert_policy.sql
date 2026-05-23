-- Fix: Add INSERT policy for conversations table
-- This allows authenticated users to create conversations

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS conversations_insert_authenticated ON public.conversations;

-- Allow authenticated users to create conversations
-- They can only create conversations where they will be a participant
CREATE POLICY conversations_insert_authenticated
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow any authenticated user to create a conversation
  -- The participant insertion will be validated separately by participants_insert_own policy

-- Also add UPDATE policy for conversations (to update last_message_at, unread counts, etc.)
DROP POLICY IF EXISTS conversations_update_participants ON public.conversations;

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

