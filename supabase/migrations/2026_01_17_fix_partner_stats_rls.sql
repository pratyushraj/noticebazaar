-- Fix partner_stats RLS policy to handle missing rows gracefully
-- The issue: 406 error occurs when querying partner_stats for a user that doesn't have a row yet
-- Solution: Allow SELECT even when no row exists, and ensure the policy works correctly

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own stats" ON public.partner_stats;

-- Recreate SELECT policy that allows users to query their own stats
-- This policy will return empty result if no row exists, rather than 406 error
CREATE POLICY "Users can view their own stats"
ON public.partner_stats FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also ensure the table allows SELECT queries even when no rows exist
-- The policy should not block the query itself, just filter results
COMMENT ON POLICY "Users can view their own stats" ON public.partner_stats IS 
'Allows authenticated users to query their own partner stats. Returns empty result if no row exists.';

