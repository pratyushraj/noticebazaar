-- Idempotent: only add creator_id if brand_deals table exists and column is missing
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_deals'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'brand_deals'
        AND column_name = 'creator_id'
    ) THEN
      ALTER TABLE public.brand_deals ADD COLUMN IF NOT EXISTS creator_id uuid NULL;
      ALTER TABLE public.brand_deals
        ADD CONSTRAINT fk_creator_id
        FOREIGN KEY (creator_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;