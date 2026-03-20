# Backend Ultra Polish Migration - Application Instructions

**Migration File:** `supabase/migrations/2025_01_27_backend_ultra_polish.sql`

---

## Option 1: Apply via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard
   - Select your NoticeBazaar project

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Migration:**
   - Open `supabase/migrations/2025_01_27_backend_ultra_polish.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration:**
   - Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
   - Wait for execution to complete

5. **Verify Success:**
   - Check for any errors in the output
   - Verify RLS policies were created:
     ```sql
     SELECT schemaname, tablename, policyname 
     FROM pg_policies 
     WHERE schemaname = 'public' 
     ORDER BY tablename, policyname;
     ```
   - Verify indexes were created:
     ```sql
     SELECT tablename, indexname 
     FROM pg_indexes 
     WHERE schemaname = 'public' 
     AND indexname LIKE 'idx_%'
     ORDER BY tablename, indexname;
     ```

---

## Option 2: Apply via Supabase CLI (Local)

If you have Supabase running locally:

```bash
# Start Supabase (if not running)
supabase start

# Apply migration
supabase migration up
```

---

## Option 3: Apply via Supabase CLI (Remote)

If you have Supabase CLI linked to your remote project:

```bash
# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration to remote
supabase db push
```

---

## What This Migration Does

### 1. RLS Security Enhancements
- ✅ Verifies and fixes RLS policies for all tables
- ✅ Adds missing DELETE policies
- ✅ Ensures proper ownership checks
- ✅ Adds admin access policies where needed

### 2. Performance Optimization
- ✅ Adds 15+ performance indexes
- ✅ Composite indexes for common queries
- ✅ Partial indexes for filtered queries
- ✅ GIN indexes for array/JSONB searches

### 3. Transaction Safety
- ✅ Creates `update_payment_received()` function
- ✅ Creates `create_contract_issue()` function
- ✅ Both functions are transaction-safe and verify ownership

### 4. Audit Logging
- ✅ Creates `audit_logs` table
- ✅ Creates `log_audit_event()` function
- ✅ Adds indexes for fast queries

### 5. Referential Integrity
- ✅ Verifies foreign key constraints
- ✅ Ensures proper cascading rules

---

## Verification Queries

After applying the migration, run these to verify:

### Check RLS Policies
```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Indexes
```sql
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### Check Functions
```sql
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_payment_received', 'create_contract_issue', 'log_audit_event')
ORDER BY routine_name;
```

### Check Audit Logs Table
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'audit_logs'
ORDER BY ordinal_position;
```

---

## Rollback (If Needed)

If you need to rollback, you can manually drop:

```sql
-- Drop functions
DROP FUNCTION IF EXISTS public.update_payment_received;
DROP FUNCTION IF EXISTS public.create_contract_issue;
DROP FUNCTION IF EXISTS public.log_audit_event;

-- Drop audit_logs table
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Note: Indexes and RLS policies will remain (they're safe to keep)
```

---

## Support

If you encounter any issues:
1. Check the Supabase dashboard logs
2. Verify your database connection
3. Ensure you have the necessary permissions
4. Review the migration file for any syntax errors

---

**Last Updated:** 2025-01-27

