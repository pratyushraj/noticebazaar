-- Instagram Graph OAuth + performance snapshots
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS public.instagram_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  ig_user_id text,
  ig_username text,
  page_id text,
  page_access_token text,
  meta_user_access_token text,
  user_token_expires_at timestamptz,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_connections_ig_username
  ON public.instagram_connections(ig_username);

CREATE TABLE IF NOT EXISTS public.instagram_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ig_user_id text,
  ig_username text,
  followers_count bigint,
  engagement_rate numeric(8,6),
  median_reel_views bigint,
  avg_likes numeric(12,2),
  avg_comments numeric(12,2),
  avg_saves numeric(12,2),
  avg_shares numeric(12,2),
  sample_size integer,
  data_quality text,
  raw jsonb,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_performance_snapshots_creator_time
  ON public.instagram_performance_snapshots(creator_id, captured_at DESC);

