# OTP Fix Instructions - CRITICAL ⚠️

The application is returning a **500 Error** because your database is missing critical columns used by the OTP system. My attempts to bypass this in code failed due to database constraints, so you **MUST running the following SQL** to fix it.

## Step 1: Fix Creator Link Error (Urgent) 🚨
Your `creator_signing_tokens` table is missing `creator_otp_attempts` and `updated_at`.

**Run this in Supabase SQL Editor:**
```sql
ALTER TABLE public.creator_signing_tokens
ADD COLUMN IF NOT EXISTS creator_otp_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
```

✅ **After running this, your link `/creator-sign/...` will work perfectly.**

---

## Step 2: Enable Brand Signing (Required for next steps) ⚠️
Your `contract_ready_tokens` table is missing all OTP columns.

**Run this in Supabase SQL Editor:**
```sql
ALTER TABLE public.contract_ready_tokens
ADD COLUMN IF NOT EXISTS otp_hash text,
ADD COLUMN IF NOT EXISTS otp_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_valid boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_otp_hash 
ON public.contract_ready_tokens(otp_hash) 
WHERE otp_hash IS NOT NULL;
```

---

## Verification
1. Run Step 1 SQL.
2. Try your link again: `https://creatorarmour.com/creator-sign/...`
3. It should work!
