-- Migration: Ensure otp_attempts column exists in brand_deals
-- This migration ensures the otp_attempts column exists even if the previous migration wasn't fully applied

ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.otp_attempts IS 'Number of failed OTP verification attempts (used for brute force protection)';

