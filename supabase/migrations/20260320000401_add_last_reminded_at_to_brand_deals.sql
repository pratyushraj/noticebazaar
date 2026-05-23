-- Add last_reminded_at column to brand_deals table
-- This tracks when the last reminder was sent to the brand

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_last_reminded_at 
ON public.brand_deals(last_reminded_at);

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.last_reminded_at IS 'Timestamp when the last reminder was sent to the brand for contract revisions';

