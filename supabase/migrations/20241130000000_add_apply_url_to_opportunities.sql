-- Add apply_url column to opportunities table
-- This stores the original marketplace URL where creators can apply

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS apply_url text;

CREATE INDEX IF NOT EXISTS idx_opportunities_apply_url ON public.opportunities(apply_url);

COMMENT ON COLUMN public.opportunities.apply_url IS 'Original marketplace URL where creators can apply for this opportunity';

