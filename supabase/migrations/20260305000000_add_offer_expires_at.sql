ALTER TABLE collab_requests ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;
ALTER TABLE unclaimed_collab_requests ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;
ALTER TABLE collab_request_leads ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;
