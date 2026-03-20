-- Migration to prevent duplicate deals from collab requests
-- Adds a unique reference from brand_deals back to collab_requests

ALTER TABLE public.brand_deals 
ADD COLUMN IF NOT EXISTS collab_request_id uuid REFERENCES public.collab_requests(id) ON DELETE SET NULL;

-- Create a unique index to prevent multiple deals for the same request
-- We only enforce uniqueness where collab_request_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_deals_unique_collab_request 
ON public.brand_deals(collab_request_id) 
WHERE collab_request_id IS NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.brand_deals.collab_request_id IS 'Reference to the collab_request that generated this deal. Used to prevent duplicate deal creation.';
