-- Auto-add default lawyer (lawyer@yopmail.com) to all new conversations
-- This ensures the lawyer dashboard always shows all conversations

CREATE OR REPLACE FUNCTION public.auto_add_default_lawyer_to_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lawyer_user_id UUID;
BEGIN
  -- Get the lawyer user ID from auth.users
  SELECT id INTO v_lawyer_user_id
  FROM auth.users
  WHERE email = 'lawyer@yopmail.com'
  LIMIT 1;

  -- If lawyer exists, add them as a participant
  IF v_lawyer_user_id IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id, role)
    VALUES (NEW.id, v_lawyer_user_id, 'advisor')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-added default lawyer (lawyer@yopmail.com) to conversation %', NEW.id;
  ELSE
    RAISE WARNING 'Default lawyer (lawyer@yopmail.com) not found in auth.users';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger that fires AFTER a conversation is inserted
DROP TRIGGER IF EXISTS trigger_auto_add_default_lawyer ON public.conversations;

CREATE TRIGGER trigger_auto_add_default_lawyer
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_default_lawyer_to_conversation();

-- Add comment
COMMENT ON FUNCTION public.auto_add_default_lawyer_to_conversation() IS 'Automatically adds the default lawyer (lawyer@yopmail.com) as a participant to all new conversations';

