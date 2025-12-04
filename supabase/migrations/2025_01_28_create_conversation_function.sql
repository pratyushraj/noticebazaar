-- Create a SECURITY DEFINER function to create conversations
-- This bypasses RLS and allows authenticated users to create conversations

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_title TEXT,
  p_type TEXT DEFAULT 'direct',
  p_risk_tag TEXT DEFAULT NULL,
  p_creator_id UUID,
  p_advisor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO public.conversations (title, type, risk_tag)
  VALUES (p_title, p_type, p_risk_tag)
  RETURNING id INTO v_conversation_id;

  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES 
    (v_conversation_id, p_creator_id, 'creator'),
    (v_conversation_id, p_advisor_id, 'advisor')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_conversation TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_conversation IS 'Creates a conversation and adds participants. Bypasses RLS using SECURITY DEFINER.';

