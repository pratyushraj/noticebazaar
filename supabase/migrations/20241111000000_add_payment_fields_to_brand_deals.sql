-- Add payment fields to brand_deals (idempotent)
ALTER TABLE public.brand_deals ADD COLUMN IF NOT EXISTS brand_email text;
ALTER TABLE public.brand_deals ADD COLUMN IF NOT EXISTS invoice_file_url text;
ALTER TABLE public.brand_deals ADD COLUMN IF NOT EXISTS utr_number text;
ALTER TABLE public.brand_deals ADD COLUMN IF NOT EXISTS payment_received_date date;