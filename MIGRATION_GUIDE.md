# NoticeBazaar Database Migration Guide

This guide will help you set up the missing database tables (`notifications` and `partner_stats`) that are causing 404 errors in the console.

## 📋 Prerequisites

- Access to your Supabase project dashboard
- Supabase CLI installed (optional, for local development)
- Your Supabase project URL and service role key (for production)

## 🎯 Overview

The following tables need to be created:
1. **`notifications`** - User notifications system
2. **`partner_stats`** - Partner program statistics

These migrations already exist in the codebase but need to be applied to your Supabase database.

---

## 📁 Migration Files

The following migration files are already in `supabase/migrations/`:

1. **`2025_11_22_partner_program_complete.sql`** - Creates partner_stats and related tables (base partner program)
2. **`2025_11_23_partner_program_enhancements.sql`** - Adds performance metrics to partner_stats (clicks, signups, etc.)
3. **`2025_11_28_create_notifications_system.sql`** - Creates notifications table

---

## 🚀 Method 1: Using Supabase Dashboard (Recommended for Production)

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Apply Partner Program Base Migration

1. Open the file: `supabase/migrations/2025_11_22_partner_program_complete.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run** (or press `Cmd/Ctrl + Enter`)
5. Verify success message appears

### Step 3: Apply Partner Program Enhancements

1. Open the file: `supabase/migrations/2025_11_23_partner_program_enhancements.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run**
5. Verify success message appears

### Step 4: Apply Notifications Migration

1. Open the file: `supabase/migrations/2025_11_28_create_notifications_system.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run**
5. Verify success message appears

### Step 5: Verify Tables Were Created

**Option A: Use the verification script (Recommended)**

1. Open the file: `supabase/migrations/verify_migrations.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run**
5. Review all check results - all should show ✅

**Option B: Manual verification**

Run this verification query in SQL Editor:

```sql
-- Check if tables exist
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'partner_stats', 'referral_links', 'referrals', 'partner_earnings', 'partner_milestones')
ORDER BY table_name;
```

You should see all 6 tables listed.

---

## 🛠️ Method 2: Using Supabase CLI (Recommended for Local Development)

### Step 1: Link Your Project

```bash
# If not already linked
supabase link --project-ref your-project-ref
```

### Step 2: Apply Migrations

```bash
# Apply all pending migrations
supabase db push

# Or apply specific migrations
supabase migration up
```

### Step 3: Verify

```bash
# Check migration status
supabase migration list
```

---

## ✅ Verification Checklist

After applying migrations, verify the following:

### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notifications', 'partner_stats');
```

### 2. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'partner_stats');
```

Both should show `rowsecurity = true`.

### 3. Check Indexes

```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'partner_stats')
ORDER BY tablename, indexname;
```

### 4. Check Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'mark_notification_read',
    'mark_all_notifications_read',
    'get_unread_notification_count',
    'get_or_create_referral_link',
    'initialize_partner_stats',
    'refresh_partner_stats'
  )
ORDER BY routine_name;
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"

If you see this error, the table already exists. You can either:
1. Skip the migration (safe)
2. Drop and recreate (⚠️ **WARNING**: This will delete data)

To check if table exists:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = 'notifications'
);
```

### Error: "permission denied"

Ensure you're using the **Service Role Key** or have proper admin permissions in Supabase.

### Error: "function does not exist"

Some functions depend on others. Apply migrations in this exact order:
1. **First**: `2025_11_22_partner_program_complete.sql` (base partner program)
2. **Second**: `2025_11_23_partner_program_enhancements.sql` (adds performance metrics)
3. **Third**: `2025_11_28_create_notifications_system.sql` (notifications)

---

## 📊 What Gets Created

### Notifications Table

- **Table**: `notifications`
- **Columns**: id, user_id, type, category, title, message, data, link, read, read_at, created_at, expires_at, priority, icon, action_label, action_link
- **Indexes**: 5 indexes for performance
- **RLS Policies**: 4 policies (SELECT, UPDATE, DELETE for users, INSERT for service role)
- **Functions**: 3 functions (mark_read, mark_all_read, get_unread_count)
- **Real-time**: Enabled for live updates

### Partner Stats Table

- **Table**: `partner_stats`
- **Columns**: user_id (PK), total_referrals, active_referrals, total_earnings, tier, next_payout_date, free_months_credit, updated_at
- **Indexes**: 3 indexes
- **RLS Policies**: 2 policies (SELECT for users, ALL for system)
- **Related Tables**: referral_links, referrals, partner_earnings, partner_milestones
- **Functions**: 10+ functions for partner program logic

---

## 🧪 Test After Migration

### Test Notifications

```sql
-- Insert a test notification
INSERT INTO public.notifications (user_id, type, category, title, message, priority)
VALUES (
  auth.uid(), -- Replace with actual user ID
  'system',
  'system_update',
  'Test Notification',
  'This is a test notification',
  'normal'
);

-- Verify it was created
SELECT * FROM public.notifications WHERE user_id = auth.uid();
```

### Test Partner Stats

```sql
-- Initialize stats for a user
SELECT initialize_partner_stats('your-user-id-here');

-- Verify stats were created
SELECT * FROM public.partner_stats WHERE user_id = 'your-user-id-here';
```

---

## 🔄 Rollback (If Needed)

If you need to rollback, you can drop the tables:

```sql
-- ⚠️ WARNING: This will delete all data
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.partner_stats CASCADE;
DROP TABLE IF EXISTS public.partner_earnings CASCADE;
DROP TABLE IF EXISTS public.partner_milestones CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.referral_links CASCADE;
```

---

## 📝 Next Steps

After applying migrations:

1. **Refresh your app** - The 404 errors should disappear
2. **Test notifications** - Create a test notification to verify
3. **Test partner program** - Initialize stats for a test user
4. **Monitor console** - Check that no more 404 errors appear

---

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify your project has the required permissions
3. Ensure you're using the correct database (not a fork/clone)
4. Check that migrations haven't been partially applied

---

## 📚 Additional Resources

- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/tables)

---

**Last Updated**: 2025-01-27  
**Migration Files**:
- `supabase/migrations/2025_11_22_partner_program_complete.sql` (base partner program)
- `supabase/migrations/2025_11_23_partner_program_enhancements.sql` (partner program enhancements)
- `supabase/migrations/2025_11_28_create_notifications_system.sql` (notifications system)

