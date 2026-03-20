-- Migration: Add creator OTP fields to brand_deals table
-- These fields are separate from brand OTP fields to allow independent OTP flows

-- Add creator OTP fields
ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS creator_otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS creator_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_otp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_otp_attempts INT DEFAULT 0;

-- Add indexes for creator OTP queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_creator_otp_hash ON public.brand_deals(creator_otp_hash) WHERE creator_otp_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_brand_deals_creator_otp_expires_at ON public.brand_deals(creator_otp_expires_at) WHERE creator_otp_expires_at IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.brand_deals.creator_otp_hash IS 'SHA256 hash of the OTP sent to creator for contract signing verification';
COMMENT ON COLUMN public.brand_deals.creator_otp_expires_at IS 'Timestamp when the creator OTP expires (typically 10 minutes after generation)';
COMMENT ON COLUMN public.brand_deals.creator_otp_verified IS 'Whether the creator OTP has been successfully verified';
COMMENT ON COLUMN public.brand_deals.creator_otp_verified_at IS 'Timestamp when creator OTP was verified';
COMMENT ON COLUMN public.brand_deals.creator_otp_attempts IS 'Number of failed creator OTP verification attempts';

