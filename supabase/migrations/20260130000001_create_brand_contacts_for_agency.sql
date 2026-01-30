-- Canonical brand entity for agency: one row per brand (deduped by email)
-- Links collab_requests and brand_deals to a single brand record for reporting and matching

CREATE TABLE IF NOT EXISTS public.brand_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text NOT NULL,
  legal_name text,
  email text,
  phone text,
  website text,
  instagram text,
  address text,
  gstin text,
  industry text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_contacts_email_normalized_unique UNIQUE (email_normalized)
);

CREATE INDEX IF NOT EXISTS idx_brand_contacts_email_normalized ON public.brand_contacts(email_normalized);
CREATE INDEX IF NOT EXISTS idx_brand_contacts_last_seen ON public.brand_contacts(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_contacts_industry ON public.brand_contacts(industry) WHERE industry IS NOT NULL;

COMMENT ON TABLE public.brand_contacts IS 'Canonical brand records from collab link and deals; deduped by email for agency reporting and matching';

-- Link collab_requests to brand_contacts
ALTER TABLE public.collab_requests
ADD COLUMN IF NOT EXISTS brand_contact_id uuid REFERENCES public.brand_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_collab_requests_brand_contact_id ON public.collab_requests(brand_contact_id) WHERE brand_contact_id IS NOT NULL;

COMMENT ON COLUMN public.collab_requests.brand_contact_id IS 'Canonical brand (for agency); set on submit';

-- Link brand_deals to brand_contacts
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_contact_id uuid REFERENCES public.brand_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brand_deals_brand_contact_id ON public.brand_deals(brand_contact_id) WHERE brand_contact_id IS NOT NULL;

COMMENT ON COLUMN public.brand_deals.brand_contact_id IS 'Canonical brand (for agency); set on deal create/accept';

-- RLS: backend uses service role (bypasses RLS). Authenticated read for future agency dashboard.
ALTER TABLE public.brand_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read brand_contacts"
ON public.brand_contacts FOR SELECT
TO authenticated
USING (true);
