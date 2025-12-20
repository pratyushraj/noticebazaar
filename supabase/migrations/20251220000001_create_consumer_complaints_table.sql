-- Consumer Complaints Table
-- Tracks consumer complaints filed by creators

CREATE TABLE IF NOT EXISTS public.consumer_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Creator reference
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Complaint details
  category TEXT NOT NULL,
  category_name TEXT,
  company_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC,
  proof_file_url TEXT,
  
  -- Pre-filing actions (pilot)
  wants_lawyer_review BOOLEAN DEFAULT false,
  wants_notice_draft BOOLEAN DEFAULT false,
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'draft_created',
    'lawyer_review_requested',
    'lawyer_review_completed',
    'notice_generated',
    'ready_to_file',
    'filed_by_user'
  )) DEFAULT 'draft_created',
  
  -- Lawyer review tracking
  lawyer_reviewed_at TIMESTAMPTZ,
  lawyer_reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lawyer_review_notes TEXT,
  lawyer_review_suggestions TEXT,
  
  -- Legal notice tracking
  notice_draft_url TEXT,
  notice_generated_at TIMESTAMPTZ,
  notice_generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Filing tracking
  filed_at TIMESTAMPTZ,
  filing_reference TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consumer_complaints_creator_id ON public.consumer_complaints(creator_id);
CREATE INDEX IF NOT EXISTS idx_consumer_complaints_status ON public.consumer_complaints(status);
CREATE INDEX IF NOT EXISTS idx_consumer_complaints_created_at ON public.consumer_complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consumer_complaints_lawyer_review_requested ON public.consumer_complaints(creator_id, status) WHERE status = 'lawyer_review_requested';

-- Enable Row Level Security
ALTER TABLE public.consumer_complaints ENABLE ROW LEVEL SECURITY;

-- Creators can view and manage their own complaints
CREATE POLICY "Creators can view their own complaints"
ON public.consumer_complaints FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own complaints"
ON public.consumer_complaints FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own complaints"
ON public.consumer_complaints FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Lawyers/admins can view all complaints
CREATE POLICY "Lawyers can view all complaints"
ON public.consumer_complaints FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('lawyer', 'admin')
  )
);

-- Lawyers/admins can update complaints (for review and notice generation)
CREATE POLICY "Lawyers can update all complaints"
ON public.consumer_complaints FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('lawyer', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('lawyer', 'admin')
  )
);

-- Add comment
COMMENT ON TABLE public.consumer_complaints IS 'Tracks consumer complaints filed by creators. Includes pre-filing actions (lawyer review, legal notice drafting) during pilot phase.';

