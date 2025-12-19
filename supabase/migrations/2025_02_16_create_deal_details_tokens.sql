-- Create deal_details_tokens table for secure brand deal details collection
-- Similar to brand_reply_tokens but for collecting deal details before contract creation

CREATE TABLE IF NOT EXISTS public.deal_details_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- No deal_id initially - deal is created after form submission
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ, -- Timestamp when brand submitted details (locks the form)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deal_details_submissions table to store submitted form data
CREATE TABLE IF NOT EXISTS public.deal_details_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.deal_details_tokens(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.brand_deals(id) ON DELETE SET NULL,
  -- Form data stored as JSONB for flexibility
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_details_tokens_creator_id 
ON public.deal_details_tokens(creator_id);

CREATE INDEX IF NOT EXISTS idx_deal_details_tokens_is_active 
ON public.deal_details_tokens(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_deal_details_submissions_token_id 
ON public.deal_details_submissions(token_id);

CREATE INDEX IF NOT EXISTS idx_deal_details_submissions_creator_id 
ON public.deal_details_submissions(creator_id);

CREATE INDEX IF NOT EXISTS idx_deal_details_submissions_deal_id 
ON public.deal_details_submissions(deal_id) WHERE deal_id IS NOT NULL;

-- RLS Policies
ALTER TABLE public.deal_details_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_details_submissions ENABLE ROW LEVEL SECURITY;

-- Creators can only see their own tokens
CREATE POLICY "Creators can view their own deal details tokens"
ON public.deal_details_tokens
FOR SELECT
USING (auth.uid() = creator_id);

-- Creators can create their own tokens
CREATE POLICY "Creators can create their own deal details tokens"
ON public.deal_details_tokens
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own tokens
CREATE POLICY "Creators can update their own deal details tokens"
ON public.deal_details_tokens
FOR UPDATE
USING (auth.uid() = creator_id);

-- Public can read active tokens (for form access) - but form is read-only if used_at is set
CREATE POLICY "Public can read active deal details tokens"
ON public.deal_details_tokens
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()) AND revoked_at IS NULL);

-- Creators can view their own submissions
CREATE POLICY "Creators can view their own deal details submissions"
ON public.deal_details_submissions
FOR SELECT
USING (auth.uid() = creator_id);

-- Public can insert submissions (brands submitting forms)
CREATE POLICY "Public can submit deal details"
ON public.deal_details_submissions
FOR INSERT
WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.deal_details_tokens IS 'Secure tokens for brand deal details collection links';
COMMENT ON TABLE public.deal_details_submissions IS 'Submitted deal details from brands before contract creation';

