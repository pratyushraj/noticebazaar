-- This migration ensures all columns required by the application logic are present in the brand_deals table.

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS deal_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS contract_file_url text;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_email text;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS invoice_file_url text;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS utr_number text;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS payment_received_date date;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS contact_person text;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS platform text;

-- Ensure core fields are present (in case the initial table creation was skipped)
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS deliverables text NOT NULL DEFAULT '';

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS due_date date NOT NULL DEFAULT now();

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS payment_expected_date date NOT NULL DEFAULT now();