-- Migration: Add secure file path columns for signed URL generation
-- This migration adds columns to store storage paths instead of public URLs
-- Enables time-limited signed URL generation for better security

-- Add contract_file_path column (stores the storage path, not public URL)
ALTER TABLE brand_deals 
ADD COLUMN IF NOT EXISTS contract_file_path TEXT;

-- Add signed_contract_path column (for fully executed contracts)
ALTER TABLE brand_deals 
ADD COLUMN IF NOT EXISTS signed_contract_path TEXT;

-- Add comment explaining the security model
COMMENT ON COLUMN brand_deals.contract_file_path IS 'Storage path for contract file (used to generate signed URLs with expiration)';
COMMENT ON COLUMN brand_deals.signed_contract_path IS 'Storage path for signed contract file (used to generate signed URLs with expiration)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_deals_contract_paths 
ON brand_deals(contract_file_path, signed_contract_path) 
WHERE contract_file_path IS NOT NULL OR signed_contract_path IS NOT NULL;

-- Migration note: Existing contracts with public URLs will continue to work
-- New contracts should use the path-based approach for better security
-- The API endpoint handles both legacy (public URL) and new (signed URL) approaches
