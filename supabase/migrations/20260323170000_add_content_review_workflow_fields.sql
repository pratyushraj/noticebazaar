-- Add fields to support a structured content delivery + review workflow on brand_deals
-- Date: 2026-03-23

ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS content_caption TEXT,
  ADD COLUMN IF NOT EXISTS content_drive_link TEXT,
  ADD COLUMN IF NOT EXISTS content_notes TEXT,
  ADD COLUMN IF NOT EXISTS content_delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revision_submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS content_approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS content_revision_number INTEGER DEFAULT 0;

COMMENT ON COLUMN public.brand_deals.content_caption IS 'Optional caption text submitted by creator along with content_url';
COMMENT ON COLUMN public.brand_deals.content_drive_link IS 'Optional drive/dropbox link for raw files submitted by creator';
COMMENT ON COLUMN public.brand_deals.content_notes IS 'Optional notes from creator to brand for review context';
COMMENT ON COLUMN public.brand_deals.content_delivered_at IS 'When content was delivered for review (alias of content_submitted_at for newer workflows)';
COMMENT ON COLUMN public.brand_deals.revision_requested_at IS 'When the brand requested a revision';
COMMENT ON COLUMN public.brand_deals.revision_submitted_at IS 'When the creator submitted a revision';
COMMENT ON COLUMN public.brand_deals.content_approved_at IS 'When the brand approved the content (alias of brand_approved_at for newer workflows)';
COMMENT ON COLUMN public.brand_deals.payment_released_at IS 'When payment was released by the brand';
COMMENT ON COLUMN public.brand_deals.content_revision_number IS 'Current revision number; 0=initial submission, 1+=revision rounds';

