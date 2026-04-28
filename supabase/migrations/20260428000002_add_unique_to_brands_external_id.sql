-- Ensure brands table has a unique constraint on external_id for upsert operations
-- This fixes the "there is no unique or exclusion constraint matching the ON CONFLICT specification" error

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'brands_external_id_key'
    ) THEN
        ALTER TABLE public.brands 
        ADD CONSTRAINT brands_external_id_key UNIQUE (external_id);
    END IF;
END $$;
