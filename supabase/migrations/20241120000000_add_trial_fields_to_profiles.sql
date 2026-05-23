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

