-- Add brand_phone column to brand_deals table
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.brand_phone IS 'Brand contact phone number for WhatsApp reminders and eSign';

