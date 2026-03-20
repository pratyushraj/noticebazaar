-- Migration: Make contract_ready_tokens support submissions (deal_id nullable, add submission_id)
-- This allows creating contract ready tokens before deals are created (deals are only created when signed)

-- Make deal_id nullable
ALTER TABLE public.contract_ready_tokens 
  ALTER COLUMN deal_id DROP NOT NULL;

-- Add submission_id column
ALTER TABLE public.contract_ready_tokens 
  ADD COLUMN submission_id uuid REFERENCES public.deal_details_submissions(id) ON DELETE CASCADE;

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
ALTER TABLE public.contract_ready_tokens 
  ADD CONSTRAINT contract_ready_tokens_deal_or_submission_check 
  CHECK (deal_id IS NOT NULL OR submission_id IS NOT NULL);

-- Update comment
COMMENT ON COLUMN public.contract_ready_tokens.deal_id IS 'Deal ID (nullable - can be null if submission_id is set)';
COMMENT ON COLUMN public.contract_ready_tokens.submission_id IS 'Submission ID (nullable - used when deal is not yet created)';

