-- Phase 2: Signed Contract Storage for CreatorArmour
-- Adds optional fields to store a final signed contract PDF and execution status

-- 1) New columns on brand_deals (non-destructive, all nullable)
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS signed_contract_url text,
ADD COLUMN IF NOT EXISTS signed_contract_uploaded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deal_execution_status text;

-- 2) Lightweight enum-style check constraint for deal_execution_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brand_deals_deal_execution_status_check'
  ) THEN
    ALTER TABLE public.brand_deals
      ADD CONSTRAINT brand_deals_deal_execution_status_check
      CHECK (
        deal_execution_status IS NULL
        OR deal_execution_status IN ('pending_signature', 'signed', 'completed')
      );
  END IF;
END $$;


