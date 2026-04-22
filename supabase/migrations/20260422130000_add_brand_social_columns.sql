-- Add missing social and niche columns to brands table
-- These are used by the brand dashboard profile settings

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_handle TEXT,
ADD COLUMN IF NOT EXISTS content_niches TEXT[] DEFAULT '{}'::TEXT[];

-- Add comments for clarity
COMMENT ON COLUMN public.brands.instagram_handle IS 'Brand official Instagram handle (without @)';
COMMENT ON COLUMN public.brands.whatsapp_handle IS 'Brand official WhatsApp/Contact number';
COMMENT ON COLUMN public.brands.content_niches IS 'Array of target niches for the brand';
