-- Add brand_domain and brand_logo_url columns to brand_deals table
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_domain text;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_logo_url text;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_brand_domain ON public.brand_deals(brand_domain);

