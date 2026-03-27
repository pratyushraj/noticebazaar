-- Add structured link-based content delivery payload + dispute tracking on brand_deals
-- Date: 2026-03-24

ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS content_links JSONB,
  ADD COLUMN IF NOT EXISTS content_delivery_status TEXT,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dispute_notes TEXT;

COMMENT ON COLUMN public.brand_deals.content_links IS 'JSON array of submitted content links (includes main link and any additional links).';
COMMENT ON COLUMN public.brand_deals.content_delivery_status IS 'Creator-declared delivery type: draft|posted.';
COMMENT ON COLUMN public.brand_deals.disputed_at IS 'When the brand raised a dispute for this deal.';
COMMENT ON COLUMN public.brand_deals.dispute_notes IS 'Optional brand dispute notes/context.';

