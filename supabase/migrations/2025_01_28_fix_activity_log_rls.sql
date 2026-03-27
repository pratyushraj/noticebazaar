-- ============================================================================
-- FIX ACTIVITY_LOG RLS POLICIES
-- ============================================================================
-- This migration adds missing INSERT policy for activity_log table
-- to allow authenticated users to log their own activities

-- Enable RLS if not already enabled
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_log;

-- Create INSERT policy: Users can insert activity logs where client_id matches their user ID
-- or where client_id is null (for admin/system logs)
CREATE POLICY "Users can insert their own activity logs"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if client_id matches the authenticated user's ID
  client_id = auth.uid()
  OR
  -- Allow if client_id is null (for admin/system logs)
  client_id IS NULL
);

-- Ensure SELECT policy exists (users can view their own activity logs)
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_log;

CREATE POLICY "Users can view their own activity logs"
ON public.activity_log FOR SELECT
TO authenticated
USING (
  -- Users can view logs where they are the client
  client_id = auth.uid()
  OR
  -- Admins can view all logs
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Ensure UPDATE policy exists (users can update their own activity logs)
DROP POLICY IF EXISTS "Users can update their own activity logs" ON public.activity_log;

CREATE POLICY "Users can update their own activity logs"
ON public.activity_log FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Ensure DELETE policy exists (users can delete their own activity logs)
DROP POLICY IF EXISTS "Users can delete their own activity logs" ON public.activity_log;

CREATE POLICY "Users can delete their own activity logs"
ON public.activity_log FOR DELETE
TO authenticated
USING (client_id = auth.uid());

