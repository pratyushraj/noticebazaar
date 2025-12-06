-- Verify that the auto-create profile trigger is active
-- This ensures all new accounts get 'creator' role by default

-- Check if the function exists
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_new_user';

-- Check if the trigger exists
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  t.tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- If trigger doesn't exist or function is missing, run the migration:
-- supabase/migrations/2025_11_27_auto_create_creator_profile.sql

