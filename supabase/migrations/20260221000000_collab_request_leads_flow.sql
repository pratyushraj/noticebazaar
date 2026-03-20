-- Capture collab requests for non-registered creators as leads,
-- then attach them to the real creator account after onboarding.

CREATE TABLE IF NOT EXISTS public.collab_request_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_handle text NOT NULL,
  target_channel text NOT NULL DEFAULT 'username' CHECK (target_channel IN ('username', 'instagram')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'attached', 'failed')),

  brand_name text NOT NULL,
  brand_email text NOT NULL,
  brand_address text,
  brand_gstin text,
  brand_phone text,
  brand_website text,
  brand_instagram text,

  collab_type text NOT NULL CHECK (collab_type IN ('paid', 'barter', 'both')),
  budget_range text,
  exact_budget numeric,
  barter_description text,
  barter_value numeric,
  barter_product_image_url text,
  campaign_description text NOT NULL,
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  usage_rights boolean DEFAULT false,
  deadline date,

  request_payload jsonb,
  submitted_ip text,
  submitted_user_agent text,

  notified_at timestamptz,
  attached_at timestamptz,
  attached_creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  converted_request_id uuid REFERENCES public.collab_requests(id) ON DELETE SET NULL,
  last_error text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collab_request_leads_target_status
  ON public.collab_request_leads(target_handle, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collab_request_leads_brand_email
  ON public.collab_request_leads(brand_email);

CREATE INDEX IF NOT EXISTS idx_collab_request_leads_converted_request_id
  ON public.collab_request_leads(converted_request_id)
  WHERE converted_request_id IS NOT NULL;

-- Back-reference from collab_requests to source lead for idempotent conversion.
ALTER TABLE public.collab_requests
  ADD COLUMN IF NOT EXISTS source_lead_id uuid REFERENCES public.collab_request_leads(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_requests_source_lead_id_unique
  ON public.collab_requests(source_lead_id)
  WHERE source_lead_id IS NOT NULL;

ALTER TABLE public.collab_request_leads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_collab_request_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_collab_request_leads_updated_at ON public.collab_request_leads;
CREATE TRIGGER update_collab_request_leads_updated_at
BEFORE UPDATE ON public.collab_request_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_collab_request_leads_updated_at();

COMMENT ON TABLE public.collab_request_leads IS 'Collab request captures for creators not onboarded yet; attached after onboarding';
COMMENT ON COLUMN public.collab_request_leads.target_handle IS 'Normalized username/instagram handle from public collab URL';
COMMENT ON COLUMN public.collab_request_leads.status IS 'pending -> processing -> attached/failed';
COMMENT ON COLUMN public.collab_requests.source_lead_id IS 'Source lead id when request was attached after creator onboarding';
