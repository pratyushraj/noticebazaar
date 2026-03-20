-- Contract Issues Tracking Table
-- Tracks issues found in contracts and their resolution status

CREATE TABLE IF NOT EXISTS public.contract_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contract/Deal reference
  deal_id UUID NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Issue details
  issue_type TEXT NOT NULL CHECK (issue_type IN ('exclusivity', 'payment', 'termination', 'ip_rights', 'timeline', 'deliverables', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  impact JSONB DEFAULT '[]'::jsonb, -- Array of impact points
  recommendation TEXT,
  
  -- Resolution tracking
  status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')) DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb -- Additional flexible data
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_issues_deal_id ON public.contract_issues(deal_id);
CREATE INDEX IF NOT EXISTS idx_contract_issues_creator_id ON public.contract_issues(creator_id);
CREATE INDEX IF NOT EXISTS idx_contract_issues_status ON public.contract_issues(status);
CREATE INDEX IF NOT EXISTS idx_contract_issues_issue_type ON public.contract_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_contract_issues_created_at ON public.contract_issues(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contract_issues ENABLE ROW LEVEL SECURITY;

-- Creators can view and manage their own contract issues
CREATE POLICY "Creators can view their own contract issues"
ON public.contract_issues FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own contract issues"
ON public.contract_issues FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own contract issues"
ON public.contract_issues FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Admins can view all issues (for support)
CREATE POLICY "Admins can view all contract issues"
ON public.contract_issues FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_issues_updated_at
  BEFORE UPDATE ON public.contract_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_issues_updated_at();

