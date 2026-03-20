-- Ensure all social media columns exist in the profiles table
-- These commands will only add the columns if they are not already present.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_channel_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_profile_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_handle text;

-- Force a schema refresh by adding and immediately dropping a dummy column.
-- This is a common trick to make Supabase update its schema cache.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS _dyad_dummy_column_to_refresh_schema boolean DEFAULT FALSE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS _dyad_dummy_column_to_refresh_schema;