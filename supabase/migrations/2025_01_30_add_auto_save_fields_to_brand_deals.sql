-- Add fields for auto-save draft deals functionality
-- These fields track how deals were created and link them to analysis reports

-- Add deal_type field (paid or barter)
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS deal_type text DEFAULT 'paid';

-- Add created_via field (scanner, manual, import, etc.)
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS created_via text DEFAULT 'manual';

-- Add analysis_report_id to link deals to protection_reports
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS analysis_report_id uuid;

-- Add foreign key constraint for analysis_report_id (optional, can be null)
-- Note: We don't add a foreign key constraint because protection_reports might not always exist
-- But we can add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_deals_analysis_report_id 
ON public.brand_deals(analysis_report_id);

-- Add index for created_via for filtering
CREATE INDEX IF NOT EXISTS idx_brand_deals_created_via 
ON public.brand_deals(created_via);

-- Add index for deal_type for filtering
CREATE INDEX IF NOT EXISTS idx_brand_deals_deal_type 
ON public.brand_deals(deal_type);

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.deal_type IS 'Type of deal: paid (contract with payment) or barter (product exchange)';
COMMENT ON COLUMN public.brand_deals.created_via IS 'How the deal was created: scanner (auto-saved from contract analysis), manual (user created), import, etc.';
COMMENT ON COLUMN public.brand_deals.analysis_report_id IS 'Link to protection_reports table if deal was created from contract analysis';

