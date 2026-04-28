-- Migration: Add profile OTP fields for onboarding verification
-- These fields allow creators to verify their identity and legal address during onboarding

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS profile_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_otp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_otp_attempts INT DEFAULT 0;

-- Comments
COMMENT ON COLUMN public.profiles.profile_otp_hash IS 'SHA256 hash of the OTP sent to creator for profile/onboarding verification';
COMMENT ON COLUMN public.profiles.profile_otp_expires_at IS 'Timestamp when the profile OTP expires';
COMMENT ON COLUMN public.profiles.profile_otp_verified IS 'Whether the profile has been successfully verified via OTP';
COMMENT ON COLUMN public.profiles.profile_otp_verified_at IS 'Timestamp when profile OTP was verified';
COMMENT ON COLUMN public.profiles.profile_otp_attempts IS 'Number of failed profile OTP verification attempts';
