# Storage Bucket Creation Guide

## Problem
You're getting a "Bucket not found" error (404) when trying to access contract files. This means the `creator-assets` bucket doesn't exist in your Supabase Storage.

## Solution: Create the Bucket

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Storage**
   - Click on **Storage** in the left sidebar
   - Click **Buckets** tab

3. **Create New Bucket**
   - Click **New bucket** button
   - **Bucket name**: `creator-assets` (exact name, case-sensitive)
   - **Public bucket**: ✅ Check this box (important!)
   - **File size limit**: Leave default or set to 50MB
   - **Allowed MIME types**: Leave empty (allows all types)
   - Click **Create bucket**

4. **Configure RLS Policies**

   After creating the bucket, you need to set up Row Level Security (RLS) policies:

   **Go to Storage → Policies → creator-assets**

   Create these policies:

   #### Policy 1: Allow authenticated users to upload their own files
   ```sql
   CREATE POLICY "Users can upload their own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'creator-assets' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   #### Policy 2: Allow authenticated users to read their own files
   ```sql
   CREATE POLICY "Users can read their own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'creator-assets' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   #### Policy 3: Allow authenticated users to update their own files
   ```sql
   CREATE POLICY "Users can update their own files"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'creator-assets' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   #### Policy 4: Allow authenticated users to delete their own files
   ```sql
   CREATE POLICY "Users can delete their own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'creator-assets' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   #### Policy 5: Allow public read access (since bucket is public)
   ```sql
   CREATE POLICY "Public can read files"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'creator-assets');
   ```

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Create the bucket
supabase storage create-bucket creator-assets --public

# Or using SQL
supabase db execute "
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('creator-assets', 'creator-assets', true)
  ON CONFLICT (id) DO NOTHING;
"
```

Then apply the RLS policies from Option 1 above.

### Option 3: Using SQL Editor

1. Go to **Supabase Dashboard → SQL Editor**
2. Run this SQL:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-assets',
  'creator-assets',
  true,
  52428800, -- 50MB
  NULL -- Allow all MIME types
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Public can read files (since bucket is public)
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-assets');
```

## Verification

After creating the bucket:

1. **Check bucket exists:**
   - Go to Storage → Buckets
   - You should see `creator-assets` in the list

2. **Test file access:**
   - Try viewing a contract file in your app
   - The "Bucket not found" error should be gone

3. **Test file upload:**
   - Upload a new contract through the app
   - It should upload successfully

## Troubleshooting

### Still getting "Bucket not found"?

1. **Check bucket name spelling:**
   - Must be exactly `creator-assets` (case-sensitive)
   - No spaces or special characters

2. **Check if bucket is public:**
   - Go to Storage → Buckets → creator-assets
   - Make sure "Public bucket" is enabled

3. **Check RLS policies:**
   - Go to Storage → Policies → creator-assets
   - Make sure policies are created and enabled

4. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache

### Getting permission errors?

- Make sure RLS policies are correctly set up
- Check that the user is authenticated
- Verify the file path structure matches: `{user_id}/brand_deals/...`

## File Path Structure

Files are stored with this structure:
```
creator-assets/
  └── {user_id}/
      ├── brand_deals/
      │   └── {brand_name}-contract-{timestamp}.pdf
      ├── expenses/
      │   └── {category}-{timestamp}.pdf
      └── brand_messages/
          └── {deal_id}/
              └── {filename}-{timestamp}.pdf
```

This structure ensures users can only access their own files through RLS policies.

