ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completion integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS packages_added boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS past_work_added boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_upi text,
  ADD COLUMN IF NOT EXISTS media_kit_url text,
  ADD COLUMN IF NOT EXISTS intro_line text;

-- Update profile_completion and intro_line to coalesce existing fields
UPDATE public.profiles
SET
  profile_completion = COALESCE(profile_completion, storefront_completion, 0),
  intro_line = COALESCE(intro_line, collab_intro_line),
  payout_upi = COALESCE(payout_upi, upi_id, bank_upi),
  packages_added = CASE WHEN COALESCE(packages, '[]'::jsonb) != '[]'::jsonb THEN true ELSE false END,
  past_work_added = CASE WHEN COALESCE(past_collabs, '[]'::jsonb) != '[]'::jsonb OR COALESCE(past_work_items, '[]'::jsonb) != '[]'::jsonb THEN true ELSE false END
WHERE role = 'creator';

COMMENT ON COLUMN public.profiles.profile_completion IS 'Overall profile completion percentage';
COMMENT ON COLUMN public.profiles.packages_added IS 'Whether the creator has added custom packages';
COMMENT ON COLUMN public.profiles.past_work_added IS 'Whether the creator has added past work examples';
COMMENT ON COLUMN public.profiles.payout_upi IS 'UPI ID used for payouts';
COMMENT ON COLUMN public.profiles.media_kit_url IS 'External link to the creator''s media kit';
COMMENT ON COLUMN public.profiles.intro_line IS 'Short intro line for the storefront';
