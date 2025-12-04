# 🚀 Run Messaging System Migration

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy & Paste Migration**
   - Open: `supabase/migrations/2025_01_28_messaging_system_safe.sql`
   - Copy the ENTIRE file contents
   - Paste into SQL Editor

4. **Run Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for completion (should take 10-30 seconds)

5. **Verify Success**
   ```sql
   -- Check old messages preserved
   SELECT COUNT(*) FROM legacy_messages;
   
   -- Check new system created
   SELECT COUNT(*) FROM conversations;
   SELECT COUNT(*) FROM conversation_participants;
   SELECT COUNT(*) FROM messages;
   ```

## ✅ Expected Result

- ✅ Migration completes without errors
- ✅ `legacy_messages` table exists (your old data)
- ✅ New tables created: `conversations`, `conversation_participants`, `messages`, etc.
- ✅ No data loss

## ⚠️ If Errors Occur

If you see any errors, copy the full error message and I'll help fix it.

---

**Ready?** Copy the SQL file and run it in Supabase Dashboard!

