# Apply Brand Phone Migration

The `brand_phone` column is required for eSign functionality but hasn't been applied to your database yet.

## Quick Fix: Apply via Supabase Dashboard

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Click "SQL Editor" in the left sidebar

2. **Run the Migration:**
   - Click "New query"
   - Copy and paste this SQL:

```sql
-- Add brand_phone column to brand_deals table
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.brand_phone IS 'Brand contact phone number for WhatsApp reminders and eSign';
```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'brand_deals' 
   AND column_name = 'brand_phone';
   ```
   Should return 1 row.

## Alternative: Use Supabase CLI

```bash
supabase db push
```

---

**Status:** Migration file exists at `supabase/migrations/2025_01_31_add_brand_phone_to_brand_deals.sql`

**Note:** The backend code has been updated to handle missing columns gracefully, but the migration should still be applied for full functionality.

