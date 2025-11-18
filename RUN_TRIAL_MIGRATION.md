# Run Trial Fields Migration

The trial system requires new columns in the `profiles` table. Follow these steps:

## Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/migrations/2025_11_20_add_trial_fields_to_profiles.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

## Option 2: Run via Supabase CLI

If you have Supabase CLI installed and linked to your project:

```bash
supabase db push
```

Or to run a specific migration:

```bash
supabase migration up
```

## Quick SQL Copy-Paste

Copy and paste this SQL directly into Supabase SQL Editor:

```sql
-- Add trial fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_locked BOOLEAN DEFAULT FALSE;

-- Add comment to fields
COMMENT ON COLUMN public.profiles.is_trial IS 'Whether user is currently on a free trial';
COMMENT ON COLUMN public.profiles.trial_started_at IS 'When the trial started';
COMMENT ON COLUMN public.profiles.trial_expires_at IS 'When the trial expires (30 days from start)';
COMMENT ON COLUMN public.profiles.trial_locked IS 'Whether trial has expired and account is locked';

-- Create index for trial queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires_at ON public.profiles(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_locked ON public.profiles(trial_locked);
```

## Verify Migration

After running the migration, verify the columns were added:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `profiles` table
3. Check that it has the following new columns:
   - `is_trial` (boolean, default: false)
   - `trial_started_at` (timestamp)
   - `trial_expires_at` (timestamp)
   - `trial_locked` (boolean, default: false)

## Troubleshooting

If you see a 400 error when fetching profiles:
- The migration hasn't been run yet
- The code will fallback gracefully, but you should run the migration for full functionality
- Refresh your browser after running the migration

