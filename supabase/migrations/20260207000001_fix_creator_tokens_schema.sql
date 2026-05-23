-- Migration to create and fix creator_signing_tokens table

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.creator_signing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_email TEXT NOT NULL,
  
  -- Security
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > created_at),
  CONSTRAINT one_active_token_per_deal UNIQUE (deal_id, is_valid)
);

-- 2. Add OTP columns if not exists
ALTER TABLE public.creator_signing_tokens
ADD COLUMN IF NOT EXISTS creator_otp_hash text,
ADD COLUMN IF NOT EXISTS creator_otp_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS creator_otp_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_otp_verified_at timestamp with time zone;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_token ON public.creator_signing_tokens(token) WHERE is_valid = true;
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_deal ON public.creator_signing_tokens(deal_id);
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_creator ON public.creator_signing_tokens(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_updated_at ON public.creator_signing_tokens(updated_at);

-- 4. Enable Row Level Security
ALTER TABLE public.creator_signing_tokens ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Allow public token lookup" ON public.creator_signing_tokens;
CREATE POLICY "Allow public token lookup" ON public.creator_signing_tokens
  FOR SELECT USING (true);

-- 6. Add comment
COMMENT ON TABLE public.creator_signing_tokens IS 'Magic link tokens for creator contract signing without login';

