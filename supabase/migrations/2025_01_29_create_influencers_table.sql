-- Influencers table for Creator Armour Influencer Finder Agent
-- Stores discovered influencers with their metadata and fit scores
-- Production-ready with proper RLS, indexes, and status tracking

-- Create status enum (idempotent)
DO $$ BEGIN
    CREATE TYPE influencer_status AS ENUM ('new', 'contacted', 'replied', 'not_interested', 'converted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create source enum (idempotent)
DO $$ BEGIN
    CREATE TYPE influencer_source AS ENUM ('apify', 'phantombuster', 'google', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop table if exists and recreate (for clean migration)
-- Comment out the DROP if you want to preserve existing data
-- DROP TABLE IF EXISTS public.influencers CASCADE;

CREATE TABLE IF NOT EXISTS public.influencers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_name text NOT NULL,
    instagram_handle text NOT NULL UNIQUE,
    followers integer NOT NULL CHECK (followers >= 0),
    niche text, -- AI classified niche (fitness, fashion, tech, lifestyle, UGC, etc.)
    email text,
    website text,
    manager_email text,
    fit_score integer CHECK (fit_score >= 1 AND fit_score <= 10),
    profile_link text NOT NULL,
    bio text,
    link_in_bio text,
    location text, -- India-based detection
    last_post_date date, -- Last post date for activity check
    is_active boolean DEFAULT true, -- Active account (posts in last 30 days)
    is_india_based boolean DEFAULT false, -- India-based detection
    is_relevant_niche boolean DEFAULT false, -- Relevant niche filter
    status influencer_status DEFAULT 'new' NOT NULL,
    source influencer_source DEFAULT 'manual' NOT NULL,
    -- Outreach tracking
    contacted_at timestamp with time zone,
    last_dm_sent_at timestamp with time zone,
    follow_up_due_at timestamp with time zone,
    response_status text, -- 'pending', 'replied', 'not_interested', 'converted'
    last_checked_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Metadata
    search_keywords text[], -- Keywords/hashtags used to find this creator
    classification_metadata jsonb, -- Store AI classification details
    notes text, -- Admin notes
    -- Safety & compliance
    data_source_log jsonb, -- Log of where data was collected from
    last_classification_at timestamp with time zone
);

-- Indexes for performance (optimized for common queries)
CREATE INDEX IF NOT EXISTS idx_influencers_instagram_handle ON public.influencers(instagram_handle);
CREATE INDEX IF NOT EXISTS idx_influencers_followers ON public.influencers(followers);
CREATE INDEX IF NOT EXISTS idx_influencers_fit_score ON public.influencers(fit_score);
CREATE INDEX IF NOT EXISTS idx_influencers_last_checked_at ON public.influencers(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_influencers_status ON public.influencers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_source ON public.influencers(source);
CREATE INDEX IF NOT EXISTS idx_influencers_niche ON public.influencers(niche);
CREATE INDEX IF NOT EXISTS idx_influencers_is_active ON public.influencers(is_active);
CREATE INDEX IF NOT EXISTS idx_influencers_is_india_based ON public.influencers(is_india_based);
CREATE INDEX IF NOT EXISTS idx_influencers_follow_up_due_at ON public.influencers(follow_up_due_at);
CREATE INDEX IF NOT EXISTS idx_influencers_contacted_at ON public.influencers(contacted_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_influencers_active_india_relevant 
    ON public.influencers(is_active, is_india_based, is_relevant_niche) 
    WHERE is_active = true AND is_india_based = true AND is_relevant_niche = true;

-- High fit score index (for quick filtering)
CREATE INDEX IF NOT EXISTS idx_influencers_high_fit 
    ON public.influencers(fit_score, status) 
    WHERE fit_score >= 7 AND status = 'new';

-- Follow-up due index
CREATE INDEX IF NOT EXISTS idx_influencers_follow_up_due 
    ON public.influencers(follow_up_due_at, status) 
    WHERE follow_up_due_at IS NOT NULL AND status = 'contacted';

-- Enable Row Level Security
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can manage influencers" ON public.influencers;
DROP POLICY IF EXISTS "Authenticated users can view influencers" ON public.influencers;
DROP POLICY IF EXISTS "Creators can view their own influencer data" ON public.influencers;

-- Admins can manage all influencers
CREATE POLICY "Admins can manage influencers"
ON public.influencers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Creators can only see influencers where they are the creator
-- (This assumes a relationship table exists, or we track creator_id)
-- For now, all authenticated users can view (read-only) but only admins can modify
CREATE POLICY "Authenticated users can view influencers"
ON public.influencers FOR SELECT
TO authenticated
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_influencers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_influencers_updated_at_trigger ON public.influencers;
CREATE TRIGGER update_influencers_updated_at_trigger
    BEFORE UPDATE ON public.influencers
    FOR EACH ROW
    EXECUTE FUNCTION update_influencers_updated_at();

-- Comments
COMMENT ON TABLE public.influencers IS 'Discovered influencers for Creator Armour outreach. Only public data is stored in compliance with platform policies.';
COMMENT ON COLUMN public.influencers.fit_score IS 'Fit score (1-10) based on relevance to Creator Armour';
COMMENT ON COLUMN public.influencers.status IS 'Outreach status: new, contacted, replied, not_interested, converted';
COMMENT ON COLUMN public.influencers.source IS 'Data source: apify, phantombuster, google, manual';
COMMENT ON COLUMN public.influencers.classification_metadata IS 'AI classification details and reasoning';
COMMENT ON COLUMN public.influencers.search_keywords IS 'Keywords/hashtags used to discover this influencer';
COMMENT ON COLUMN public.influencers.data_source_log IS 'Log of data sources and collection methods for compliance';
