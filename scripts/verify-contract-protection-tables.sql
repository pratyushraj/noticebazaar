-- Verify Contract Protection Tables
-- Run this in Supabase SQL Editor to confirm tables were created

-- Check if contract_issues table exists
SELECT 
  'contract_issues' as table_name,
  COUNT(*) as row_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'contract_issues') as column_count
FROM contract_issues;

-- Check if lawyer_requests table exists
SELECT 
  'lawyer_requests' as table_name,
  COUNT(*) as row_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lawyer_requests') as column_count
FROM lawyer_requests;

-- List all columns in contract_issues
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contract_issues'
ORDER BY ordinal_position;

-- List all columns in lawyer_requests
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lawyer_requests'
ORDER BY ordinal_position;

