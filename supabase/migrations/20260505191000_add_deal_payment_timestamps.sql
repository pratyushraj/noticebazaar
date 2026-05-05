-- Add payment tracking timestamps to brand_deals
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS payment_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_received_at timestamptz;

COMMENT ON COLUMN public.brand_deals.payment_sent_at IS 'When the brand marked payment as sent';
COMMENT ON COLUMN public.brand_deals.payment_received_at IS 'When the creator confirmed receipt of payment';
