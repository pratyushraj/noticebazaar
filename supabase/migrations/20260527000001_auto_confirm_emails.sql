-- Enable auto-confirming email signups for E2E testing/development convenience
-- This auto-confirms emails for newly created auth.users immediately.

CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_confirm_email();

COMMENT ON FUNCTION auto_confirm_email() IS 'Auto-confirms emails for newly signed up users instantly to bypass verification friction in E2E testing.';
