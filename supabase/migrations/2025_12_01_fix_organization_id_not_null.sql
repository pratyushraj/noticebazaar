-- Quick fix: Make organization_id nullable in brand_deals
-- Run this in Supabase SQL Editor if you're getting "null value violates not-null constraint" error

-- Drop the NOT NULL constraint if it exists
ALTER TABLE public.brand_deals 
ALTER COLUMN organization_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL values
-- First, drop the existing constraint if it exists
ALTER TABLE public.brand_deals 
DROP CONSTRAINT IF EXISTS brand_deals_organization_id_fkey;

-- Recreate the constraint with ON DELETE SET NULL to allow NULL values
ALTER TABLE public.brand_deals 
ADD CONSTRAINT brand_deals_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES public.organizations(id) 
ON DELETE SET NULL;

