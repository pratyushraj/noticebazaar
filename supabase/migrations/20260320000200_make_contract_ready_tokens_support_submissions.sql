-- Migration: Make contract_ready_tokens support submissions (deal_id nullable, add submission_id)
-- This allows creating contract ready tokens before deals are created (deals are only created when signed)

-- Ensure contract_ready_tokens table exists first
CREATE TABLE IF NOT EXISTS public.contract_ready_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    revoked_at timestamp with time zone,
    revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Ensure deal_details_tokens and deal_details_submissions exist first to satisfy foreign key constraints
CREATE TABLE IF NOT EXISTS public.deal_details_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deal_details_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.deal_details_tokens(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.brand_deals(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make deal_id nullable (guarded to only run if column is not nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contract_ready_tokens' 
      AND column_name = 'deal_id' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.contract_ready_tokens ALTER COLUMN deal_id DROP NOT NULL;
  END IF;
END $$;

-- Add submission_id column if not exists
ALTER TABLE public.contract_ready_tokens 
  ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.deal_details_submissions(id) ON DELETE CASCADE;

-- Create index on submission_id
CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_submission_id 
  ON public.contract_ready_tokens(submission_id) 
  WHERE submission_id IS NOT NULL;

-- Update RLS policy to allow creating tokens with submission_id
DROP POLICY IF EXISTS "Creators can create contract ready tokens" ON public.contract_ready_tokens;

CREATE POLICY "Creators can create contract ready tokens"
ON public.contract_ready_tokens FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  (
    -- Either has a valid deal_id
    (deal_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.brand_deals
      WHERE id = deal_id AND creator_id = auth.uid()
    ))
    OR
    -- Or has a valid submission_id
    (submission_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.deal_details_submissions
      WHERE id = submission_id AND creator_id = auth.uid()
    ))
  )
);

-- Add constraint: token must have either deal_id or submission_id (but not both required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_schema = 'public' 
      AND table_name = 'contract_ready_tokens' 
      AND constraint_name = 'contract_ready_tokens_deal_or_submission_check'
  ) THEN
    ALTER TABLE public.contract_ready_tokens 
      ADD CONSTRAINT contract_ready_tokens_deal_or_submission_check 
      CHECK (deal_id IS NOT NULL OR submission_id IS NOT NULL);
  END IF;
END $$;

-- Update comment
COMMENT ON COLUMN public.contract_ready_tokens.deal_id IS 'Deal ID (nullable - can be null if submission_id is set)';
COMMENT ON COLUMN public.contract_ready_tokens.submission_id IS 'Submission ID (nullable - used when deal is not yet created)';

