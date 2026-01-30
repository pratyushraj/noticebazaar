-- Add optional barter product image URL to collab_requests
-- Only relevant when collab_type is 'barter' or 'both'

ALTER TABLE public.collab_requests
ADD COLUMN IF NOT EXISTS barter_product_image_url text;

COMMENT ON COLUMN public.collab_requests.barter_product_image_url IS 'Optional public URL of product image for barter collaborations';
