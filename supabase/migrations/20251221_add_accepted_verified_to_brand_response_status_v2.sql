-- Migration: Add 'accepted_verified' value to brand_response_status enum (V2 - More robust)
-- This value is used when a brand accepts a contract and verifies via OTP

-- First, verify the enum type exists
DO $$ 
BEGIN
    -- Check if enum type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brand_response_status') THEN
        RAISE EXCEPTION 'brand_response_status enum type does not exist. Please run the initial migration first.';
    END IF;
    
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'accepted_verified' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'brand_response_status')
    ) THEN
        -- Add the new enum value
        ALTER TYPE brand_response_status ADD VALUE 'accepted_verified';
        RAISE NOTICE 'Successfully added accepted_verified to brand_response_status enum';
    ELSE
        RAISE NOTICE 'accepted_verified already exists in brand_response_status enum';
    END IF;
END $$;

-- Update the comment to reflect the new value
COMMENT ON COLUMN public.brand_deals.brand_response_status IS 'Status of brand response to contract change requests: pending, accepted, accepted_verified (OTP verified), negotiating, or rejected';

-- Verify the enum values (for debugging)
SELECT 
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'brand_response_status'
ORDER BY e.enumsortorder;

