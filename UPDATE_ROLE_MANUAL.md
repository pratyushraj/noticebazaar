# Manual Role Update Guide

Since the script requires Supabase credentials, here's how to update the role manually:

## Option 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Table Editor:**
   - Click on **Table Editor** in the left sidebar
   - Select the **`profiles`** table

3. **Find the User:**
   - Look for the row where the user's email is `pratyushraj@outlook.com`
   - You can search/filter by email if needed

4. **Update the Role:**
   - Click on the row to edit it
   - Find the `role` column
   - Change the value from `client` to `creator`
   - Click **Save** or press Enter

5. **Verify:**
   - The `role` column should now show `creator`
   - If `onboarding_complete` is `false`, the user will see onboarding first
   - If `onboarding_complete` is `true`, the user will go directly to Creator Dashboard

## Option 2: SQL Query (Advanced)

If you prefer SQL, run this in the Supabase SQL Editor:

```sql
-- Update user role to creator
UPDATE public.profiles
SET 
  role = 'creator',
  onboarding_complete = COALESCE(onboarding_complete, false),
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'pratyushraj@outlook.com'
);

-- Verify the update
SELECT id, role, onboarding_complete, email
FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'pratyushraj@outlook.com'
);
```

## Option 3: Set Environment Variables and Run Script

If you have access to the `.env` file:

1. **Add to `.env` file:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the script:**
   ```bash
   npm run update-role -- --email pratyushraj@outlook.com --role creator
   ```

## After Updating

1. **Log out** of the application
2. **Clear browser cache** (hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`)
3. **Log back in** with `pratyushraj@outlook.com`
4. You should now see the **Creator Dashboard**!

## Troubleshooting

- **Still seeing old dashboard?** Clear browser cache and session storage
- **Redirected to onboarding?** Complete onboarding to access the dashboard
- **Role not updating?** Check that the email matches exactly in the database

