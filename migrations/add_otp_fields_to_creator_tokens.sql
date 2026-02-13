-- Add OTP fields to creator_signing_tokens table
-- Run this after the initial table creation

ALTER TABLE creator_signing_tokens
ADD COLUMN IF NOT EXISTS otp_hash TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN creator_signing_tokens.otp_hash IS 'SHA-256 hash of the OTP code';
COMMENT ON COLUMN creator_signing_tokens.otp_expires_at IS 'When the OTP expires (10 minutes from generation)';
COMMENT ON COLUMN creator_signing_tokens.otp_attempts IS 'Number of failed OTP verification attempts';
COMMENT ON COLUMN creator_signing_tokens.otp_verified IS 'Whether OTP has been successfully verified';
COMMENT ON COLUMN creator_signing_tokens.otp_verified_at IS 'When OTP was verified';
