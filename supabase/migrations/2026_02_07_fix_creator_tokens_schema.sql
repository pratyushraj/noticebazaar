-- Add missing columns to creator_signing_tokens to fix 500 error
-- Your database is missing these standard columns, causing the API to fail.

ALTER TABLE public.creator_signing_tokens
ADD COLUMN IF NOT EXISTS creator_otp_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_updated_at 
ON public.creator_signing_tokens(updated_at);

-- Optional: Ensure trigger for updated_at exists if you use it globally
-- (Skipping trigger creation to avoid complexity, default value handles insert)
