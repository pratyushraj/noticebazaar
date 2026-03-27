-- Add invoice_number column to brand_deals table
-- This stores the invoice number extracted from contract or auto-generated
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS invoice_number text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_deals_invoice_number ON public.brand_deals(invoice_number);

-- Add comment
COMMENT ON COLUMN public.brand_deals.invoice_number IS 'Invoice number extracted from contract or auto-generated in format INV-{year}-{short-id}-{random4}';

