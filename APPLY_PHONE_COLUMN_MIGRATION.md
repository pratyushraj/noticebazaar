# Apply Phone Column Migration

The `phone` column is required in the `profiles` table for eSign functionality but may not have been applied yet.

## Quick Fix: Apply via Supabase Dashboard

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Click "SQL Editor" in the left sidebar

2. **Run the Migration:**
   - Click "New query"
   - Copy and paste this SQL:

```sql
-- Add phone field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;

-- Add location field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location text;

-- Add bio field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description';
```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('phone', 'location', 'bio');
   ```
   Should return 3 rows.

---

**Status:** Migration file exists at `supabase/migrations/2025_11_26_add_profile_fields.sql`

**Note:** After applying this migration, you'll be able to save phone numbers in your profile.

