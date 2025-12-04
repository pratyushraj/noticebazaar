-- ============================================================================
-- VERIFICATION QUERIES - Run these to confirm migration success
-- ============================================================================

-- 1. Check old messages are preserved
SELECT 
  'legacy_messages' as table_name,
  COUNT(*) as row_count,
  'Old messaging system (preserved)' as description
FROM legacy_messages;

-- 2. Check new system tables exist and are empty (ready for use)
SELECT 
  'conversations' as table_name,
  COUNT(*) as row_count,
  'New conversation-based messaging' as description
FROM conversations;

SELECT 
  'conversation_participants' as table_name,
  COUNT(*) as row_count,
  'Participants in conversations' as description
FROM conversation_participants;

SELECT 
  'messages' as table_name,
  COUNT(*) as row_count,
  'New conversation-based messages' as description
FROM messages;

-- 3. Check all new tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'conversations',
    'conversation_participants', 
    'messages',
    'message_attachments',
    'message_audit_logs',
    'presence',
    'legacy_messages'
  )
ORDER BY table_name;

-- 4. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'conversations',
    'conversation_participants',
    'messages',
    'message_attachments',
    'message_audit_logs',
    'presence'
  )
ORDER BY tablename;

-- 5. Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'conversations',
    'conversation_participants',
    'messages',
    'message_attachments',
    'message_audit_logs',
    'presence'
  )
ORDER BY tablename, policyname;

