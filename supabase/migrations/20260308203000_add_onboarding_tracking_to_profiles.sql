-- Track onboarding emails sent to creators
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS onboarding_emails_sent JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_onboarding_email_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profiles.onboarding_emails_sent IS 'List of onboarding email types sent to the creator (welcome, profile_completion, link_ready)';
COMMENT ON COLUMN public.profiles.last_onboarding_email_at IS 'Timestamp of the last onboarding email sent to avoid spamming';
