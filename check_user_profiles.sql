-- Check profiles for the two user IDs
SELECT 
  id,
  role,
  first_name,
  last_name,
  onboarding_complete,
  created_at,
  updated_at
FROM profiles
WHERE id IN (
  'f5e28653-d355-4408-ae77-4ee27ae41102',
  'de7fe513-487a-4f90-bf1a-ce0e8014d6ef'
);
