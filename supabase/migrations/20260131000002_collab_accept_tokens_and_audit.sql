-- Accept-from-email flow: tokens for public accept link + audit log
-- Token is signed by being a unique id; expiry and request id stored in DB

-- 1. Tokens for /collab/accept/:requestToken (one per request, created when we send creator notification)
CREATE TABLE IF NOT EXISTS public.collab_accept_tokens (
  id text PRIMARY KEY,
  collab_request_id uuid NOT NULL REFERENCES public.collab_requests(id) ON DELETE CASCADE,
  creator_email text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collab_accept_tokens_request ON public.collab_accept_tokens(collab_request_id);
CREATE INDEX IF NOT EXISTS idx_collab_accept_tokens_expires ON public.collab_accept_tokens(expires_at);

COMMENT ON TABLE public.collab_accept_tokens IS 'Signed expiring tokens for creator accept-from-email link; id is the requestToken in URL';

-- 2. Audit log for collab accept (action = accepted, auth_method = magic_link | otp)
CREATE TABLE IF NOT EXISTS public.collab_request_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_request_id uuid NOT NULL REFERENCES public.collab_requests(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  auth_method text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collab_request_audit_request ON public.collab_request_audit_log(collab_request_id);
CREATE INDEX IF NOT EXISTS idx_collab_request_audit_created ON public.collab_request_audit_log(created_at DESC);

COMMENT ON TABLE public.collab_request_audit_log IS 'Audit trail for collab request actions (e.g. accepted via magic link)';

-- 3. Acceptance metadata on collab_requests
ALTER TABLE public.collab_requests
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by_creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_ip text,
  ADD COLUMN IF NOT EXISTS accepted_user_agent text;

COMMENT ON COLUMN public.collab_requests.accepted_at IS 'When the creator accepted (from email link or dashboard)';
COMMENT ON COLUMN public.collab_requests.accepted_by_creator_id IS 'Creator user id who accepted';
COMMENT ON COLUMN public.collab_requests.accepted_ip IS 'IP at time of acceptance';
COMMENT ON COLUMN public.collab_requests.accepted_user_agent IS 'User agent at time of acceptance';

-- RLS: tokens and audit are server-only (service role); no direct client access needed for tokens
ALTER TABLE public.collab_accept_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_request_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; anon/authenticated have no access (API uses service role)
CREATE POLICY "collab_accept_tokens_service_only"
  ON public.collab_accept_tokens FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "collab_request_audit_log_service_only"
  ON public.collab_request_audit_log FOR ALL
  USING (false)
  WITH CHECK (false);

-- Allow insert/select for service role via service_role key (RLS with USING(false) blocks anon/auth; service_role bypasses RLS in Supabase)
-- So no additional policy needed; backend uses service role.
