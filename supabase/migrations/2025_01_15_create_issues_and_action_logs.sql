-- Create issues table
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved')),
  assigned_team TEXT CHECK (assigned_team IN ('legal', 'ca', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create issue_history table
CREATE TABLE IF NOT EXISTS public.issue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deal_action_logs table
CREATE TABLE IF NOT EXISTS public.deal_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_issues_deal_id ON public.issues(deal_id);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON public.issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issue_history_issue_id ON public.issue_history(issue_id);
CREATE INDEX IF NOT EXISTS idx_deal_action_logs_deal_id ON public.deal_action_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_action_logs_created_at ON public.deal_action_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issues
CREATE POLICY "Users can view their own issues"
  ON public.issues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own issues"
  ON public.issues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issues"
  ON public.issues FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for issue_history
CREATE POLICY "Users can view issue history for their issues"
  ON public.issue_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.issues
      WHERE issues.id = issue_history.issue_id
      AND issues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add history to their issues"
  ON public.issue_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues
      WHERE issues.id = issue_history.issue_id
      AND issues.user_id = auth.uid()
    )
  );

-- RLS Policies for deal_action_logs
CREATE POLICY "Users can view action logs for their deals"
  ON public.deal_action_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_deals
      WHERE brand_deals.id = deal_action_logs.deal_id
      AND brand_deals.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create action logs for their deals"
  ON public.deal_action_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_deals
      WHERE brand_deals.id = deal_action_logs.deal_id
      AND brand_deals.creator_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for issues
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

