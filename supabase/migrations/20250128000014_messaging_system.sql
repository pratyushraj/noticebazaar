-- Fix: NoticeBazaar Messaging System Migration (corrected)
-- Run as a single migration. Idempotent where possible.

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'group', 'support'
  risk_tag TEXT, -- 'high_risk', 'payment', 'tax', 'legal', null
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  unread_count_creator INTEGER DEFAULT 0,
  unread_count_advisor INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATION PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'creator', 'advisor', 'admin'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'attachment', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MESSAGE ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  signed_download_url TEXT,
  virus_scan_status TEXT DEFAULT 'pending', -- 'pending', 'clean', 'infected', 'error'
  virus_scan_result TEXT,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MESSAGE AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'read', 'deleted', 'updated'
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PRESENCE TABLE (for typing indicators)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'typing', -- 'typing', 'online', 'offline'
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_risk_tag ON public.conversations(risk_tag) WHERE risk_tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_logs_message_id ON public.message_audit_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_logs_performed_by ON public.message_audit_logs(performed_by);

CREATE INDEX IF NOT EXISTS idx_presence_conversation_id ON public.presence(conversation_id);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON public.presence(user_id);

-- ============================================================================
-- DROP TRIGGERS if they already exist (safe)
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON public.messages;
DROP FUNCTION IF EXISTS public.update_conversation_on_message();

DROP TRIGGER IF EXISTS trigger_log_message_action ON public.messages;
DROP FUNCTION IF EXISTS public.log_message_action();

-- ============================================================================
-- TRIGGERS: Update conversations.updated_at on new message
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation general fields
  UPDATE public.conversations
  SET 
    updated_at = NOW(),
    last_message_id = NEW.id,
    last_message_at = NEW.sent_at
  WHERE id = NEW.conversation_id;

  -- Update unread counts for creators
  UPDATE public.conversations c
  SET unread_count_creator = sub.creator_unread
  FROM (
    SELECT m.conversation_id,
      SUM(CASE WHEN cp.role = 'creator' AND m.is_read = FALSE AND m.sender_id <> cp.user_id THEN 1 ELSE 0 END) AS creator_unread
    FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.conversation_id = NEW.conversation_id
    GROUP BY m.conversation_id
  ) AS sub
  WHERE c.id = sub.conversation_id;

  -- Update unread counts for advisors
  UPDATE public.conversations c
  SET unread_count_advisor = sub.advisor_unread
  FROM (
    SELECT m.conversation_id,
      SUM(CASE WHEN cp.role = 'advisor' AND m.is_read = FALSE AND m.sender_id <> cp.user_id THEN 1 ELSE 0 END) AS advisor_unread
    FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.conversation_id = NEW.conversation_id
    GROUP BY m.conversation_id
  ) AS sub
  WHERE c.id = sub.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_message();

-- ============================================================================
-- TRIGGERS: Auto-create audit log on message actions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_message_action()
RETURNS TRIGGER AS $$
DECLARE
  actor_uuid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.message_audit_logs (message_id, action, performed_by, details)
    VALUES (NEW.id, 'created', NEW.sender_id, jsonb_build_object('content_length', COALESCE(length(NEW.content),0)));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine actor from jwt claims if available; fallback to NULL
    BEGIN
      actor_uuid := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
    EXCEPTION WHEN others THEN
      actor_uuid := NULL;
    END;

    IF NEW.is_read IS DISTINCT FROM OLD.is_read AND NEW.is_read = TRUE THEN
      INSERT INTO public.message_audit_logs (message_id, action, performed_by)
      VALUES (NEW.id, 'read', actor_uuid);
    ELSIF NEW.is_deleted IS DISTINCT FROM OLD.is_deleted AND NEW.is_deleted = TRUE THEN
      INSERT INTO public.message_audit_logs (message_id, action, performed_by)
      VALUES (NEW.id, 'deleted', actor_uuid);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_message_action
  AFTER INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_message_action();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (must exist before policies)
-- ============================================================================
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.presence ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (if any)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'conversations_select_participants_only' AND polrelid = 'public.conversations'::regclass) THEN
    DROP POLICY conversations_select_participants_only ON public.conversations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'conversations_select_admin' AND polrelid = 'public.conversations'::regclass) THEN
    DROP POLICY conversations_select_admin ON public.conversations;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore
END $$;

-- Drop other policies safely
DROP POLICY IF EXISTS "participants_select_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "messages_select_participants_only" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_participants_only" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "attachments_select_participants_only" ON public.message_attachments;
DROP POLICY IF EXISTS "attachments_insert_participants_only" ON public.message_attachments;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.message_audit_logs;
DROP POLICY IF EXISTS "presence_select_participants_only" ON public.presence;
DROP POLICY IF EXISTS "presence_upsert_own" ON public.presence;
DROP POLICY IF EXISTS "presence_update_own" ON public.presence;

-- ============================================================================
-- RLS POLICIES: Conversations
-- ============================================================================
-- Users can only see conversations they participate in
CREATE POLICY conversations_select_participants_only
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
    )
  );

-- Admins can see all conversations (if profile.role = 'admin')
CREATE POLICY conversations_select_admin
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: Conversation Participants
-- ============================================================================
-- Users can see participant records for conversations they're part of
CREATE POLICY participants_select_own
  ON public.conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR conversation_id IN (
      SELECT cp2.conversation_id
      FROM public.conversation_participants cp2
      WHERE cp2.user_id = auth.uid()
    )
  );

CREATE POLICY participants_insert_own
  ON public.conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: Messages
-- ============================================================================
-- Users can only read messages from conversations they participate in
CREATE POLICY messages_select_participants_only
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
    )
    AND is_deleted = FALSE
  );

-- Users can only send messages to conversations they participate in
CREATE POLICY messages_insert_participants_only
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = NEW.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- Users can update their own messages (mark as read, delete)
CREATE POLICY messages_update_own
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = NEW.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: Message Attachments
-- ============================================================================
CREATE POLICY attachments_select_participants_only
  ON public.message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY attachments_insert_participants_only
  ON public.message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = NEW.message_id
        AND cp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: Audit Logs (admin only OR participant of related convo)
-- ============================================================================
CREATE POLICY audit_logs_select_admin
  ON public.message_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_id
        AND cp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: Presence
-- ============================================================================
CREATE POLICY presence_select_participants_only
  ON public.presence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY presence_upsert_own
  ON public.presence FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY presence_update_own
  ON public.presence FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ENABLE REALTIME (Supabase) - safe adds
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
  END;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE public.conversations IS 'Stores conversation metadata including risk tags and unread counts';
COMMENT ON TABLE public.conversation_participants IS 'Many-to-many relationship between users and conversations';
COMMENT ON TABLE public.messages IS 'Message content with soft delete support';
COMMENT ON TABLE public.message_attachments IS 'File attachments linked to messages with virus scan status';
COMMENT ON TABLE public.message_audit_logs IS 'Audit trail for all message actions (admin access)';
COMMENT ON TABLE public.presence IS 'Real-time presence and typing indicators';

-- Done.