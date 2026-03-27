-- Backfill: Add default lawyer (lawyer@yopmail.com) to all existing conversations
-- This ensures the lawyer dashboard shows all conversations, including old ones

DO $$
DECLARE
  v_lawyer_user_id UUID;
  v_conversation_id UUID;
  v_added_count INTEGER := 0;
BEGIN
  -- Get the lawyer user ID
  SELECT id INTO v_lawyer_user_id
  FROM auth.users
  WHERE email = 'lawyer@yopmail.com'
  LIMIT 1;

  IF v_lawyer_user_id IS NULL THEN
    RAISE WARNING 'Default lawyer (lawyer@yopmail.com) not found in auth.users. Skipping backfill.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found lawyer user ID: %', v_lawyer_user_id;

  -- Loop through all conversations
  FOR v_conversation_id IN 
    SELECT id FROM public.conversations
  LOOP
    -- Check if lawyer is already a participant
    IF NOT EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = v_conversation_id
        AND user_id = v_lawyer_user_id
    ) THEN
      -- Add lawyer as participant
      INSERT INTO public.conversation_participants (conversation_id, user_id, role)
      VALUES (v_conversation_id, v_lawyer_user_id, 'advisor')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      v_added_count := v_added_count + 1;
      RAISE NOTICE 'Added lawyer to conversation: %', v_conversation_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill complete. Added lawyer to % conversation(s).', v_added_count;
END $$;

