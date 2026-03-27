# Apply GST Company Cache Migration

**Migration:** `supabase/migrations/2025_02_18_create_gst_company_cache.sql`

## Quick Apply via Supabase Dashboard

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Click "SQL Editor" → "New query"

2. **Copy & Paste Migration:**
   ```sql
   -- Create GST company cache table for storing GSTIN lookup results
   -- This table caches GST API responses to minimize API calls and costs

   CREATE TABLE IF NOT EXISTS gst_company_cache (
     gstin TEXT PRIMARY KEY,
     legal_name TEXT NOT NULL,
     trade_name TEXT,
     address TEXT NOT NULL,
     state TEXT NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('Active', 'Cancelled', 'Suspended')),
     fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Create index on fetched_at for efficient cache expiry queries
   CREATE INDEX IF NOT EXISTS idx_gst_company_cache_fetched_at ON gst_company_cache(fetched_at);

   -- Add comment
   COMMENT ON TABLE gst_company_cache IS 'Cache for GSTIN lookup results from external API. Data is cached for 30 days.';
   ```

3. **Click "Run"** (Cmd+Enter / Ctrl+Enter)

4. **Verify Success:**
   - Should see: "Success. No rows returned"
   - No errors should appear

## Verify Migration

Run this in SQL Editor to confirm the table was created:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gst_company_cache'
ORDER BY ordinal_position;
```

You should see all 9 columns listed.

## What This Creates

✅ **Table:** `gst_company_cache`
- Stores GSTIN lookup results
- 30-day cache expiry
- Indexed for performance

✅ **Ready for:** GST lookup API endpoint

---

**Status:** Migration ready to apply via Supabase Dashboard

