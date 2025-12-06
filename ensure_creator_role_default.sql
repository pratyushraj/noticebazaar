-- Ensure all new accounts get 'creator' role by default
-- This script recreates the trigger if it's missing or broken

-- Step 1: Create or replace the function
-- Note: profiles table doesn't have created_at column, only updated_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, onboarding_complete, updated_at)
  VALUES (
    NEW.id,
    'creator', -- Default role for new signups
    false, -- Onboarding not complete yet - will trigger onboarding flow
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile with role ''creator'' when a new user signs up. This ensures new users are routed to the creator dashboard.';

-- Step 5: Verify it's working
SELECT 
  'Trigger created successfully' as status,
  t.tgname as trigger_name,
  c.relname as table_name,
  CASE WHEN t.tgenabled = 'O' THEN 'Enabled' ELSE 'Disabled' END as trigger_status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

