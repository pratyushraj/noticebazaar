# Fix: Storage Bucket "creator-assets" Not Accessible

## Problem
You're getting: "Storage bucket 'creator-assets' not found or not accessible"

This means the bucket exists but isn't configured for public access.

## Quick Fix: Verify Bucket Settings in Supabase Dashboard

### Step 1: Check Bucket is Public

1. Go to **Supabase Dashboard** → **Storage** → **Buckets**
2. Find the `creator-assets` bucket
3. Click on it to open settings
4. **Verify "Public bucket" is checked** ✅
   - If unchecked, check it and save

### Step 2: Verify RLS Policies

1. In the bucket settings, go to **Policies** tab
2. You should have **5 policies**:
   - ✅ "Users can upload their own files" (INSERT)
   - ✅ "Users can read their own files" (SELECT)
   - ✅ "Users can update their own files" (UPDATE)
   - ✅ "Users can delete their own files" (DELETE)
   - ✅ **"Public can read files" (SELECT)** ← **This is critical!**

3. If "Public can read files" is missing, run the SQL below

### Step 3: Run This SQL (if needed)

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'creator-assets';

-- Add public read policy if missing
CREATE POLICY IF NOT EXISTS "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-assets');
```

### Step 4: Test

1. Try clicking "View Original File" again
2. The file should open in a new tab

## Alternative: Check Bucket Name

If the bucket has a different name (e.g., `creator_assets` with underscore):

1. Note the exact bucket name from Supabase Dashboard
2. Add to your `.env` file:
   ```env
   VITE_CREATOR_ASSETS_BUCKET=your-actual-bucket-name
   ```
3. Restart your dev server

## Still Not Working?

Check the browser console (F12) for:
- The exact URL being accessed
- Any CORS errors
- The bucket name in the URL path

Share these details for further debugging.

