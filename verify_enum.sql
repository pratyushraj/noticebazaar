-- Verify that 'accepted_verified' exists in the brand_response_status enum
-- Run this in Supabase SQL Editor to check

SELECT 
    e.enumlabel as enum_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'brand_response_status'
ORDER BY e.enumsortorder;

-- Expected output should include:
-- pending
-- accepted
-- negotiating
-- rejected
-- accepted_verified  <-- This should be present

