-- Migration: Add 'accepted_verified' value to brand_response_status enum
-- This value is used when a brand accepts a contract and verifies via OTP

-- Add the new enum value
DO $$ 
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'accepted_verified' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'brand_response_status')
    ) THEN
        ALTER TYPE brand_response_status ADD VALUE 'accepted_verified';
    END IF;
END $$;

-- Update the comment to reflect the new value
COMMENT ON COLUMN public.brand_deals.brand_response_status IS 'Status of brand response to contract change requests: pending, accepted, accepted_verified (OTP verified), negotiating, or rejected';

