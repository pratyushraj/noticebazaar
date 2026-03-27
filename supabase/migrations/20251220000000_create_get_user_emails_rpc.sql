-- RPC function to get user emails from auth.users
-- This allows client-side code to fetch emails without direct access to auth.users

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id::UUID as user_id,
    u.email::TEXT as email
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
END;
$$;

COMMENT ON FUNCTION public.get_user_emails(UUID[]) IS 'Returns user emails for given user IDs. Used by admin/lawyer dashboard to display chat titles.';

