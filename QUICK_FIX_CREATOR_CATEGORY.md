# Quick Fix: Missing `creator_category` Column

## Error
```
Could not find the 'creator_category' column of 'profiles' in the schema cache
```

## Solution: Run the Migration

The `creator_category` column needs to be added to your `profiles` table. Run this migration:

### Option 1: Via Supabase Dashboard (Fastest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Add creator_category and other creator profile fields
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

6. Click **Run** (or press Cmd/Ctrl + Enter)

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

Or run the specific migration file:
```bash
supabase migration up 2025_11_21_add_creator_profile_fields
```

## Verify

After running the migration, verify the column exists:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `profiles` table
3. Check that `creator_category` column exists

## Temporary Workaround (If Migration Can't Run Now)

If you can't run the migration immediately, the code already handles missing columns gracefully in `SessionContext.tsx` by using fallback queries. However, you should run the migration as soon as possible to avoid errors.

## What This Migration Adds

- `creator_category` - Creator category (Fashion, Tech, Fitness, etc.)
- `pricing_min`, `pricing_avg`, `pricing_max` - Pricing preferences
- `bank_account_name`, `bank_account_number`, `bank_ifsc`, `bank_upi` - Bank details
- `gst_number`, `pan_number` - Tax information
- `referral_code` - Unique referral code
- Social media follower counts (Instagram, YouTube, TikTok, Twitter, Facebook)

