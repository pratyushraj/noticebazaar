-- Add OTP columns to contract_ready_tokens table
-- This allows brand signing to use OTP verification similar to creator signing

ALTER TABLE public.contract_ready_tokens
ADD COLUMN IF NOT EXISTS otp_hash text,
ADD COLUMN IF NOT EXISTS otp_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS otp_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_otp_hash ON public.contract_ready_tokens(otp_hash) WHERE otp_hash IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.contract_ready_tokens.otp_hash IS 'SHA-256 hash of the OTP for brand signing verification';
COMMENT ON COLUMN public.contract_ready_tokens.otp_expires_at IS 'Expiration timestamp for the OTP (typically 10 minutes from generation)';
COMMENT ON COLUMN public.contract_ready_tokens.otp_attempts IS 'Number of failed OTP verification attempts (max 5)';
COMMENT ON COLUMN public.contract_ready_tokens.otp_verified IS 'Whether the brand has verified their identity via OTP';
COMMENT ON COLUMN public.contract_ready_tokens.otp_verified_at IS 'Timestamp when OTP was successfully verified';
