# Storage Policy Setup Instructions

## Problem
The `storage.objects` table is a system table in Supabase and cannot be modified via SQL migrations. Storage policies must be created through the Supabase Dashboard.

## Solution

### Option 1: Create Policies via Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Storage Policies**
   - Go to: **Storage** > **Policies**
   - Select the **`creator-assets`** bucket

3. **Create Policy 1: Service Role Upload**
   - Click **"New Policy"** or **"Add Policy"**
   - **Policy Name**: `Service role can upload to protection-reports`
   - **Allowed Operations**: `INSERT`
   - **Target Roles**: `service_role`
   - **Policy Definition (USING)**: 
     ```sql
     bucket_id = 'creator-assets' AND (storage.foldername(name))[1] = 'protection-reports'
     ```
   - **Policy Definition (WITH CHECK)**: 
     ```sql
     bucket_id = 'creator-assets' AND (storage.foldername(name))[1] = 'protection-reports'
     ```
   - Click **"Save"**

4. **Create Policy 2: Service Role Download**
   - Click **"New Policy"**
   - **Policy Name**: `Service role can download from protection-reports`
   - **Allowed Operations**: `SELECT`
   - **Target Roles**: `service_role`
   - **Policy Definition (USING)**: 
     ```sql
     bucket_id = 'creator-assets' AND (storage.foldername(name))[1] = 'protection-reports'
     ```
   - Click **"Save"**

5. **Create Policy 3: Users Read Own Reports** (Optional)
   - Click **"New Policy"**
   - **Policy Name**: `Users can read their own protection reports`
   - **Allowed Operations**: `SELECT`
   - **Target Roles**: `authenticated`
   - **Policy Definition (USING)**: 
     ```sql
     bucket_id = 'creator-assets' AND 
     (storage.foldername(name))[1] = 'protection-reports' AND
     (storage.foldername(name))[2] = auth.uid()::text
     ```
   - Click **"Save"**

### Option 2: Make Bucket Public (Not Recommended)

If policies don't work, you can make the bucket public:

1. Go to **Storage** > **Settings**
2. Find **`creator-assets`** bucket
3. Toggle **"Public bucket"** to **ON**

⚠️ **WARNING**: This makes ALL files in the bucket publicly accessible. Only use this if you're okay with that security trade-off.

### Option 3: Use REST API (Already Implemented)

The code already includes a REST API fallback that uses the service role key directly. This should work even without storage policies, as it bypasses RLS by using the service role key in the Authorization header.

## Verification

After setting up policies, test by:

1. Upload a contract for analysis
2. Click **"Download Safe Version"** button
3. Check server logs for:
   - `✅ File uploaded successfully via REST API` (if policies aren't set up)
   - `✅ File uploaded successfully` (if policies are working)

## Troubleshooting

If you're still getting RLS errors:

1. **Verify Service Role Key**:
   - Check `server/.env` has `SUPABASE_SERVICE_ROLE_KEY` set
   - Server should log: `✅ Supabase client initialized with service role key`

2. **Check Bucket Exists**:
   - Go to **Storage** > **Buckets**
   - Verify **`creator-assets`** bucket exists

3. **Check Policy Syntax**:
   - Make sure policy definitions use exact syntax shown above
   - The `storage.foldername(name)[1]` extracts the first folder name from the path

4. **Test REST API Fallback**:
   - The REST API method should work regardless of policies
   - Check server logs to see which method succeeded

## Related Files

- `server/src/services/safeContractGenerator.ts` - Contains upload logic with REST API fallback
- `server/src/index.ts` - Supabase client initialization
- `server/database/migrations/storage_policy_service_role.sql` - Contains policy definitions (for reference only)

