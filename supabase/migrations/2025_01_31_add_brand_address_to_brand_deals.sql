-- Add brand_address column to brand_deals table for contract generation
-- This field is required for generating legal contracts

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_address text;

COMMENT ON COLUMN public.brand_deals.brand_address IS 'Brand registered address - required for generating legal contracts';






