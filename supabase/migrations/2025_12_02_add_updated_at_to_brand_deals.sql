-- Add updated_at column to brand_deals table if it doesn't exist
-- This column tracks when a deal was last modified

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS update_brand_deals_updated_at_trigger ON public.brand_deals;
CREATE TRIGGER update_brand_deals_updated_at_trigger
    BEFORE UPDATE ON public.brand_deals
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_deals_updated_at();

COMMENT ON COLUMN public.brand_deals.updated_at IS 'Timestamp of when the deal was last updated';

