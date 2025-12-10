-- Add Leegality eSign integration fields to brand_deals table

-- Create ENUM type for eSign status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'esign_status') THEN
        CREATE TYPE esign_status AS ENUM ('pending', 'sent', 'signed', 'failed');
    END IF;
END $$;

-- Add eSign fields
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS esign_provider TEXT DEFAULT 'leegality';

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS esign_document_id TEXT;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS esign_status esign_status DEFAULT 'pending';

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS esign_url TEXT;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_esign_status 
ON public.brand_deals(esign_status);

CREATE INDEX IF NOT EXISTS idx_brand_deals_esign_document_id 
ON public.brand_deals(esign_document_id);

-- Add comments for documentation
COMMENT ON COLUMN public.brand_deals.esign_provider IS 'eSign provider name (e.g., leegality)';
COMMENT ON COLUMN public.brand_deals.esign_document_id IS 'Document ID from eSign provider';
COMMENT ON COLUMN public.brand_deals.esign_status IS 'Current eSign status: pending, sent, signed, or failed';
COMMENT ON COLUMN public.brand_deals.esign_url IS 'URL for signing the document';
COMMENT ON COLUMN public.brand_deals.signed_pdf_url IS 'URL of the signed PDF after completion';
COMMENT ON COLUMN public.brand_deals.signed_at IS 'Timestamp when document was fully signed';

