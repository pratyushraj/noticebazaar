-- Add used_at column to deal_details_tokens if it doesn't exist
-- This fixes the PGRST204 error: "Could not find the 'used_at' column"

-- Check if column exists, if not add it
DO $$ 
BEGIN
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
END $$;

