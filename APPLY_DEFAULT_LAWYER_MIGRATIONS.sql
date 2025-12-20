-- ============================================================================
-- COMPLETE MIGRATION: Auto-add default lawyer (lawyer@yopmail.com) to ALL conversations
-- ============================================================================
-- Run this entire script in Supabase Dashboard → SQL Editor
-- This will:
-- 1. Create a trigger to auto-add lawyer to all NEW conversations
-- 2. Update the RPC function to also add lawyer
-- 3. Backfill all EXISTING conversations to include the lawyer
-- ============================================================================

-- ============================================================================
-- STEP 1: Create trigger function and trigger for NEW conversations
-- ============================================================================
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_add_default_lawyer ON public.conversations;

-- Create trigger that fires AFTER a conversation is inserted
CREATE TRIGGER trigger_auto_add_default_lawyer
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_default_lawyer_to_conversation();

-- ============================================================================
-- STEP 2: Update create_conversation RPC function to also add default lawyer
-- ============================================================================
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

  -- Add participants: creator, advisor, and default lawyer (if exists and not already the advisor)
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

-- ============================================================================
-- STEP 3: Backfill - Add default lawyer to ALL EXISTING conversations
-- ============================================================================
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

-- ============================================================================
-- DONE! 
-- ============================================================================
-- After running this:
-- ✅ All existing conversations now have lawyer@yopmail.com as participant
-- ✅ All new conversations will automatically include lawyer@yopmail.com
-- ✅ Lawyer dashboard will show all conversations
-- ============================================================================

