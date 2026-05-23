ALTER TABLE IF EXISTS public.collab_requests ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.unclaimed_collab_requests ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.collab_request_leads ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;

