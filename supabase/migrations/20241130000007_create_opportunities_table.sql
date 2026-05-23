-- Opportunities table (active campaigns from brands)
-- Each brand can have multiple opportunities (campaigns) that creators can apply to

CREATE TABLE IF NOT EXISTS public.opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    deliverable_type text NOT NULL, -- 'reel', 'post', 'story', 'video', 'blog', 'integration', etc.
    payout_min numeric NOT NULL,
    payout_max numeric NOT NULL,
    deadline date NOT NULL,
    status text DEFAULT 'open', -- 'open', 'closed', 'filled', 'expired'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Requirements
    min_followers integer,
    required_platforms text[], -- ['instagram', 'youtube', 'tiktok', etc.]
    required_categories text[], -- ['fashion', 'fitness', 'tech', etc.]
    -- Metadata
    application_count integer DEFAULT 0,
    filled_count integer DEFAULT 0,
    -- Additional details
    campaign_start_date date,
    campaign_end_date date,
    deliverables_description text -- Detailed description of what's expected
);

CREATE INDEX IF NOT EXISTS idx_opportunities_brand_id ON public.opportunities(brand_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_deliverable_type ON public.opportunities(deliverable_type);

-- Enable Row Level Security
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Creators can view open opportunities
CREATE POLICY "Creators can view open opportunities"
ON public.opportunities FOR SELECT
TO authenticated
USING (status = 'open' AND deadline >= CURRENT_DATE);

-- Admins can manage all opportunities
CREATE POLICY "Admins can manage opportunities"
ON public.opportunities FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Function to automatically update status to 'expired' when deadline passes
CREATE OR REPLACE FUNCTION update_expired_opportunities()
RETURNS void AS $$
BEGIN
    UPDATE public.opportunities
    SET status = 'expired'
    WHERE status = 'open' AND deadline < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job (if using pg_cron) or call this function periodically
-- You can also trigger this on opportunity queries

COMMENT ON TABLE public.opportunities IS 'Active campaigns and collaboration opportunities from brands';
COMMENT ON COLUMN public.opportunities.deliverable_type IS 'Type of content required: reel, post, story, video, blog, integration, etc.';
COMMENT ON COLUMN public.opportunities.status IS 'Opportunity status: open (accepting applications), closed (manually closed), filled (all slots taken), expired (deadline passed)';

