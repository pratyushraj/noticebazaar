-- Update create_conversation function to also add default lawyer
-- This ensures the lawyer is added even when using the RPC function

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_creator_id UUID,
  p_advisor_id UUID,
  p_title TEXT DEFAULT 'Legal Consultation',
  p_type TEXT DEFAULT 'direct',
  p_risk_tag TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_lawyer_user_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO public.conversations (title, type, risk_tag)
  VALUES (p_title, p_type, p_risk_tag)
  RETURNING id INTO v_conversation_id;

  -- Get the default lawyer user ID
  SELECT id INTO v_lawyer_user_id
  FROM auth.users
  WHERE email = 'lawyer@yopmail.com'
  LIMIT 1;

  -- Add participants: creator, advisor, and default lawyer (if exists)
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES 
    (v_conversation_id, p_creator_id, 'creator'),
    (v_conversation_id, p_advisor_id, 'advisor')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Add default lawyer if they exist and are not already the advisor
  IF v_lawyer_user_id IS NOT NULL AND v_lawyer_user_id != p_advisor_id THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id, role)
    VALUES (v_conversation_id, v_lawyer_user_id, 'advisor')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN v_conversation_id;
END;
$$;

