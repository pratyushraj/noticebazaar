-- Add AI severity classification fields to consumer_complaints table
-- Used for internal triage and prioritization

ALTER TABLE public.consumer_complaints 
  ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1);

-- Add index for filtering by severity
CREATE INDEX IF NOT EXISTS idx_consumer_complaints_severity ON public.consumer_complaints(severity);

-- Add comment
COMMENT ON COLUMN public.consumer_complaints.severity IS 'AI-classified severity level (low/medium/high) for internal triage';
COMMENT ON COLUMN public.consumer_complaints.confidence_score IS 'AI confidence score (0-1) for the severity classification';

