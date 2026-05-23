-- Add used_at column to deal_details_tokens if table and column exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deal_details_tokens') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'deal_details_tokens' 
            AND column_name = 'used_at'
        ) THEN
            ALTER TABLE public.deal_details_tokens 
            ADD COLUMN used_at TIMESTAMPTZ;
            RAISE NOTICE 'Added used_at column to deal_details_tokens';
        ELSE
            RAISE NOTICE 'Column used_at already exists in deal_details_tokens';
        END IF;
    ELSE
        RAISE NOTICE 'Table deal_details_tokens does not exist yet, skipping';
    END IF;
END $$;
