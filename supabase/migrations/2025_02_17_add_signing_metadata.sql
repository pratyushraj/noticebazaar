-- Add optional signing metadata fields for audit trail
-- These fields help with disputes, audits, and professional invoices
-- Still zero legal obligation - purely organizational

-- Add signed_at timestamp (when creator confirms signed contract received)
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Add signed_via field to track which signing method was used
-- Values: 'leegality', 'docusign', 'email', or null
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS signed_via text;

-- Add index for signed_via for filtering
CREATE INDEX IF NOT EXISTS idx_brand_deals_signed_via 
ON public.brand_deals(signed_via) WHERE signed_via IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.brand_deals.signed_at IS 'Timestamp when creator confirmed signed contract received (organizational only, not legal validation)';
COMMENT ON COLUMN public.brand_deals.signed_via IS 'Signing method used: leegality, docusign, email, or null';

