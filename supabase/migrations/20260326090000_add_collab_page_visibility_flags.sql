ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS collab_show_packages boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS collab_show_trust_signals boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS collab_show_audience_snapshot boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS collab_show_past_work boolean DEFAULT true;

COMMENT ON COLUMN public.profiles.collab_show_packages IS 'Whether to show packages section on the public collab page';
COMMENT ON COLUMN public.profiles.collab_show_trust_signals IS 'Whether to show trust signals and why-brands-book sections on the public collab page';
COMMENT ON COLUMN public.profiles.collab_show_audience_snapshot IS 'Whether to show audience snapshot sections on the public collab page';
COMMENT ON COLUMN public.profiles.collab_show_past_work IS 'Whether to show past work and proof sections on the public collab page';
