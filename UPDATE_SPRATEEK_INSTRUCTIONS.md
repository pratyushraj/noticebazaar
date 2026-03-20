# Update sprateek7599@gmail.com to Creator Role

**User Details:**
- Email: `sprateek7599@gmail.com`
- User ID: `2195d667-81cc-4d73-bfe3-c55e0e529664`
- Target Role: `creator`

## Option 1: Run SQL Script in Supabase (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor:**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the SQL Script:**
   - Copy the contents of `UPDATE_SPRATEEK_TO_CREATOR.sql`
   - Paste into the SQL Editor
   - Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)

4. **Verify:**
   - Check the results of Step 3 query
   - Should show `role = 'creator'`

## Option 2: Use the Update Role Script

If you have environment variables set up:

```bash
npm run update-role -- --email sprateek7599@gmail.com --role creator
```

Or with environment variables:

```bash
USER_EMAIL=sprateek7599@gmail.com USER_ROLE=creator npm run update-role
```

## Option 3: Manual Update via Supabase Dashboard

1. Go to **Table Editor** → **profiles** table
2. Find the row with user ID `2195d667-81cc-4d73-bfe3-c55e0e529664`
3. Edit the `role` column and change it to `creator`
4. Save the changes

## After Updating

1. The user should **log out** and **log back in**
2. They will be redirected to the **Creator Dashboard**
3. If `onboarding_complete` is `false`, they'll see the onboarding flow first
4. If `onboarding_complete` is `true`, they'll go directly to the Creator Dashboard

## Verification Query

Run this to verify the update:

```sql
SELECT 
  p.id,
  p.role,
  p.onboarding_complete,
  u.email,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = '2195d667-81cc-4d73-bfe3-c55e0e529664';
```

Expected result:
- `role` should be `creator`
- `email` should be `sprateek7599@gmail.com`

