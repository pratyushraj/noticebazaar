-- Auto-create profile with 'creator' role when a new user signs up
-- This ensures all new signups get a profile and are routed to creator onboarding

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, onboarding_complete, created_at, updated_at)
  VALUES (
    NEW.id,
    'creator', -- Default role for new signups from the signup page
    FALSE, -- Onboarding not complete yet - will trigger onboarding flow
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile with role ''creator'' when a new user signs up. This ensures new users are routed to the creator onboarding flow.';

