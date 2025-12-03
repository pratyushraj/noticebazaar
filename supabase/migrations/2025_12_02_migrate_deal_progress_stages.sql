-- Migration: Update deal progress stages
-- Removes: draft, review
-- Adds: content_making (80%), content_delivered (90%)
-- New order: negotiation (30%) → signed (70%) → content_making (80%) → content_delivered (90%) → completed (100%)

-- Step 1: Update progress_percentage for existing deals based on status
UPDATE public.brand_deals
SET 
  progress_percentage = CASE
    -- Map old statuses to new progress values
    WHEN LOWER(status) LIKE '%draft%' OR status = 'Drafting' THEN 30  -- draft → negotiation
    WHEN LOWER(status) LIKE '%review%' THEN 70  -- review → signed
    WHEN LOWER(status) LIKE '%negotiation%' THEN 30
    WHEN LOWER(status) LIKE '%signed%' THEN 70
    WHEN LOWER(status) LIKE '%content_making%' OR LOWER(status) LIKE '%content making%' THEN 80
    WHEN LOWER(status) LIKE '%content_delivered%' OR LOWER(status) LIKE '%content delivered%' THEN 90
    WHEN LOWER(status) LIKE '%completed%' OR status = 'Completed' THEN 100
    WHEN LOWER(status) LIKE '%payment%pending%' THEN 90  -- Payment pending likely means content delivered
    ELSE COALESCE(progress_percentage, 30)  -- Default to negotiation if unknown
  END,
  status = CASE
    -- Map old statuses to new status values
    WHEN LOWER(status) LIKE '%draft%' OR status = 'Drafting' THEN 'Negotiation'  -- draft → negotiation
    WHEN LOWER(status) LIKE '%review%' THEN 'Signed'  -- review → signed
    WHEN LOWER(status) LIKE '%negotiation%' THEN 'Negotiation'
    WHEN LOWER(status) LIKE '%signed%' THEN 'Signed'
    WHEN LOWER(status) LIKE '%content_making%' OR LOWER(status) LIKE '%content making%' THEN 'Content Making'
    WHEN LOWER(status) LIKE '%content_delivered%' OR LOWER(status) LIKE '%content delivered%' THEN 'Content Delivered'
    WHEN LOWER(status) LIKE '%completed%' OR status = 'Completed' THEN 'Completed'
    WHEN LOWER(status) LIKE '%payment%pending%' THEN 'Content Delivered'  -- Payment pending likely means content delivered
    ELSE status  -- Keep existing if already in new format
  END
WHERE 
  -- Only update deals that need migration
  (
    LOWER(status) LIKE '%draft%' OR 
    status = 'Drafting' OR
    LOWER(status) LIKE '%review%' OR
    progress_percentage IS NULL OR
    progress_percentage NOT IN (30, 70, 80, 90, 100)
  );

-- Step 2: Ensure all deals have valid progress_percentage
UPDATE public.brand_deals
SET progress_percentage = 30
WHERE progress_percentage IS NULL OR progress_percentage < 0 OR progress_percentage > 100;

-- Step 3: Add constraint to ensure progress_percentage is valid (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'brand_deals_progress_percentage_check'
  ) THEN
    ALTER TABLE public.brand_deals
    ADD CONSTRAINT brand_deals_progress_percentage_check 
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

-- Step 4: Add comment documenting the new stages
COMMENT ON COLUMN public.brand_deals.progress_percentage IS 
'Deal progress percentage (0-100). Stages: negotiation=30, signed=70, content_making=80, content_delivered=90, completed=100';

-- Step 5: Create index on progress_percentage for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_brand_deals_progress_percentage 
ON public.brand_deals(progress_percentage);

-- Step 6: Create index on status for faster filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_brand_deals_status 
ON public.brand_deals(status);

