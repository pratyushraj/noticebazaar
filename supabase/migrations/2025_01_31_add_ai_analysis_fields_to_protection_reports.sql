-- Add AI-driven analysis fields to protection_reports table
-- These fields store the AI's decisions about document type, category, brand detection, and risk

ALTER TABLE public.protection_reports
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS detected_contract_category TEXT,
ADD COLUMN IF NOT EXISTS brand_detected BOOLEAN,
ADD COLUMN IF NOT EXISTS risk_score TEXT CHECK (risk_score IN ('LOW', 'MEDIUM', 'HIGH'));

COMMENT ON COLUMN public.protection_reports.document_type IS 'AI-identified document type (e.g., Brand Deal Contract, NDA, MoU, Barter Agreement)';
COMMENT ON COLUMN public.protection_reports.detected_contract_category IS 'AI-detected contract category (brand_deal, nda, mou, barter, sponsorship, other)';
COMMENT ON COLUMN public.protection_reports.brand_detected IS 'AI-detected: true if document is a brand-influencer collaboration';
COMMENT ON COLUMN public.protection_reports.risk_score IS 'AI-assigned risk score: LOW, MEDIUM, or HIGH';

-- Create index for filtering by contract category
CREATE INDEX IF NOT EXISTS idx_protection_reports_contract_category 
ON public.protection_reports(detected_contract_category);

-- Create index for filtering by brand detection
CREATE INDEX IF NOT EXISTS idx_protection_reports_brand_detected 
ON public.protection_reports(brand_detected);

-- Create table for AI decision logging
CREATE TABLE IF NOT EXISTS public.contract_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.protection_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model_used TEXT NOT NULL,
  prompt_hash TEXT,
  risk_score TEXT CHECK (risk_score IN ('LOW', 'MEDIUM', 'HIGH')),
  detected_type TEXT,
  detected_category TEXT,
  brand_detected BOOLEAN,
  analysis_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.contract_ai_logs IS 'Logs AI decisions for contract analysis - tracks model, prompt hash, risk score, and detection results';
COMMENT ON COLUMN public.contract_ai_logs.prompt_hash IS 'Hash of the prompt sent to AI (for debugging and tracking)';
COMMENT ON COLUMN public.contract_ai_logs.analysis_metadata IS 'Additional metadata from AI analysis (parties, extracted terms, etc.)';

-- Create indexes for AI logs
CREATE INDEX IF NOT EXISTS idx_contract_ai_logs_report_id 
ON public.contract_ai_logs(report_id);

CREATE INDEX IF NOT EXISTS idx_contract_ai_logs_user_id 
ON public.contract_ai_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_contract_ai_logs_created_at 
ON public.contract_ai_logs(created_at DESC);

