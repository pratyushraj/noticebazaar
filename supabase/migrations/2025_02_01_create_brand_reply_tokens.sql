-- Create brand_reply_tokens table for secure, unguessable brand reply URLs
-- Uses UUID v4 (128-bit entropy) for cryptographically secure tokens

CREATE TABLE IF NOT EXISTS public.brand_reply_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at timestamp with time zone, -- NULL = no expiry (default)
    is_active boolean DEFAULT true NOT NULL,
    revoked_at timestamp with time zone, -- NULL = not revoked
    revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Indexes for fast lookups
    CONSTRAINT brand_reply_tokens_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    CONSTRAINT brand_reply_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create index on token ID for fast lookups (primary key already has index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_brand_reply_tokens_id ON public.brand_reply_tokens(id);
CREATE INDEX IF NOT EXISTS idx_brand_reply_tokens_deal_id ON public.brand_reply_tokens(deal_id);
CREATE INDEX IF NOT EXISTS idx_brand_reply_tokens_active ON public.brand_reply_tokens(is_active, expires_at) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.brand_reply_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can view tokens they created
CREATE POLICY "Creators can view their own brand reply tokens"
ON public.brand_reply_tokens FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Policy: Creators can create tokens for their deals
CREATE POLICY "Creators can create brand reply tokens"
ON public.brand_reply_tokens FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM public.brand_deals
        WHERE id = deal_id AND creator_id = auth.uid()
    )
);

-- Policy: Creators can revoke their own tokens
CREATE POLICY "Creators can revoke their own brand reply tokens"
ON public.brand_reply_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Add comment
COMMENT ON TABLE public.brand_reply_tokens IS 'Secure tokens for brand reply links. Uses UUID v4 for unguessable, non-sequential identifiers.';


