ALTER TABLE public.brand_deals
ADD COLUMN brand_email text NULL,
ADD COLUMN invoice_file_url text NULL,
ADD COLUMN utr_number text NULL,
ADD COLUMN payment_received_date date NULL;