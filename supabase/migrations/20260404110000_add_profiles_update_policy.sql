-- Migration: Add UPDATE policy for profiles so users can update their own profile
-- This fixes the "Unable to save creator profile" error when Supabase RLS blocks writes

-- Check if RLS is enabled on profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'profiles table does not exist, skipping migration';
    RETURN;
  END IF;
END
$$;

-- Ensure RLS is enabled on profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing UPDATE policies if they exist (they might be overly restrictive)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.profiles;

-- Create a proper UPDATE policy: users can update their own profile row
-- This policy allows authenticated users to update any column in their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also ensure SELECT policy exists for users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Service role (used by backend API routes) should have full access via service_role
-- This is typically already set up by Supabase, but ensure it exists
DROP POLICY IF EXISTS "Service role can do anything on profiles" ON public.profiles;

CREATE POLICY "Service role can do anything on profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
