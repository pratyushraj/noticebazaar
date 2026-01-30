-- Create collab_link_events table for analytics tracking
CREATE TABLE IF NOT EXISTS public.collab_link_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('view', 'submit')),
    request_id uuid REFERENCES public.collab_requests(id) ON DELETE SET NULL,
    device_type text CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
    utm_source text,
    utm_medium text,
    utm_campaign text,
    ip_hash text, -- Hashed IP for privacy (first 3 octets only)
    user_agent_hash text, -- Hashed user agent for device detection
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_collab_link_events_creator_id ON public.collab_link_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_link_events_created_at ON public.collab_link_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_link_events_type ON public.collab_link_events(event_type);
CREATE INDEX IF NOT EXISTS idx_collab_link_events_creator_type_date ON public.collab_link_events(creator_id, event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.collab_link_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Creators can view their own collab link events" ON public.collab_link_events;
DROP POLICY IF EXISTS "Public can track collab link events" ON public.collab_link_events;

-- RLS Policy: Creators can view their own analytics events
CREATE POLICY "Creators can view their own collab link events"
ON public.collab_link_events
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- RLS Policy: Public can insert events (for anonymous tracking)
CREATE POLICY "Public can track collab link events"
ON public.collab_link_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Function to hash IP address (privacy-friendly)
CREATE OR REPLACE FUNCTION hash_ip(ip_address text)
RETURNS text AS $$
BEGIN
    -- Hash only first 3 octets for privacy (e.g., 192.168.1.xxx)
    -- This allows approximate location tracking without exposing exact IP
    IF ip_address IS NULL OR ip_address = '' THEN
        RETURN NULL;
    END IF;
    
    -- Extract first 3 octets
    DECLARE
        parts text[];
        hashed text;
    BEGIN
        parts := string_to_array(ip_address, '.');
        IF array_length(parts, 1) >= 3 THEN
            hashed := parts[1] || '.' || parts[2] || '.' || parts[3] || '.xxx';
        ELSE
            -- For IPv6 or other formats, hash the whole thing
            hashed := encode(digest(ip_address, 'sha256'), 'hex');
            hashed := substring(hashed, 1, 16) || '...';
        END IF;
        RETURN hashed;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to detect device type from user agent
CREATE OR REPLACE FUNCTION detect_device_type(user_agent text)
RETURNS text AS $$
BEGIN
    IF user_agent IS NULL OR user_agent = '' THEN
        RETURN 'unknown';
    END IF;
    
    -- Simple device detection (can be enhanced)
    IF user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN
        RETURN 'mobile';
    ELSIF user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN
        RETURN 'tablet';
    ELSIF user_agent ILIKE '%desktop%' OR user_agent ILIKE '%windows%' OR user_agent ILIKE '%macintosh%' OR user_agent ILIKE '%linux%' THEN
        RETURN 'desktop';
    ELSE
        RETURN 'unknown';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.collab_link_events IS 'Analytics events for collaboration link (page views and submissions)';
COMMENT ON COLUMN public.collab_link_events.ip_hash IS 'Privacy-friendly hashed IP (first 3 octets only)';
COMMENT ON COLUMN public.collab_link_events.user_agent_hash IS 'Hashed user agent for device type detection';
COMMENT ON COLUMN public.collab_link_events.utm_source IS 'UTM source parameter from URL';
COMMENT ON COLUMN public.collab_link_events.event_type IS 'Type of event: view (page view) or submit (form submission)';

