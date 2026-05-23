-- Add OTP columns to contract_ready_tokens table (idempotent - table may be created later)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contract_ready_tokens') THEN
    ALTER TABLE public.contract_ready_tokens
    ADD COLUMN IF NOT EXISTS otp_hash text,
    ADD COLUMN IF NOT EXISTS otp_expires_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS otp_attempts integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS otp_verified_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

    CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_otp_hash ON public.contract_ready_tokens(otp_hash) WHERE otp_hash IS NOT NULL;
  ELSE
    RAISE NOTICE 'Table contract_ready_tokens does not exist yet, skipping OTP columns';
  END IF;
END $$;

