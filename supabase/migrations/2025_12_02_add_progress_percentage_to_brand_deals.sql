-- Add progress_percentage column to brand_deals table
-- This column tracks the deal progress as a percentage (0-100)

ALTER TABLE public.brand_deals 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Update existing records based on their status
UPDATE public.brand_deals
SET progress_percentage = CASE
  WHEN LOWER(status) LIKE '%draft%' OR status = 'Drafting' THEN 10
  WHEN LOWER(status) LIKE '%negotiation%' THEN 30
  WHEN LOWER(status) LIKE '%review%' THEN 60
  WHEN LOWER(status) LIKE '%signed%' THEN 90
  WHEN LOWER(status) LIKE '%completed%' OR status = 'Completed' THEN 100
  WHEN LOWER(status) LIKE '%payment%pending%' THEN 70
  WHEN LOWER(status) LIKE '%paid%' THEN 90
  ELSE 0
END
WHERE progress_percentage = 0 OR progress_percentage IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.progress_percentage IS 'Deal progress percentage (0-100). Maps to stages: Draft=10, Negotiation=30, Review=60, Signed=90, Completed=100';

