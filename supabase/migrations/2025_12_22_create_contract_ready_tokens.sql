-- Create contract_ready_tokens table for secure, unguessable contract ready URLs
-- Uses UUID v4 (128-bit entropy) for cryptographically secure tokens

-- Drop table if it exists (safe since this is a new feature with no data)
DROP TABLE IF EXISTS public.contract_ready_tokens CASCADE;

CREATE TABLE public.contract_ready_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at timestamp with time zone, -- NULL = no expiry (default)
    is_active boolean DEFAULT true NOT NULL,
    revoked_at timestamp with time zone, -- NULL = not revoked
    revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index on token ID for fast lookups (primary key already has index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_id ON public.contract_ready_tokens(id);
CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_deal_id ON public.contract_ready_tokens(deal_id);
CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_active ON public.contract_ready_tokens(is_active, expires_at) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.contract_ready_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can view tokens they created
CREATE POLICY "Creators can view their own contract ready tokens"
ON public.contract_ready_tokens FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Policy: Creators can create tokens for their deals
CREATE POLICY "Creators can create contract ready tokens"
ON public.contract_ready_tokens FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM public.brand_deals
        WHERE id = deal_id AND creator_id = auth.uid()
    )
);

-- Policy: Creators can revoke their own tokens
CREATE POLICY "Creators can revoke their own contract ready tokens"
ON public.contract_ready_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Policy: Public access for token validation (for brand to view contract ready page)
CREATE POLICY "Public can view active contract ready tokens"
ON public.contract_ready_tokens FOR SELECT
TO anon
USING (
    is_active = true AND
    revoked_at IS NULL AND
    (expires_at IS NULL OR expires_at > now())
);

-- Add comment
COMMENT ON TABLE public.contract_ready_tokens IS 'Secure tokens for contract ready links. Uses UUID v4 for unguessable, non-sequential identifiers.';

