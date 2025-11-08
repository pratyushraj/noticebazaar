-- This migration ensures the contract_file_url column is present, which is required for the application logic.
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS contract_file_url text;

-- Note: The application also requires RLS INSERT policy to be enabled for the creator_id.