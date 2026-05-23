-- Add proof_of_payment_url column to brand_deals table
-- This column stores the URL to proof of payment files (receipts, screenshots, etc.)

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS proof_of_payment_url text;

COMMENT ON COLUMN public.brand_deals.proof_of_payment_url IS 'URL to proof of payment file (receipt, screenshot, etc.)';

