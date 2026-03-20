# Run Creator Profile Migration

The upgraded Creator Profile page requires new columns in the `profiles` table. Follow these steps:

## Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/migrations/2025_11_21_add_creator_profile_fields.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

## Option 2: Run via Supabase CLI

If you have Supabase CLI installed and linked to your project:

```bash
supabase db push
```

Or to run a specific migration:

```bash
supabase migration up
```

## Quick SQL Copy-Paste

Copy and paste this SQL directly into Supabase SQL Editor:

```sql
-- Add creator profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS creator_category TEXT,
ADD COLUMN IF NOT EXISTS pricing_min INTEGER,
ADD COLUMN IF NOT EXISTS pricing_avg INTEGER,
ADD COLUMN IF NOT EXISTS pricing_max INTEGER,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS bank_upi TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS instagram_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS youtube_subs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS twitter_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS facebook_followers INTEGER DEFAULT 0;

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Generate referral codes for existing creators without one
UPDATE public.profiles
SET referral_code = 'NB-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 6))
WHERE role = 'creator' AND referral_code IS NULL;
```

## Verify Migration

After running the migration, verify the columns were added:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `profiles` table
3. Check that it has the following new columns:
   - `creator_category` (text)
   - `pricing_min`, `pricing_avg`, `pricing_max` (integer)
   - `bank_account_name`, `bank_account_number`, `bank_ifsc`, `bank_upi` (text)
   - `gst_number`, `pan_number` (text)
   - `referral_code` (text, unique)
   - `instagram_followers`, `youtube_subs`, `tiktok_followers`, `twitter_followers`, `facebook_followers` (integer)

## Features Added

After running the migration, the Creator Profile page includes:

1. **Avatar Upload** - Upload profile pictures directly to Supabase Storage
2. **Profile Completion Meter** - Visual progress indicator
3. **Creator Category** - Select your content category
4. **Pricing Preferences** - Set min/avg/max rates
5. **Enhanced Social Accounts** - Sync follower counts with one click
6. **Bank Details** - Store payment information securely
7. **GST & PAN** - Tax compliance information
8. **Referral System** - Unique referral codes for creators

## Troubleshooting

If you see errors about missing columns:
- The migration hasn't been run yet
- Refresh your browser after running the migration
- Check the Supabase logs for any migration errors

