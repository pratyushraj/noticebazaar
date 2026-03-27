# 🚨 Quick Fix: Missing `creator_category` Column

## Error
```
Could not find the 'creator_category' column of 'profiles' in the schema cache
```

## ✅ Solution: Run This SQL

**Go to Supabase Dashboard → SQL Editor → New Query → Paste & Run:**

```sql
-- Add creator_category and all creator profile fields
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

-- Create index for referral code
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Generate referral codes for existing creators
UPDATE public.profiles
SET referral_code = 'NB-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 6))
WHERE role = 'creator' AND referral_code IS NULL;
```

## ✅ Verify It Worked

Run this to check:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'creator_category';
```

Should return 1 row if successful.

## 🔍 Check All Migrations

Use the verification script:

```bash
npm run verify-migrations
```

Or run the SQL query in `scripts/verify-migrations-sql.sql` in Supabase SQL Editor.

## 📝 What This Adds

- `creator_category` - Creator category (Fashion, Tech, etc.)
- `pricing_min/avg/max` - Pricing preferences  
- `bank_*` fields - Bank account details
- `gst_number`, `pan_number` - Tax info
- `referral_code` - Unique referral code
- Social follower counts (Instagram, YouTube, TikTok, Twitter, Facebook)

---

**After running:** Refresh your browser and the error should be gone! ✅

