# Messaging System Migration Guide

## 🎯 Situation

Your project has **TWO incompatible messaging systems**:

### Old System (Currently Active)
- **Table:** `messages` (with `receiver_id`, `case_id`)
- **Used by:** `MessagesPage.tsx`, `useMessages.ts`, Creator ↔ Advisor chats
- **Schema:** Direct 1-on-1 messaging linked to `cases` table

### New System (Migration)
- **Table:** `messages` (with `conversation_id`)
- **Designed for:** Lawyer Dashboard, WhatsApp-style chats, group conversations
- **Schema:** `conversations` → `conversation_participants` → `messages`

## ✅ Solution: Safe Co-Existence Migration

I've created **`2025_01_28_messaging_system_safe.sql`** which:

1. ✅ **Renames old table** → `legacy_messages` (preserves all data)
2. ✅ **Creates new system** → Fresh `messages` table with `conversation_id`
3. ✅ **No breaking changes** → Old code continues to work
4. ✅ **No data loss** → All existing messages preserved

## 📋 Migration Steps

### Step 1: Review the Migration
```bash
cat supabase/migrations/2025_01_28_messaging_system_safe.sql
```

### Step 2: Run in Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `2025_01_28_messaging_system_safe.sql`
3. Paste and run
4. ✅ Should complete without errors

### Step 3: Verify
```sql
-- Check old messages are preserved
SELECT COUNT(*) FROM legacy_messages;

-- Check new system is ready
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM conversation_participants;
SELECT COUNT(*) FROM messages;
```

## 🔄 Next Steps (After Migration)

### Option A: Update Old Code to Use Legacy Table
If you want to keep using the old system:

```typescript
// Update useMessages.ts
.from('legacy_messages')  // instead of 'messages'
```

### Option B: Migrate Data to New System (Recommended)
Create a data migration script to:
1. Convert `legacy_messages` → `conversations` + `messages`
2. Map `receiver_id`/`sender_id` → `conversation_participants`
3. Link `case_id` → conversation `risk_tag`

### Option C: Keep Both Systems
- Old system: Creator ↔ Advisor chats (uses `legacy_messages`)
- New system: Lawyer Dashboard, support chats (uses `messages`)

## ⚠️ Important Notes

1. **Old code will break** if it queries `messages` table expecting `receiver_id`
2. **Update queries** to use `legacy_messages` OR migrate to new system
3. **Test thoroughly** before deploying to production

## 🚨 Rollback Plan

If something goes wrong:

```sql
-- Restore old messages table
ALTER TABLE legacy_messages RENAME TO messages;

-- Drop new system (if needed)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
-- ... (drop other new tables)
```

## 📊 What Gets Created

### New Tables:
- ✅ `conversations` - Chat metadata
- ✅ `conversation_participants` - Who's in each chat
- ✅ `messages` - New conversation-based messages
- ✅ `message_attachments` - File attachments
- ✅ `message_audit_logs` - Audit trail
- ✅ `presence` - Typing indicators

### Preserved:
- ✅ `legacy_messages` - Your old messages (renamed, not deleted)

## 🎉 Benefits of New System

- ✅ Group chats (future)
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Better RLS policies
- ✅ Support categories (legal, tax, payments)
- ✅ Real-time subscriptions
- ✅ Message attachments with virus scanning

---

**Ready to migrate?** Run the SQL file in Supabase Dashboard!
