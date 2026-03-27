-- Add the new column
ALTER TABLE public.profiles
ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;

-- Update existing users to have onboarding_complete = TRUE if they are not 'creator'
-- Assuming existing users (client, admin, ca) are already onboarded.
UPDATE public.profiles
SET onboarding_complete = TRUE
WHERE role IN ('client', 'admin', 'chartered_accountant');

-- Ensure the new 'creator' role is allowed in the RLS policy (if using a check based on role)
-- If your RLS policy is based purely on `auth.uid() = id`, this step is less critical, 
-- but it's good practice to ensure the table structure supports the new role.