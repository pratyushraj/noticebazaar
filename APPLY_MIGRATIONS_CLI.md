# Apply Migrations Using Supabase CLI

## Current Status

The Supabase CLI is linked to your project (`ooaxtwmqrvfzdqzoijcj`), but the migration history is out of sync with the remote database.

## Recommended Approach: Use Supabase Dashboard SQL Editor

Since some migrations have already been applied and the history is out of sync, the **easiest and safest approach** is to use the Supabase Dashboard SQL Editor:

### Quick Steps:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
2. **Go to SQL Editor** (left sidebar)
3. **Apply migrations in this order:**

   **Step 1: Partner Program Base**
   - Open: `supabase/migrations/2025_11_22_partner_program_complete.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**

   **Step 2: Partner Program Enhancements**
   - Open: `supabase/migrations/2025_11_23_partner_program_enhancements.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**

   **Step 3: Notifications System**
   - Open: `supabase/migrations/2025_11_28_create_notifications_system.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**

4. **Verify**: Run the verification script:
   - Open: `supabase/migrations/verify_migrations.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**
   - All checks should show ✅

---

## Alternative: Fix Migration History (Advanced)

If you want to sync the migration history with CLI:

### Option 1: Mark All Local Migrations as Applied

```bash
# This marks all local migrations as already applied on remote
# Use this if you've already applied them manually via SQL Editor

supabase migration repair --status applied 20240101000000
supabase migration repair --status applied 2025_11_22_partner_program_complete
supabase migration repair --status applied 2025_11_23_partner_program_enhancements
supabase migration repair --status applied 2025_11_28_create_notifications_system
# ... repeat for all migrations that are already applied
```

### Option 2: Pull Remote Schema

```bash
# Pull the current remote schema to see what's actually there
supabase db pull
```

### Option 3: Reset and Reapply (⚠️ DESTRUCTIVE)

```bash
# ⚠️ WARNING: This will reset your local database
# Only use this for local development, NOT production

supabase db reset
supabase db push
```

---

## Why Use SQL Editor Instead?

1. ✅ **No migration history conflicts** - Direct SQL execution
2. ✅ **Idempotent migrations** - Most migrations use `IF NOT EXISTS` so they're safe to run multiple times
3. ✅ **Immediate feedback** - See errors right away
4. ✅ **Better error handling** - Can see exactly which statement failed
5. ✅ **No CLI version issues** - Works regardless of CLI version

---

## Verification

After applying migrations, verify everything is set up:

```sql
-- Run this in SQL Editor
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones')
ORDER BY table_name;
```

You should see all tables with ✅ EXISTS status.

---

## Next Steps

After migrations are applied:
1. Refresh your app
2. Check browser console - 404 errors should be gone
3. Test notifications functionality
4. Test partner program features

---

**Note**: The migration files are already idempotent (use `IF NOT EXISTS`), so running them multiple times is safe. If you see "already exists" errors, those tables/columns are already created and you can skip those statements.

