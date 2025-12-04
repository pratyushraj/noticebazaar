-- Protection Reports and Contract Analysis Migration
-- Extends brand_deals with protection analysis data

-- ============================================================================
-- PROTECTION REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.protection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  contract_file_url TEXT NOT NULL,
  protection_score INTEGER NOT NULL CHECK (protection_score >= 0 AND protection_score <= 100),
  overall_risk TEXT NOT NULL CHECK (overall_risk IN ('low', 'medium', 'high')),
  analysis_json JSONB NOT NULL, -- Full analysis result
  pdf_report_url TEXT, -- Generated PDF report storage path
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PROTECTION ISSUES TABLE (normalized from analysis_json)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.protection_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.protection_reports(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low', 'warning')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  clause_reference TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PROTECTION VERIFIED ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.protection_verified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.protection_reports(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  clause_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_protection_reports_deal_id ON public.protection_reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_protection_reports_risk ON public.protection_reports(overall_risk);
CREATE INDEX IF NOT EXISTS idx_protection_issues_report_id ON public.protection_issues(report_id);
CREATE INDEX IF NOT EXISTS idx_protection_issues_severity ON public.protection_issues(severity);
CREATE INDEX IF NOT EXISTS idx_protection_verified_report_id ON public.protection_verified(report_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.protection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protection_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protection_verified ENABLE ROW LEVEL SECURITY;

-- Creators can only see their own reports
CREATE POLICY "protection_reports_select_creator"
  ON public.protection_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_deals bd
      WHERE bd.id = protection_reports.deal_id
        AND bd.creator_id = auth.uid()
    )
  );

-- Advisors and admins can see all reports
CREATE POLICY "protection_reports_select_advisor"
  ON public.protection_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'chartered_accountant')
    )
  );

CREATE POLICY "protection_issues_select_creator"
  ON public.protection_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.protection_reports pr
      JOIN public.brand_deals bd ON bd.id = pr.deal_id
      WHERE pr.id = protection_issues.report_id
        AND bd.creator_id = auth.uid()
    )
  );

CREATE POLICY "protection_verified_select_creator"
  ON public.protection_verified FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.protection_reports pr
      JOIN public.brand_deals bd ON bd.id = pr.deal_id
      WHERE pr.id = protection_verified.report_id
        AND bd.creator_id = auth.uid()
    )
  );

COMMENT ON TABLE public.protection_reports IS 'Contract analysis results with protection scores and risk levels';
COMMENT ON TABLE public.protection_issues IS 'Normalized issues found during contract analysis';
COMMENT ON TABLE public.protection_verified IS 'Verified positive clauses found in contracts';

