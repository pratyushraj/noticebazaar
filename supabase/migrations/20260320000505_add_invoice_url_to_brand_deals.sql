-- Add invoice_url column to brand_deals table
-- This column stores the URL to auto-generated invoices after contract signing

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.invoice_url IS 'URL to auto-generated invoice PDF after contract signing via Leegality eSign';

