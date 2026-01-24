# 🚀 Apply Collab Link Analytics Migration

**Issue:** The `collab_link_events` table doesn't exist, causing 500 errors on `/api/collab-analytics/summary`

**Solution:** Run the migration to create the table

---

## ✅ Quick Steps (Supabase Dashboard)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

2. **Copy & Paste Migration**
   - Open: `supabase/migrations/2026_01_16_create_collab_link_analytics.sql`
   - Copy the **ENTIRE** file contents
   - Paste into SQL Editor

3. **Run Migration**
   - Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
   - Wait for completion (should take 5-10 seconds)

4. **Verify Success**
   ```sql
   -- Check if table exists
   SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'collab_link_events'
   );
   ```
   Should return: `exists: true`

5. **Also Apply RLS Fix** (Optional but recommended)
   - Open: `supabase/migrations/2026_01_17_fix_collab_link_events_rls.sql`
   - Copy entire contents
   - Paste and run in SQL Editor

---

## ✅ Expected Result

- ✅ Table `collab_link_events` created
- ✅ Indexes created
- ✅ RLS policies created
- ✅ Functions created (`hash_ip`, `detect_device_type`)
- ✅ No errors in output

---

## 🔍 After Migration

1. **Refresh your browser** - The app should reconnect
2. **Check Collaboration Requests** - Should load without 500 errors
3. **Check Analytics** - `/api/collab-analytics/summary` should work

---

## ⚠️ If Errors Occur

Common issues:
- **"relation already exists"** → Table already created, skip this migration
- **"permission denied"** → Check you're using the correct Supabase project
- **"syntax error"** → Make sure you copied the entire file

Copy the full error message and I'll help fix it!

