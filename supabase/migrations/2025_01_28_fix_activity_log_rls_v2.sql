-- ============================================================================
-- FIX ACTIVITY_LOG RLS POLICIES (V2 - More Permissive)
-- ============================================================================
-- This migration fixes the INSERT policy to be more permissive
-- The issue is that the policy might be too restrictive

-- Enable RLS if not already enabled
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Users can update their own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Users can delete their own activity logs" ON public.activity_log;

-- Create a more permissive INSERT policy
-- Allow authenticated users to insert activity logs where:
-- 1. client_id matches their user ID, OR
-- 2. client_id is null, OR  
-- 3. client_id matches any user (for cross-user activity logging)
CREATE POLICY "Users can insert activity logs"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow all authenticated users to insert

-- Create SELECT policy: Users can view their own activity logs or admin can view all
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

-- Create UPDATE policy: Users can update their own activity logs
CREATE POLICY "Users can update their own activity logs"
ON public.activity_log FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Create DELETE policy: Users can delete their own activity logs
CREATE POLICY "Users can delete their own activity logs"
ON public.activity_log FOR DELETE
TO authenticated
USING (client_id = auth.uid());

