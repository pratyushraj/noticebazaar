-- FINAL FIX: Add ALL missing OTP columns to creator_signing_tokens
-- Run this in Supabase SQL Editor

ALTER TABLE public.creator_signing_tokens
ADD COLUMN IF NOT EXISTS creator_otp_hash text,
ADD COLUMN IF NOT EXISTS creator_otp_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS creator_otp_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_otp_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add index
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_otp_hash 
ON public.creator_signing_tokens(creator_otp_hash) 
WHERE creator_otp_hash IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'creator_signing_tokens' 
AND column_name LIKE '%otp%' OR column_name = 'updated_at'
ORDER BY column_name;
