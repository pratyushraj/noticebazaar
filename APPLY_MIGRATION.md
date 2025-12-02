# Quick Guide: Apply Backend Ultra Polish Migration

**Migration File:** `supabase/migrations/2025_01_27_backend_ultra_polish.sql`

---

## ✅ RECOMMENDED: Apply via Supabase Dashboard

Since local Supabase isn't running, apply directly to your remote project:

### Steps:

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Select your NoticeBazaar project

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy Migration:**
   ```bash
   # From your terminal, view the file:
   cat supabase/migrations/2025_01_27_backend_ultra_polish.sql
   ```
   - Copy the entire contents

4. **Paste & Run:**
   - Paste into SQL Editor
   - Click "Run" (or Cmd+Enter / Ctrl+Enter)
   - Wait for completion

5. **Verify:**
   - Check for errors in output
   - Should see: "Success. No rows returned"

---

## Alternative: Use Supabase CLI (Remote)

If you have Supabase CLI configured:

```bash
# Link to your project (one-time setup)
supabase link --project-ref ooaxtwmqrvfzdqzoijcj

# Push migration to remote
supabase db push
```

---

## What Gets Applied

✅ **RLS Security:** Enhanced policies for all tables  
✅ **Performance:** 15+ new indexes  
✅ **Transactions:** Safe payment/issue functions  
✅ **Audit Logging:** Complete audit infrastructure  
✅ **Referential Integrity:** Foreign key checks  

---

## Need Help?

See `MIGRATION_INSTRUCTIONS.md` for detailed verification queries and troubleshooting.

---

**Status:** Migration file ready - apply via dashboard or CLI

