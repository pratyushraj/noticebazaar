-- Creator Signing Tokens Table
-- Similar to contract_ready_tokens but for creator signing flow
-- Ensures creators can sign without login via secure magic link

CREATE TABLE IF NOT EXISTS creator_signing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES brand_deals(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_token ON creator_signing_tokens(token) WHERE is_valid = true;
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_deal ON creator_signing_tokens(deal_id);
CREATE INDEX IF NOT EXISTS idx_creator_signing_tokens_creator ON creator_signing_tokens(creator_id);

-- RLS Policies (if needed)
ALTER TABLE creator_signing_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read for token validation (service will verify)
CREATE POLICY "Allow public token lookup" ON creator_signing_tokens
  FOR SELECT USING (true);

COMMENT ON TABLE creator_signing_tokens IS 'Magic link tokens for creator contract signing without login';
COMMENT ON COLUMN creator_signing_tokens.token IS 'Unique token used in magic link URL';
COMMENT ON COLUMN creator_signing_tokens.used_at IS 'Timestamp when creator signed using this token';
COMMENT ON COLUMN creator_signing_tokens.is_valid IS 'False if token has been invalidated or superseded';
