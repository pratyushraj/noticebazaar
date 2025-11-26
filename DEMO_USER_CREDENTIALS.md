# Demo User Credentials

## Quick Demo Account

**Email:** `demo@noticebazaar.com`  
**Password:** `Demo123!@#`

## Test Account (from seed script)

**Email:** `test@noticebazaar.com`  
**Password:** `Test123!@#`

## How to Create Demo User

### Option 1: Use the Seed Script (Recommended)

The seed script creates a fully configured test account with sample data:

```bash
npm run seed
```

**Requirements:**
- Set `VITE_SUPABASE_URL` in your `.env` file
- Set `VITE_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file

**What it creates:**
- ✅ User account (auto-confirmed email)
- ✅ Creator profile (onboarding complete)
- ✅ Trial activated (30 days)
- ✅ 6 sample brand deals
- ✅ Instagram handle: @testcreator
- ✅ 45K Instagram followers
- ✅ 125K YouTube subscribers

### Option 2: Create Manually via Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email:** `demo@noticebazaar.com`
   - **Password:** `Demo123!@#`
   - **Auto Confirm User:** ✅ (checked)
4. Click **"Create user"**
5. Go to **Table Editor** → **profiles**
6. Find the user's profile (or create one if it doesn't exist)
7. Update the profile:
   ```sql
   UPDATE profiles
   SET 
     role = 'creator',
     onboarding_complete = true,
     first_name = 'Demo',
     last_name = 'User',
     is_trial = true,
     trial_started_at = NOW(),
     trial_expires_at = NOW() + INTERVAL '30 days',
     trial_locked = false
   WHERE id = '<user-id-from-auth-users>';
   ```

### Option 3: Use SQL Directly

Run this SQL in Supabase SQL Editor (replace email/password as needed):

```sql
-- Create demo user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'demo@noticebazaar.com',
    crypt('Demo123!@#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    role,
    first_name,
    last_name,
    onboarding_complete,
    is_trial,
    trial_started_at,
    trial_expires_at,
    trial_locked,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'creator',
    'Demo',
    'User',
    true,
    true,
    NOW(),
    NOW() + INTERVAL '30 days',
    false,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE
  SET
    role = 'creator',
    onboarding_complete = true,
    first_name = 'Demo',
    last_name = 'User',
    is_trial = true,
    trial_started_at = NOW(),
    trial_expires_at = NOW() + INTERVAL '30 days',
    trial_locked = false;

  RAISE NOTICE 'Demo user created with ID: %', new_user_id;
END $$;
```

**Note:** The SQL approach requires the `pgcrypto` extension for password hashing. If it fails, use Option 2 (manual creation) instead.

## Login

After creating the account, you can log in at:
- **URL:** `/login`
- **Email:** `demo@noticebazaar.com` (or `test@noticebazaar.com`)
- **Password:** `Demo123!@#` (or `Test123!@#`)

## Troubleshooting

If the user can't log in:
1. Check that email is confirmed in Supabase Dashboard → Authentication → Users
2. Verify the profile exists and has `role: 'creator'`
3. Check that `onboarding_complete: true` if you want to skip onboarding

