# 🧪 Message System Test Guide

## Quick Test Steps

### 1. Test Legacy Messages (MessagesPage)

1. **Open MessagesPage** (`/messages`)
2. **Check Console** - Should see no errors about `legacy_messages`
3. **Select an Advisor** - Should load without errors
4. **Send a Test Message**:
   - Type "Test message" in input
   - Click send or press Enter
   - Message should appear immediately
5. **Verify**:
   - Message appears in chat
   - No console errors
   - Message persists after refresh

### 2. Test New Conversation System (Lawyer Dashboard)

1. **Open Lawyer Dashboard** (`/lawyer` or `/advisor`)
2. **Check Console** - Should NOT see "infinite recursion" error
3. **Check Conversations Load**:
   - Should see conversation list (or "No conversations found")
   - No errors in console
4. **Create/Select a Conversation**:
   - If no conversations, you'll need to create one first
5. **Send a Test Message**:
   - Type "Test message" in input
   - Click send
   - Message should appear immediately
6. **Verify**:
   - Message appears in chat
   - No console errors
   - Realtime updates work (try sending from another browser/tab)

### 3. Database Verification (Supabase SQL Editor)

Run these queries to verify data:

```sql
-- Check legacy messages
SELECT COUNT(*) as legacy_count FROM legacy_messages;

-- Check new messages  
SELECT COUNT(*) as new_count FROM messages;

-- Check conversations
SELECT COUNT(*) as conv_count FROM conversations;

-- Check participants
SELECT COUNT(*) as part_count FROM conversation_participants;

-- Check recent messages
SELECT 
  'legacy' as type,
  id, sender_id, receiver_id, content, sent_at
FROM legacy_messages
ORDER BY sent_at DESC
LIMIT 5

UNION ALL

SELECT 
  'new' as type,
  id::text, sender_id::text, conversation_id::text, content, sent_at
FROM messages
ORDER BY sent_at DESC
LIMIT 5;
```

### 4. Browser Console Test

Open browser console and run:

```javascript
// Test 1: Check if Supabase client is available
console.log('Supabase client:', window.supabase || 'Not found in window');

// Test 2: Check legacy messages
(async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase
    .from('legacy_messages')
    .select('id, content')
    .limit(1);
  console.log('Legacy messages:', data, error);
})();

// Test 3: Check new messages
(async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase
    .from('messages')
    .select('id, content, conversation_id')
    .limit(1);
  console.log('New messages:', data, error);
})();

// Test 4: Check conversations
(async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title')
    .limit(1);
  console.log('Conversations:', data, error);
})();
```

## Expected Results

### ✅ Success Indicators:
- No console errors
- Messages appear immediately after sending
- Messages persist after page refresh
- Realtime updates work (messages appear in other tabs/browsers)
- Both legacy and new systems work independently

### ❌ Failure Indicators:
- Console errors about missing tables
- Messages don't appear after sending
- "Infinite recursion" errors
- "Could not find relationship" errors
- 400/406 HTTP errors in Network tab

## Common Issues & Fixes

### Issue: "Could not find relationship between 'messages' and 'profiles'"
**Fix**: Already fixed - MessagesPage uses `legacy_messages`

### Issue: "Infinite recursion detected in policy"
**Fix**: Run the SQL fix from `APPLY_FIX_NOW.sql` in Supabase

### Issue: Messages not appearing
**Fix**: 
- Check browser console for errors
- Verify RLS policies are correct
- Check if user is authenticated
- Verify conversation_participants exist

### Issue: 406 errors for partner_stats
**Fix**: Already handled - returns null gracefully

### Issue: 400 errors for profiles role filter
**Fix**: Already handled - returns empty array gracefully

## Quick Manual Test

1. **Open app** → Go to MessagesPage
2. **Send message** → Type "Hello" and send
3. **Check** → Message should appear
4. **Refresh** → Message should still be there
5. **Open Lawyer Dashboard** → Should load without errors
6. **Check console** → Should see minimal/no errors

---

**Ready to test?** Follow the steps above and report any issues!

