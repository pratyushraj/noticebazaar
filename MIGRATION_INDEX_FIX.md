# Migration Index Fix

## ✅ Issue #3 Resolved

**Error:** `functions in index predicate must be marked IMMUTABLE`

**Context:** `CREATE INDEX ... WHERE status = 'open' AND deadline >= CURRENT_DATE`

**Problem:** `CURRENT_DATE` is not an immutable function - it changes every day, so PostgreSQL cannot use it in index predicates.

**Fix Applied:** Removed `deadline >= CURRENT_DATE` from the index predicate. The index now only filters by `status = 'open'`, which is sufficient for performance. Deadline filtering should be done in queries.

## 🚀 Migration Status

**File:** `supabase/migrations/2025_01_27_backend_ultra_polish.sql`  
**Status:** ✅ **FIXED - Ready to apply**

The migration now handles:
- ✅ Existing policies (idempotent)
- ✅ Missing tables (conditional checks)
- ✅ Duplicate objects (exception handling)
- ✅ Immutable index predicates (no CURRENT_DATE)

## 📋 Apply Migration

### Via Supabase Dashboard:

1. **Open SQL Editor:**
   - https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Click "SQL Editor" → "New query"

2. **Copy & Paste:**
   ```bash
   cat supabase/migrations/2025_01_27_backend_ultra_polish.sql
   ```
   - Copy all lines
   - Paste into SQL Editor

3. **Run:**
   - Click "Run" (Cmd+Enter / Ctrl+Enter)
   - Should complete without errors

4. **Verify:**
   - Check output for "Success. No rows returned"
   - No errors should appear

## ✅ What Changed

### Before:
```sql
CREATE INDEX IF NOT EXISTS idx_opportunities_open_deadline 
ON public.opportunities(status, deadline) 
WHERE status = 'open' AND deadline >= CURRENT_DATE;
```

### After:
```sql
CREATE INDEX IF NOT EXISTS idx_opportunities_open_deadline 
ON public.opportunities(status, deadline) 
WHERE status = 'open';
```

## 📝 Notes

- **Index is still useful:** The index on `(status, deadline)` with `WHERE status = 'open'` will still help with queries filtering open opportunities
- **Deadline filtering:** Applications should filter by `deadline >= CURRENT_DATE` in their queries, not in the index
- **Performance:** The index will still speed up queries like:
  ```sql
  SELECT * FROM opportunities 
  WHERE status = 'open' 
  AND deadline >= CURRENT_DATE
  ORDER BY deadline;
  ```

## 🔍 PostgreSQL Immutability Rules

Functions used in index predicates must be:
- **IMMUTABLE:** Always return the same result for the same input
- **STABLE:** Return the same result within a single query execution
- **VOLATILE:** Can return different results (like `CURRENT_DATE`, `NOW()`, `RANDOM()`)

Only IMMUTABLE functions can be used in index predicates.

---

**Status:** ✅ **FIXED - Ready to apply via Supabase Dashboard**

