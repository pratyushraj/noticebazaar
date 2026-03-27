-- Creator-configurable overrides for public collab page display
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS collab_brands_count_override integer,
ADD COLUMN IF NOT EXISTS collab_response_hours_override integer,
ADD COLUMN IF NOT EXISTS collab_cancellations_percent_override integer,
ADD COLUMN IF NOT EXISTS collab_region_label text,
ADD COLUMN IF NOT EXISTS collab_audience_fit_note text,
ADD COLUMN IF NOT EXISTS collab_recent_activity_note text,
ADD COLUMN IF NOT EXISTS collab_audience_relevance_note text,
ADD COLUMN IF NOT EXISTS collab_delivery_reliability_note text,
ADD COLUMN IF NOT EXISTS collab_engagement_confidence_note text,
ADD COLUMN IF NOT EXISTS collab_response_behavior_note text,
ADD COLUMN IF NOT EXISTS collab_cta_trust_note text,
ADD COLUMN IF NOT EXISTS collab_cta_dm_note text,
ADD COLUMN IF NOT EXISTS collab_cta_platform_note text;

COMMENT ON COLUMN public.profiles.collab_brands_count_override IS 'Optional creator override for brand collaborations count shown on public collab page';
COMMENT ON COLUMN public.profiles.collab_response_hours_override IS 'Optional creator override for response time (hours) shown on public collab page';
COMMENT ON COLUMN public.profiles.collab_cancellations_percent_override IS 'Optional creator override for cancellation percentage shown on public collab page';
COMMENT ON COLUMN public.profiles.collab_region_label IS 'Optional creator override for audience region label shown on public collab page';
COMMENT ON COLUMN public.profiles.collab_audience_fit_note IS 'Optional creator override for audience fit note';
COMMENT ON COLUMN public.profiles.collab_recent_activity_note IS 'Optional creator override for recent activity note';
COMMENT ON COLUMN public.profiles.collab_audience_relevance_note IS 'Optional creator override for top-city relevance note';
COMMENT ON COLUMN public.profiles.collab_delivery_reliability_note IS 'Optional creator override for delivery reliability note';
COMMENT ON COLUMN public.profiles.collab_engagement_confidence_note IS 'Optional creator override for engagement confidence note';
COMMENT ON COLUMN public.profiles.collab_response_behavior_note IS 'Optional creator override for response behavior note near CTA';
COMMENT ON COLUMN public.profiles.collab_cta_trust_note IS 'Optional creator override for CTA trust note';
COMMENT ON COLUMN public.profiles.collab_cta_dm_note IS 'Optional creator override for CTA DM reassurance';
COMMENT ON COLUMN public.profiles.collab_cta_platform_note IS 'Optional creator override for CTA platform neutrality note';
