-- Create analytics_events table for tracking user events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_category TEXT DEFAULT 'general',
  metadata JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  referer TEXT,
  language TEXT,
  request_hash TEXT,
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_category ON public.analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_request_hash ON public.analytics_events(request_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_events_is_anomaly ON public.analytics_events(is_anomaly) WHERE is_anomaly = true;

-- Composite index for user + event queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event ON public.analytics_events(user_id, event_name, created_at DESC);

-- Index for metadata queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata ON public.analytics_events USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own analytics events
CREATE POLICY "Users can view their own analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert (for edge function)
CREATE POLICY "Service role can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Service role can view all (for admin dashboard)
CREATE POLICY "Service role can view all analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (true);

-- Create function to automatically clean up old events (optional, for data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete events older than 1 year (adjust as needed)
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

-- Create a view for analytics dashboard (aggregated stats)
CREATE OR REPLACE VIEW public.analytics_dashboard AS
SELECT
  event_name,
  event_category,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE is_anomaly = true) as anomaly_count,
  DATE_TRUNC('day', created_at) as event_date
FROM public.analytics_events
GROUP BY event_name, event_category, DATE_TRUNC('day', created_at);

-- Grant permissions
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.analytics_dashboard TO authenticated;

-- Add comment
COMMENT ON TABLE public.analytics_events IS 'Stores user analytics events with fraud detection and rate limiting support';
COMMENT ON COLUMN public.analytics_events.request_hash IS 'Hash of request for replay protection';
COMMENT ON COLUMN public.analytics_events.is_anomaly IS 'Flag for potentially fraudulent or anomalous events';
COMMENT ON COLUMN public.analytics_events.anomaly_reason IS 'Reason why event was flagged as anomaly';

