# Storage Bucket Configuration

## Issue
If you're getting "Bucket not found" errors when viewing contract files, your Supabase bucket name doesn't match the hardcoded value in the code.

## Solution

### Step 1: Find Your Actual Bucket Name

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** → **Buckets**
3. Find the bucket that contains your contract files
4. Copy the exact bucket name (e.g., `creator-assets-prod`, `creator_uploads`, etc.)

### Step 2: Update the Bucket Name

You have two options:

#### Option A: Environment Variable (Recommended)

Add this to your `.env` file (or `.env.local`):

```env
VITE_CREATOR_ASSETS_BUCKET=your-actual-bucket-name
```

Replace `your-actual-bucket-name` with the actual bucket name from Step 1.

#### Option B: Direct Code Update

Edit `src/lib/constants/storage.ts` and change:

```typescript
export const CREATOR_ASSETS_BUCKET = import.meta.env.VITE_CREATOR_ASSETS_BUCKET || 'creator-assets';
```

To:

```typescript
export const CREATOR_ASSETS_BUCKET = import.meta.env.VITE_CREATOR_ASSETS_BUCKET || 'your-actual-bucket-name';
```

Replace `your-actual-bucket-name` with your actual bucket name.

### Step 3: Restart Your Dev Server

After making changes, restart your development server:

```bash
npm run dev
```

## Verification

1. Upload a new contract file through the app
2. Click "View" on the contract
3. The file should open without "Bucket not found" errors

## Notes

- The bucket name is case-sensitive
- Make sure the bucket has public access enabled (or proper RLS policies)
- All references to `creator-assets` in the codebase now use the `CREATOR_ASSETS_BUCKET` constant

