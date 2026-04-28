-- Enable realtime for collab_requests and brand_deals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'collab_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_requests;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'brand_deals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_deals;
    END IF;
END $$;
