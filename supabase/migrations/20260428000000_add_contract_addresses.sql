-- Add registered address for creators
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registered_address text;

COMMENT ON COLUMN public.profiles.registered_address IS 'Permanent/Legal address of the creator for contract generation';

-- Add company address for brands if brands table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'brands' AND schemaname = 'public'
  ) THEN
    EXECUTE 'ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS company_address text';
    EXECUTE 'COMMENT ON COLUMN public.brands.company_address IS ''Registered office address of the company for contract generation''';
  ELSE
    RAISE NOTICE 'brands table does not exist, skipping migration';
  END IF;
END
$$;
