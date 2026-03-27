# Quick Fix: Create Storage Bucket

## The Problem
You're seeing "Bucket not found" (404) errors when trying to view contract files.

## Quick Solution (Choose One)

### Option 1: Run SQL Migration (Fastest)

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and paste the contents of `supabase/migrations/2025_12_01_create_creator_assets_bucket.sql`
3. Click **Run**
4. Done! ✅

### Option 2: Manual Creation (5 minutes)

1. Go to **Supabase Dashboard → Storage → Buckets**
2. Click **New bucket**
3. Name: `creator-assets`
4. ✅ Check **Public bucket**
5. Click **Create**
6. Go to **Storage → Policies → creator-assets**
7. Create these 5 policies (see `STORAGE_BUCKET_CREATION_GUIDE.md` for SQL)

### Option 3: Supabase CLI

```bash
# If you have Supabase CLI
supabase db execute < supabase/migrations/2025_12_01_create_creator_assets_bucket.sql
```

## Verify It Works

1. Try viewing a contract file in your app
2. The error should be gone! 🎉

## Need More Help?

See `STORAGE_BUCKET_CREATION_GUIDE.md` for detailed instructions and troubleshooting.

