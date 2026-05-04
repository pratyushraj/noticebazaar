-- Add missing campaign metadata columns to brand_deals
-- These columns are present in collab_requests but were missing in brand_deals,
-- causing data loss during the offer acceptance transition.

ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS campaign_description TEXT,
  ADD COLUMN IF NOT EXISTS campaign_category TEXT,
  ADD COLUMN IF NOT EXISTS campaign_goal TEXT,
  ADD COLUMN IF NOT EXISTS selected_package_id TEXT,
  ADD COLUMN IF NOT EXISTS selected_package_label TEXT,
  ADD COLUMN IF NOT EXISTS selected_package_type TEXT,
  ADD COLUMN IF NOT EXISTS selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_quantity TEXT,
  ADD COLUMN IF NOT EXISTS content_duration TEXT,
  ADD COLUMN IF NOT EXISTS content_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS barter_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS collab_request_id UUID REFERENCES public.collab_requests(id),
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS creator_otp_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS creator_otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS collab_type TEXT;

COMMENT ON COLUMN public.brand_deals.selected_package_label IS 'Preserved package label from the original collab offer';
COMMENT ON COLUMN public.brand_deals.campaign_goal IS 'Preserved campaign goal from the original collab offer';
COMMENT ON COLUMN public.brand_deals.campaign_description IS 'Preserved campaign description from the original collab offer';
