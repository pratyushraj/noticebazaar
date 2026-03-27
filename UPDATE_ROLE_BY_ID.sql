-- Update user role by ID
-- Use this if you have the user ID directly

-- Update the profile role to 'creator'
UPDATE public.profiles
SET 
  role = 'creator',
  onboarding_complete = COALESCE(onboarding_complete, false),
  updated_at = NOW()
WHERE id = '1f50fe20-483c-4675-b95c-e36674e1aa85';

-- Verify the update
SELECT 
  p.id,
  p.role,
  p.onboarding_complete,
  p.first_name,
  p.last_name,
  u.email,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = '1f50fe20-483c-4675-b95c-e36674e1aa85';

