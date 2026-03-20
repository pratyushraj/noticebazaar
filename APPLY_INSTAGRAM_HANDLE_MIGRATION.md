# 🚀 Apply Instagram Handle Migration

**Issue:** Error "Could not find the 'instagram_handle' column of 'profiles' in the schema cache"

**Solution:** Run the migration to add the `instagram_handle` column

---

## ✅ Quick Steps (Supabase Dashboard)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

2. **Copy & Paste Migration**
   ```sql
   -- Add instagram_handle column to profiles table
   -- This column stores Instagram username without @ symbol
   -- Used for displaying on collab links and creator directory

   ALTER TABLE public.profiles
   ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

   -- Add comment
   COMMENT ON COLUMN public.profiles.instagram_handle IS 'Instagram username without @ symbol. Used for public display on collab links and creator directory.';

   -- Create index for faster lookups (optional but helpful for directory searches)
   CREATE INDEX IF NOT EXISTS idx_profiles_instagram_handle ON public.profiles(instagram_handle) WHERE instagram_handle IS NOT NULL;
   ```

3. **Run Migration**
   - Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
   - Wait for completion

4. **Verify Success**
   ```sql
   -- Check if column exists
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'profiles' 
   AND column_name = 'instagram_handle';
   ```
   Should return: `instagram_handle | text`

---

## ✅ Expected Result

- ✅ Column `instagram_handle` added to `profiles` table
- ✅ Index created for faster lookups
- ✅ No errors in output
- ✅ Profile updates will work without 400 errors

---

## 🔍 After Migration

1. **Refresh your browser** - The error should disappear
2. **Try saving your profile** - Should work without 400 errors
3. **Set Instagram handle** - It will sync with your collab link username

---

## ⚠️ If Errors Occur

- **"column already exists"** → Column already created, skip this migration
- **"permission denied"** → Check you're using the correct Supabase project
- **"syntax error"** → Make sure you copied the entire SQL

Copy the full error message and I'll help fix it!

