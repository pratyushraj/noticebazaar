-- Database tables for Contract Protection/Analysis features
-- Run this migration to create all required tables

-- 1. protection_reports - Create if doesn't exist
CREATE TABLE IF NOT EXISTS protection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES brand_deals(id) ON DELETE CASCADE,
  contract_file_url TEXT NOT NULL,
  protection_score INTEGER NOT NULL CHECK (protection_score >= 0 AND protection_score <= 100),
  overall_risk TEXT NOT NULL CHECK (overall_risk IN ('low', 'medium', 'high')),
  analysis_json JSONB NOT NULL,
  pdf_report_url TEXT,
  safe_contract_url TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add safe_contract_url column if table exists but column doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'protection_reports' AND column_name = 'safe_contract_url'
  ) THEN
    ALTER TABLE protection_reports ADD COLUMN safe_contract_url TEXT;
  END IF;
END $$;

-- Add user_id column if table exists but column doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'protection_reports' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE protection_reports ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_protection_reports_user_id ON protection_reports(user_id);
  END IF;
END $$;

-- Add negotiation_power_score column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'protection_reports' AND column_name = 'negotiation_power_score'
  ) THEN
    ALTER TABLE protection_reports ADD COLUMN negotiation_power_score INT CHECK (negotiation_power_score >= 0 AND negotiation_power_score <= 100);
    CREATE INDEX IF NOT EXISTS idx_protection_reports_negotiation_power_score ON protection_reports(negotiation_power_score);
  END IF;
END $$;

-- Create indexes for protection_reports
CREATE INDEX IF NOT EXISTS idx_protection_reports_deal_id ON protection_reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_protection_reports_risk ON protection_reports(overall_risk);

-- 2. protection_issues - Create if doesn't exist
CREATE TABLE IF NOT EXISTS protection_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES protection_reports(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low', 'warning')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  clause_reference TEXT,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for protection_issues
CREATE INDEX IF NOT EXISTS idx_protection_issues_report_id ON protection_issues(report_id);
CREATE INDEX IF NOT EXISTS idx_protection_issues_severity ON protection_issues(severity);

-- 3. safe_clauses - Store AI-generated safe clause replacements
CREATE TABLE IF NOT EXISTS safe_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES protection_reports(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES protection_issues(id) ON DELETE CASCADE,
  original_clause TEXT NOT NULL,
  safe_clause TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safe_clauses_report_id ON safe_clauses(report_id);
CREATE INDEX IF NOT EXISTS idx_safe_clauses_issue_id ON safe_clauses(issue_id);

-- 4. saved_reports - Track reports saved by users to their dashboard
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES protection_reports(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_report_id ON saved_reports(report_id);

-- 5. legal_review_requests - Track requests for lawyer review
CREATE TABLE IF NOT EXISTS legal_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES protection_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  lawyer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_review_requests_report_id ON legal_review_requests(report_id);
CREATE INDEX IF NOT EXISTS idx_legal_review_requests_user_id ON legal_review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_review_requests_status ON legal_review_requests(status);

-- 6. negotiation_messages - Store AI-generated negotiation messages
CREATE TABLE IF NOT EXISTS negotiation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES protection_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  brand_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_messages_report_id ON negotiation_messages(report_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_user_id ON negotiation_messages(user_id);

-- Row Level Security (RLS) Policies

-- safe_clauses: Users can only access clauses for their own reports
ALTER TABLE safe_clauses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view safe clauses for their own reports" ON safe_clauses;
CREATE POLICY "Users can view safe clauses for their own reports"
  ON safe_clauses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM protection_reports pr
      JOIN brand_deals bd ON pr.deal_id = bd.id
      WHERE pr.id = safe_clauses.report_id
      AND bd.creator_id = auth.uid()
    )
  );

-- saved_reports: Users can only access their own saved reports
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own saved reports" ON saved_reports;
CREATE POLICY "Users can manage their own saved reports"
  ON saved_reports FOR ALL
  USING (user_id = auth.uid());

-- legal_review_requests: Users can only access their own requests
ALTER TABLE legal_review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own legal review requests" ON legal_review_requests;
CREATE POLICY "Users can view their own legal review requests"
  ON legal_review_requests FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own legal review requests" ON legal_review_requests;
CREATE POLICY "Users can create their own legal review requests"
  ON legal_review_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admin access policies (if needed)
DROP POLICY IF EXISTS "Admins can view all legal review requests" ON legal_review_requests;
CREATE POLICY "Admins can view all legal review requests"
  ON legal_review_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

