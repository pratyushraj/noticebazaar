-- Add brand response tracking fields to brand_deals table
-- This allows brands to respond to contract change requests without logging in

-- Create ENUM type for brand response status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brand_response_status') THEN
        CREATE TYPE brand_response_status AS ENUM ('pending', 'accepted', 'negotiating', 'rejected');
    END IF;
END $$;

-- Add brand response fields
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_response_status brand_response_status DEFAULT 'pending';

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_response_message TEXT;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_response_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_response_ip TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_response_status 
ON public.brand_deals(brand_response_status);

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.brand_response_status IS 'Status of brand response to contract change requests: pending, accepted, negotiating, or rejected';
COMMENT ON COLUMN public.brand_deals.brand_response_message IS 'Optional message from brand when responding';
COMMENT ON COLUMN public.brand_deals.brand_response_at IS 'Timestamp when brand submitted their response';
COMMENT ON COLUMN public.brand_deals.brand_response_ip IS 'IP address of the brand when they submitted their response';

