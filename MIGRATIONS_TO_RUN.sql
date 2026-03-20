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

-- Lawyer Help Requests Table
-- Tracks requests for legal assistance from creators

CREATE TABLE IF NOT EXISTS public.lawyer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Request details
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.brand_deals(id) ON DELETE SET NULL, -- Optional: link to specific contract/deal
  
  -- Request content
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category TEXT NOT NULL CHECK (category IN ('contract_review', 'payment_dispute', 'termination', 'ip_rights', 'exclusivity', 'other')) DEFAULT 'contract_review',
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'closed')) DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Lawyer/admin assigned
  assigned_at TIMESTAMPTZ,
  
  -- Response tracking
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb -- Additional flexible data
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_creator_id ON public.lawyer_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_deal_id ON public.lawyer_requests(deal_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_status ON public.lawyer_requests(status);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_urgency ON public.lawyer_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_category ON public.lawyer_requests(category);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_created_at ON public.lawyer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_assigned_to ON public.lawyer_requests(assigned_to);

-- Enable Row Level Security
ALTER TABLE public.lawyer_requests ENABLE ROW LEVEL SECURITY;

-- Creators can view and create their own requests
CREATE POLICY "Creators can view their own lawyer requests"
ON public.lawyer_requests FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create lawyer requests"
ON public.lawyer_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own pending requests"
ON public.lawyer_requests FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id AND status = 'pending')
WITH CHECK (auth.uid() = creator_id);

-- Admins and lawyers can view all requests
CREATE POLICY "Admins and lawyers can view all requests"
ON public.lawyer_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'lawyer')
  )
);

-- Admins and lawyers can update requests
CREATE POLICY "Admins and lawyers can update requests"
ON public.lawyer_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'lawyer')
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lawyer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lawyer_requests_updated_at
  BEFORE UPDATE ON public.lawyer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_lawyer_requests_updated_at();

