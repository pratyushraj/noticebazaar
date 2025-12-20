-- Create RPC function to fetch conversations for a user
-- This bypasses RLS and uses SECURITY DEFINER to ensure it works

-- Drop function if it exists (with full signature for RETURNS TABLE)
DROP FUNCTION IF EXISTS public.get_user_conversations() CASCADE;

-- Create the function
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
  id UUID,
  title TEXT,
  type TEXT,
  risk_tag TEXT,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  unread_count_creator INTEGER,
  unread_count_advisor INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.type,
    c.risk_tag,
    c.last_message_id,
    c.last_message_at,
    c.unread_count_creator,
    c.unread_count_advisor,
    c.created_at,
    c.updated_at
  FROM public.conversations c
  WHERE EXISTS (
    SELECT 1 
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = c.id
      AND cp.user_id = auth.uid()
  )
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_conversations() IS 'Fetches all conversations where the current user (auth.uid()) is a participant. Uses SECURITY DEFINER to bypass RLS.';

