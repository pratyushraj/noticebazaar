-- Delivery details for barter deals (collected after acceptance only)
-- Do NOT add to collab_requests; address/phone never asked during request submission

ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS delivery_name text,
  ADD COLUMN IF NOT EXISTS delivery_phone text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS delivery_notes text;

COMMENT ON COLUMN public.brand_deals.delivery_name IS 'Full name for product delivery (barter deals only)';
COMMENT ON COLUMN public.brand_deals.delivery_phone IS 'Phone for delivery (barter only); mask in public PDFs';
COMMENT ON COLUMN public.brand_deals.delivery_address IS 'Delivery address (barter only)';
COMMENT ON COLUMN public.brand_deals.delivery_notes IS 'Optional delivery notes (barter only)';
