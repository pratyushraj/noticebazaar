# Simple Storage Policy for Service Role

Since the bucket is already PUBLIC, but RLS is still blocking service_role uploads, create this simpler policy:

## Policy: Allow Service Role to Upload Anywhere

1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. Select the **`creator-assets`** bucket
3. Click **"New Policy"**
4. Fill in:
   - **Policy Name**: `Service role can upload anywhere`
   - **Allowed Operations**: `INSERT`
   - **Target Roles**: `service_role`
   - **Policy Definition (WITH CHECK)**: 
     ```sql
     bucket_id = 'creator-assets'
     ```
     (This allows service_role to upload to ANY path in the bucket)

5. Click **"Save"**

This is simpler and should work immediately. The service role will be able to upload to any path in the `creator-assets` bucket, including `protection-reports/`.

## Why This Works

- The bucket is already PUBLIC for reads
- Service role should bypass RLS, but Storage policies can still block it
- This policy explicitly allows service_role to insert (upload) anywhere in the bucket
- No folder path matching needed - simpler and more reliable

