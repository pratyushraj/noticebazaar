-- Preserve structured package/custom-offer choices submitted from public collab links.
ALTER TABLE public.collab_requests
  ADD COLUMN IF NOT EXISTS selected_package_id text,
  ADD COLUMN IF NOT EXISTS selected_package_label text,
  ADD COLUMN IF NOT EXISTS selected_package_type text,
  ADD COLUMN IF NOT EXISTS selected_addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_quantity text,
  ADD COLUMN IF NOT EXISTS content_duration text,
  ADD COLUMN IF NOT EXISTS content_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS barter_types jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.collab_request_leads
  ADD COLUMN IF NOT EXISTS selected_package_id text,
  ADD COLUMN IF NOT EXISTS selected_package_label text,
  ADD COLUMN IF NOT EXISTS selected_package_type text,
  ADD COLUMN IF NOT EXISTS selected_addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_quantity text,
  ADD COLUMN IF NOT EXISTS content_duration text,
  ADD COLUMN IF NOT EXISTS content_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS barter_types jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.collab_requests.selected_package_label IS 'Creator package/service label selected by the brand from the public collab link';
COMMENT ON COLUMN public.collab_requests.content_requirements IS 'Structured content requirements selected by brand, e.g. hook, voiceover, CTA, tagging';
COMMENT ON COLUMN public.collab_requests.barter_types IS 'Structured barter value types selected by brand';
