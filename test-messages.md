# Message System Test Checklist

## Test 1: Legacy Messages (MessagesPage - Creator ↔ Advisor)
- [ ] Open MessagesPage
- [ ] Select an advisor
- [ ] Send a message
- [ ] Verify message appears immediately
- [ ] Check browser console for errors
- [ ] Verify message persists after refresh

## Test 2: New Conversation System (Lawyer Dashboard)
- [ ] Open Lawyer Dashboard
- [ ] Check if conversations load (should not show infinite recursion error)
- [ ] Select a conversation
- [ ] Send a message
- [ ] Verify message appears immediately
- [ ] Check browser console for errors
- [ ] Verify realtime updates work

## Test 3: Database Verification
Run these SQL queries in Supabase:

```sql
-- Check legacy messages
SELECT COUNT(*) FROM legacy_messages;

-- Check new messages
SELECT COUNT(*) FROM messages;

-- Check conversations
SELECT COUNT(*) FROM conversations;

-- Check participants
SELECT COUNT(*) FROM conversation_participants;
```

## Test 4: Realtime Subscriptions
- [ ] Open browser DevTools → Network tab
- [ ] Filter by "WS" (WebSocket)
- [ ] Send a message
- [ ] Verify WebSocket connection is active
- [ ] Check for realtime events

