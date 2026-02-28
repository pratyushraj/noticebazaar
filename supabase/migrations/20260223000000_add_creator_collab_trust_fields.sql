-- Add creator-managed trust microcopy fields for collab landing page
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_brand_collabs_month integer,
ADD COLUMN IF NOT EXISTS campaign_slot_note text;

COMMENT ON COLUMN public.profiles.active_brand_collabs_month IS 'Creator-entered number of brands currently being handled this month';
COMMENT ON COLUMN public.profiles.campaign_slot_note IS 'Creator-entered short note about campaign slot availability/delivery quality';
