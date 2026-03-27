-- Fix report_id Issue - Add Missing Columns to protection_reports
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql

-- Step 1: Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'protection_reports' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.protection_reports 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_protection_reports_user_id 
    ON public.protection_reports(user_id);
    
    RAISE NOTICE '✅ Added user_id column to protection_reports';
  ELSE
    RAISE NOTICE 'ℹ️  user_id column already exists';
  END IF;
END $$;

-- Step 2: Add negotiation_power_score column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'protection_reports' 
    AND column_name = 'negotiation_power_score'
  ) THEN
    ALTER TABLE public.protection_reports 
    ADD COLUMN negotiation_power_score INT 
    CHECK (negotiation_power_score >= 0 AND negotiation_power_score <= 100);
    
    CREATE INDEX IF NOT EXISTS idx_protection_reports_negotiation_power_score 
    ON public.protection_reports(negotiation_power_score);
    
    RAISE NOTICE '✅ Added negotiation_power_score column';
  ELSE
    RAISE NOTICE 'ℹ️  negotiation_power_score column already exists';
  END IF;
END $$;

-- Step 3: Ensure protection_reports table exists (if it doesn't)
CREATE TABLE IF NOT EXISTS public.protection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_file_url TEXT NOT NULL,
  protection_score INTEGER NOT NULL CHECK (protection_score >= 0 AND protection_score <= 100),
  negotiation_power_score INT CHECK (negotiation_power_score >= 0 AND negotiation_power_score <= 100),
  overall_risk TEXT NOT NULL CHECK (overall_risk IN ('low', 'medium', 'high')),
  analysis_json JSONB NOT NULL,
  pdf_report_url TEXT,
  safe_contract_url TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create all indexes
CREATE INDEX IF NOT EXISTS idx_protection_reports_user_id ON public.protection_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_protection_reports_deal_id ON public.protection_reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_protection_reports_risk ON public.protection_reports(overall_risk);
CREATE INDEX IF NOT EXISTS idx_protection_reports_negotiation_power_score ON public.protection_reports(negotiation_power_score);

-- Step 5: Verify the columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'protection_reports' 
AND column_name IN ('user_id', 'negotiation_power_score', 'id')
ORDER BY column_name;

-- Expected output:
-- negotiation_power_score | integer | YES
-- user_id                  | uuid    | YES
-- id                       | uuid    | NO

