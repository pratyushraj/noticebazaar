-- Save and continue later: store draft collab form by email + token
-- Brands can request a magic link to resume the form

CREATE TABLE IF NOT EXISTS public.collab_request_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_username TEXT NOT NULL,
  brand_email TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  resume_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collab_request_drafts_resume_token ON public.collab_request_drafts(resume_token);
CREATE INDEX IF NOT EXISTS idx_collab_request_drafts_expires_at ON public.collab_request_drafts(expires_at);

COMMENT ON TABLE public.collab_request_drafts IS 'Draft collaboration form data for "Save and continue later" flow';
