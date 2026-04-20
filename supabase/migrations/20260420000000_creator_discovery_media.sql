-- Create Creator Discovery Media Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-discovery',
  'creator-discovery',
  true, -- Public bucket for fast loading
  10485760, -- 10MB file size limit
  ARRAY['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png']::text[];

-- Add Discovery Columns to Profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discovery_video_url text,
  ADD COLUMN IF NOT EXISTS portfolio_videos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS discovery_card_image text;

-- Add indexes for performance in discovery lookups
CREATE INDEX IF NOT EXISTS idx_profiles_discovery_video ON public.profiles (discovery_video_url) WHERE discovery_video_url IS NOT NULL;
