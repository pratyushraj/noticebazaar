-- Add deal_templates to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deal_templates jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.deal_templates IS 'Customized collaboration packages for the creator';
