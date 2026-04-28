-- Allow brands to view collab requests sent to their email
-- This is necessary for the Brand Dashboard to fetch data and for Realtime to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'collab_requests' 
        AND policyname = 'Brands can view their own collab requests'
    ) THEN
        CREATE POLICY "Brands can view their own collab requests"
        ON public.collab_requests
        FOR SELECT
        TO authenticated
        USING (
            brand_email = auth.jwt() ->> 'email'
            OR creator_id = auth.uid()
        );
    END IF;

    -- Also ensure brands can view their own deals in brand_deals (backup to existing policy)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'brand_deals' 
        AND policyname = 'Brands can view their own deals by email'
    ) THEN
        CREATE POLICY "Brands can view their own deals by email"
        ON public.brand_deals
        FOR SELECT
        TO authenticated
        USING (
            brand_email = auth.jwt() ->> 'email'
            OR brand_id = auth.uid()
            OR creator_id = auth.uid()
        );
    END IF;
END $$;
