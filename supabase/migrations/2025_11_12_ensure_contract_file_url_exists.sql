-- This migration ensures all columns required by the application logic are present in the brand_deals table.

-- Ensure core fields are present and NOT NULL constraints are met (if they weren't in the initial migration)
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_name text NOT NULL DEFAULT 'Untitled Deal';

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS deal_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS deliverables text NOT NULL DEFAULT '';

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS due_date date NOT NULL DEFAULT now();

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS payment_expected_date date NOT NULL DEFAULT now();

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Drafting'; -- Explicit default for status

-- Ensure optional fields are present
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