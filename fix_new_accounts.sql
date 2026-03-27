-- Fix new accounts that don't have creator role
-- This script checks and fixes profiles for the two user IDs

-- First, check current status
SELECT 
  id,
  role,
  first_name,
  last_name,
  onboarding_complete,
  updated_at
FROM profiles
WHERE id IN (
  'f5e28653-d355-4408-ae77-4ee27ae41102',
  'de7fe513-487a-4f90-bf1a-ce0e8014d6ef'
);

-- Check if users exist in auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE id IN (
  'f5e28653-d355-4408-ae77-4ee27ae41102',
  'de7fe513-487a-4f90-bf1a-ce0e8014d6ef'
);

-- Fix: Create or update profiles with 'creator' role
-- This will create profiles if they don't exist, or update role if they do
INSERT INTO public.profiles (id, role, onboarding_complete, updated_at)
SELECT 
  u.id,
  'creator',
  false, -- Allow them to see dashboard even if onboarding not complete
  NOW()
FROM auth.users u
WHERE u.id IN (
  'f5e28653-d355-4408-ae77-4ee27ae41102',
  'de7fe513-487a-4f90-bf1a-ce0e8014d6ef'
)
ON CONFLICT (id) 
DO UPDATE SET
  role = 'creator',
  updated_at = NOW();

-- Verify the fix
SELECT 
  id,
  role,
  first_name,
  last_name,
  onboarding_complete,
  updated_at
FROM profiles
WHERE id IN (
  'f5e28653-d355-4408-ae77-4ee27ae41102',
  'de7fe513-487a-4f90-bf1a-ce0e8014d6ef'
);

