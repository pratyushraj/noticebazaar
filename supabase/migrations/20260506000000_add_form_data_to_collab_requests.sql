-- Add form_data and brand_pincode to collab_requests for geographical transparency
-- brand_pincode: the 6-digit PIN the brand entered when submitting the offer
-- form_data: full original submission snapshot (contains brandPincode, collabType, etc.)

ALTER TABLE public.collab_requests
ADD COLUMN IF NOT EXISTS form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS brand_pincode TEXT;

ALTER TABLE public.collab_request_leads
ADD COLUMN IF NOT EXISTS form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS brand_pincode TEXT;

COMMENT ON COLUMN public.collab_requests.form_data IS 'Original form submission data preserved for historical accuracy and geographical transparency';
COMMENT ON COLUMN public.collab_requests.brand_pincode IS '6-digit pincode of brand for geographical transparency';
COMMENT ON COLUMN public.collab_request_leads.form_data IS 'Original form submission data preserved for lead capture historical accuracy';
COMMENT ON COLUMN public.collab_request_leads.brand_pincode IS '6-digit pincode of brand for geographical transparency';
