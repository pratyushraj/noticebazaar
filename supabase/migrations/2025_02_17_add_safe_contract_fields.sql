-- Add fields for brand-safe contract generation and signing handoff
-- These fields track the final contract version and signing status

-- Add safe_contract_url to store the generated brand-safe contract PDF
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS safe_contract_url text;

-- Add contract_version to track which version is current
-- Values: 'original', 'safe_final', 'signed'
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS contract_version text DEFAULT 'original';

-- Add index for contract_version for filtering
CREATE INDEX IF NOT EXISTS idx_brand_deals_contract_version 
ON public.brand_deals(contract_version) WHERE contract_version IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.brand_deals.safe_contract_url IS 'URL to the generated brand-safe contract PDF (final version with accepted clarifications)';
COMMENT ON COLUMN public.brand_deals.contract_version IS 'Current contract version: original, safe_final, or signed';

