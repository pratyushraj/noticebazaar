-- Add esign_invitation_id column to brand_deals table
-- This stores the Leegality invitation ID (different from document/file ID)

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS esign_invitation_id TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_esign_invitation_id 
ON public.brand_deals(esign_invitation_id);

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.esign_invitation_id IS 'Invitation ID from Leegality eSign provider (used for status checks and downloading signed PDF)';

