-- Add brand_email column
ALTER TABLE public.brand_deals
ADD COLUMN brand_email text;

-- Add invoice_file_url column
ALTER TABLE public.brand_deals
ADD COLUMN invoice_file_url text;

-- Add utr_number column
ALTER TABLE public.brand_deals
ADD COLUMN utr_number text;

-- Add payment_received_date column
ALTER TABLE public.brand_deals
ADD COLUMN payment_received_date date;

-- Note: Ensure RLS policies on brand_deals allow creators to INSERT/UPDATE these new columns.