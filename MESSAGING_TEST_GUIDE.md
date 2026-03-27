# Messaging Test Guide - Creator ↔ Lawyer Bidirectional Communication

## Overview
This guide helps you test that messages are being sent and received correctly between:
- **Creator** (MessagesPage) → **Lawyer** (LawyerDashboard)
- **Lawyer** (LawyerDashboard) → **Creator** (MessagesPage)

## Prerequisites
1. Two browser windows/tabs open:
   - **Window 1**: Creator account logged in at `/messages`
   - **Window 2**: Lawyer account logged in at `/lawyer-dashboard`

2. Both accounts should have an existing conversation (or one will be auto-created)

## Test Steps

### Test 1: Creator → Lawyer
1. **In Creator Window (MessagesPage)**:
   - Select the lawyer/advisor from the advisor list
   - Type a message: `"Test message from creator - ${new Date().toLocaleTimeString()}"`
   - Click Send or press Enter
   - **Expected**: Message appears immediately in creator's chat

2. **In Lawyer Window (LawyerDashboard)**:
   - Select the same conversation from the list
   - **Expected**: The message should appear within 1-2 seconds (real-time update)
   - Check browser console for: `[LawyerDashboard] Real-time message update:`

### Test 2: Lawyer → Creator
1. **In Lawyer Window (LawyerDashboard)**:
   - Make sure a conversation is selected
   - Type a message: `"Test message from lawyer - ${new Date().toLocaleTimeString()}"`
   - Click Send
   - **Expected**: Message appears immediately in lawyer's chat

2. **In Creator Window (MessagesPage)**:
   - **Expected**: The message should appear within 1-2 seconds (real-time update)
   - Check browser console for: `[MessagesPage] Real-time message update:`

## Debugging

### Check Console Logs

**Creator Side (MessagesPage)**:
- Look for: `[MessagesPage] Sending via conversation system:`
- Look for: `[MessagesPage] Real-time message update:`
- Look for: `[MessagesPage] Setting up real-time subscription for conversation:`

**Lawyer Side (LawyerDashboard)**:
- Look for: `[LawyerDashboard] Real-time message update:`
- Look for: `[LawyerDashboard] Realtime subscription status: SUBSCRIBED`
- Look for: `[LawyerDashboard] Found conversations: X`

### Common Issues

1. **Messages not appearing on lawyer side**:
   - Check if conversation exists: Look for `[LawyerDashboard] Found conversations: 1` (or more)
   - Check RLS policies: Make sure lawyer user is a participant in the conversation
   - Check real-time subscription: Look for `SUBSCRIBED` status

2. **Messages not appearing on creator side**:
   - Check if conversation was created: Look for `[MessagesPage] Conversation ID: ...`
   - Check real-time subscription: Look for `[MessagesPage] Setting up real-time subscription`

3. **Real-time not working**:
   - Check Supabase dashboard → Realtime → Make sure `messages` table is enabled
   - Check browser console for subscription errors
   - Verify both users are authenticated

## Database Verification

Run this SQL in Supabase SQL Editor to check messages:

```sql
-- Check recent messages in a conversation
SELECT 
  m.id,
  m.conversation_id,
  m.sender_id,
  m.content,
  m.sent_at,
  p.first_name || ' ' || p.last_name as sender_name
FROM messages m
LEFT JOIN profiles p ON p.id = m.sender_id
WHERE m.conversation_id = 'YOUR_CONVERSATION_ID_HERE'
ORDER BY m.sent_at DESC
LIMIT 10;
```

## Expected Behavior

✅ **Success Indicators**:
- Messages appear on both sides within 1-2 seconds
- Console shows real-time subscription status: `SUBSCRIBED`
- Console shows message updates: `Real-time message update:`
- No errors in browser console
- Messages persist after page refresh

❌ **Failure Indicators**:
- Messages only appear after manual refresh
- Console shows subscription errors
- Console shows RLS policy errors (403, 42501)
- Messages appear on sender side but not receiver side

## Next Steps if Tests Fail

1. Check Supabase RLS policies for `messages` table
2. Verify `conversations` table has correct participants
3. Check Supabase Realtime is enabled for `messages` table
4. Verify both users are authenticated and have correct `user.id`
5. Check browser console for specific error messages

