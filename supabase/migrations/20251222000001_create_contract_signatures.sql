-- Create contract_signatures table for legally valid click-to-accept signing
-- Stores complete audit trail with IP, device info, timestamps, and contract snapshots

-- Create enum for signer role
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signer_role_enum') THEN
        CREATE TYPE signer_role_enum AS ENUM ('brand', 'creator');
    END IF;
END $$;

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS public.contract_signatures CASCADE;

CREATE TABLE public.contract_signatures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    signer_role signer_role_enum NOT NULL,
    signer_name text NOT NULL,
    signer_email text NOT NULL,
    signer_phone text,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    device_info jsonb,
    otp_verified boolean DEFAULT false NOT NULL,
    otp_verified_at timestamp with time zone,
    signed boolean DEFAULT false NOT NULL,
    signed_at timestamp with time zone,
    contract_version_id text,
    contract_snapshot_html text, -- Store exact contract HTML at signing time
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraint: One signature per (deal_id + signer_role)
    CONSTRAINT contract_signatures_deal_role_unique UNIQUE (deal_id, signer_role)
);

-- Create indexes for fast lookups
CREATE INDEX idx_contract_signatures_deal_id ON public.contract_signatures(deal_id);
CREATE INDEX idx_contract_signatures_signer_role ON public.contract_signatures(signer_role);
CREATE INDEX idx_contract_signatures_signed ON public.contract_signatures(signed);
CREATE INDEX idx_contract_signatures_signed_at ON public.contract_signatures(signed_at);

-- Enable Row Level Security
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can view signatures for their deals
CREATE POLICY "Creators can view signatures for their deals"
ON public.contract_signatures FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.brand_deals
        WHERE id = deal_id AND creator_id = auth.uid()
    )
);

-- Policy: Brands can view their own signatures (via contract ready token)
-- This will be handled by the backend validating the token
-- For now, we allow public read access to signed signatures (they're already public info)
CREATE POLICY "Public can view signed signatures"
ON public.contract_signatures FOR SELECT
TO anon
USING (signed = true);

-- Policy: System can insert signatures (handled via backend)
-- Backend will use service role for inserts

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contract_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_signatures_updated_at
    BEFORE UPDATE ON public.contract_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_signatures_updated_at();

-- Add trigger to update deal status when brand signs
CREATE OR REPLACE FUNCTION update_deal_on_brand_signature()
RETURNS TRIGGER AS $$
BEGIN
    -- If brand signs, update deal status to accepted_verified
    IF NEW.signer_role = 'brand' AND NEW.signed = true AND OLD.signed = false THEN
        UPDATE public.brand_deals
        SET 
            status = 'accepted_verified',
            brand_response_status = 'accepted_verified',
            updated_at = now()
        WHERE id = NEW.deal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_signatures_update_deal_status
    AFTER UPDATE OF signed ON public.contract_signatures
    FOR EACH ROW
    WHEN (NEW.signed = true AND OLD.signed = false)
    EXECUTE FUNCTION update_deal_on_brand_signature();

-- Add comment
COMMENT ON TABLE public.contract_signatures IS 'Legally valid contract signatures with complete audit trail including IP, device info, timestamps, and contract snapshots';


