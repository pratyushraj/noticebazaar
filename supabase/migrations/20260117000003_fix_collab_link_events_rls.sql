-- Fix RLS policies for collab_link_events to allow service role access
-- Service role should bypass RLS, but adding explicit policy for clarity
-- NOTE: This migration requires the table to exist first (from 2026_01_16_create_collab_link_analytics.sql)

-- Check if table exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'collab_link_events'
    ) THEN
        RAISE EXCEPTION 'Table collab_link_events does not exist. Please run 2026_01_16_create_collab_link_analytics.sql first.';
    END IF;
END $$;

-- Drop existing policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Creators can view their own collab link events" ON public.collab_link_events;

-- Recreate policy for authenticated users
CREATE POLICY "Creators can view their own collab link events"
ON public.collab_link_events
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Add service role policy (though service role should bypass RLS automatically)
-- This is for explicit clarity and to ensure it works
CREATE POLICY "Service role can view all collab link events"
ON public.collab_link_events
FOR SELECT
TO service_role
USING (true);

-- Also ensure service role can select for anon (for edge cases)
-- Actually, service role bypasses RLS, so this might not be needed, but it's safe to add
COMMENT ON POLICY "Service role can view all collab link events" ON public.collab_link_events IS 
'Allows service role (backend) to query all events. Service role should bypass RLS automatically, but this policy ensures it works.';

