-- Add brand/company address to collab_requests for contract generation
-- Required by contract generator (validateRequiredContractFields) when creator accepts

ALTER TABLE public.collab_requests
ADD COLUMN IF NOT EXISTS brand_address text;

COMMENT ON COLUMN public.collab_requests.brand_address IS 'Full registered address of brand/company; required for generating contract when creator accepts';

-- Optional GSTIN for invoicing and contract (15-digit)
ALTER TABLE public.collab_requests
ADD COLUMN IF NOT EXISTS brand_gstin text;

COMMENT ON COLUMN public.collab_requests.brand_gstin IS 'Optional 15-digit GSTIN of brand/company for contract and invoicing';
