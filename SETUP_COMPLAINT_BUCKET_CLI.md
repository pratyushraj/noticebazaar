# Setup Complaint Proofs Bucket via CLI

## Quick Start

Run the setup script:

```bash
pnpm run setup-complaint-bucket
```

Or directly:

```bash
tsx scripts/setup-complaint-proofs-bucket.ts
```

## Prerequisites

Make sure you have these environment variables set in `.env.local` or `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## What It Does

1. **Creates the bucket** `complaint-proofs`:
   - Private bucket (not public)
   - 5MB file size limit
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/jpg`, `application/pdf`

2. **Creates storage policies**:
   - Users can upload their own complaint proofs
   - Users can read their own complaint proofs
   - Lawyers/admins can read all complaint proofs

## Alternative: Manual Setup

If the CLI script doesn't work (due to permissions), follow the manual guide:

See: `CREATE_COMPLAINT_PROOFS_BUCKET_MANUAL.md`

## Troubleshooting

### Error: "exec_sql function does not exist"

The script will fall back to manual instructions. Create the bucket and policies via Supabase Dashboard instead.

### Error: "Bucket already exists"

This is fine! The script will skip bucket creation and continue with policies.

### Policies not created

If policies fail to create, you can create them manually:

1. Go to **Supabase Dashboard** → **Storage** → **Buckets** → **complaint-proofs** → **Policies**
2. Create each policy using the SQL expressions shown in the script output

## Verification

After running the script:

1. Check bucket exists: **Storage** → **Buckets** → `complaint-proofs`
2. Check policies: **Storage** → **Buckets** → **complaint-proofs** → **Policies** (should see 3 policies)
3. Test upload: Try uploading a file through the complaint form

