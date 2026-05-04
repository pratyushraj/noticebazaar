-- Migration: Add OTP fields to collab_requests for secure acceptance signing
-- This allows creators to verify their identity via OTP before a deal is officially created

ALTER TABLE public.collab_requests
  ADD COLUMN IF NOT EXISTS creator_otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS creator_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_otp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_otp_attempts INT DEFAULT 0;

-- Also add to brand_deals where the data is copied upon acceptance
ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS creator_otp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_otp_verified_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN public.collab_requests.creator_otp_hash IS 'SHA256 hash of the OTP sent to creator for acceptance verification';
COMMENT ON COLUMN public.collab_requests.creator_otp_expires_at IS 'Timestamp when the acceptance OTP expires';
COMMENT ON COLUMN public.collab_requests.creator_otp_verified IS 'Whether the acceptance has been successfully verified via OTP';
COMMENT ON COLUMN public.collab_requests.creator_otp_verified_at IS 'Timestamp when acceptance OTP was verified';
COMMENT ON COLUMN public.collab_requests.creator_otp_attempts IS 'Number of failed acceptance OTP verification attempts';

COMMENT ON COLUMN public.brand_deals.creator_otp_verified IS 'Whether the creator verified their identity via OTP during acceptance';
COMMENT ON COLUMN public.brand_deals.creator_otp_verified_at IS 'Timestamp when creator acceptance OTP was verified';
