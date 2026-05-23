-- Add missing social and niche columns to brands table
-- These are used by the brand dashboard profile settings

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'brands' AND schemaname = 'public'
  ) THEN
    EXECUTE 'ALTER TABLE public.brands
      ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_handle TEXT,
      ADD COLUMN IF NOT EXISTS content_niches TEXT[] DEFAULT ''{}''::TEXT[]';
      
    EXECUTE 'COMMENT ON COLUMN public.brands.instagram_handle IS ''Brand official Instagram handle (without @)''';
    EXECUTE 'COMMENT ON COLUMN public.brands.whatsapp_handle IS ''Brand official WhatsApp/Contact number''';
    EXECUTE 'COMMENT ON COLUMN public.brands.content_niches IS ''Array of target niches for the brand''';
  ELSE
    RAISE NOTICE 'brands table does not exist, skipping migration';
  END IF;
END
$$;
