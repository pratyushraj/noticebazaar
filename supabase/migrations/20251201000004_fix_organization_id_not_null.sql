-- Make organization_id nullable in brand_deals (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brand_deals' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.brand_deals ALTER COLUMN organization_id DROP NOT NULL;
    ALTER TABLE public.brand_deals DROP CONSTRAINT IF EXISTS brand_deals_organization_id_fkey;
    -- Only add constraint if organizations table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
      ALTER TABLE public.brand_deals
        ADD CONSTRAINT brand_deals_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
