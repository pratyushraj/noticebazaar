# Manual Setup: complaint-proofs Storage Bucket

Due to Supabase storage permissions, the bucket and policies need to be created manually via the Dashboard.

## Step 1: Create the Bucket

1. Go to **Supabase Dashboard** → **Storage** → **Buckets**
2. Click **New bucket**
3. **Bucket name**: `complaint-proofs` (exact name, case-sensitive)
4. **Public bucket**: ❌ Unchecked (private bucket)
5. **File size limit**: 5MB (5242880 bytes)
6. **Allowed MIME types**: 
   - `image/jpeg`
   - `image/png`
   - `image/jpg`
   - `application/pdf`
7. Click **Create bucket**

## Step 2: Create Storage Policies

Go to **Storage** → **Buckets** → **complaint-proofs** → **Policies** → **New Policy**

### Policy 1: Users can upload complaint proofs

- **Policy name**: `Users can upload complaint proofs`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**: (leave empty)
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'complaint-proofs' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy 2: Users can read their own complaint proofs

- **Policy name**: `Users can read their own complaint proofs`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'complaint-proofs' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- **WITH CHECK expression**: (leave empty)

### Policy 3: Lawyers can read all complaint proofs

- **Policy name**: `Lawyers can read all complaint proofs`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'complaint-proofs' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('lawyer', 'admin')
  )
  ```
- **WITH CHECK expression**: (leave empty)

## Verification

After creating the bucket and policies:

1. Try uploading a test file through the complaint form
2. Verify that:
   - Users can upload files to their own folder (`{user_id}/filename`)
   - Users can read their own files
   - Lawyers/admins can read all files

## Alternative: Use Supabase CLI

If you have Supabase CLI set up with proper permissions, you can also create the bucket via CLI:

```bash
supabase storage create-bucket complaint-proofs --private
```

Then create policies using the Supabase Management API or Dashboard.

