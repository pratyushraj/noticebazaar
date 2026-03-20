-- Brand Analytics and Interaction Tracking
-- Tracks creator interactions with brands for demand signals and recommendations

-- Brand Interactions Table
CREATE TABLE IF NOT EXISTS public.brand_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    interaction_type text NOT NULL, -- 'viewed', 'bookmarked', 'applied', 'reviewed', 'clicked_opportunity'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb, -- Additional context (e.g., opportunity_id for 'applied')
    CONSTRAINT brand_interactions_unique UNIQUE (creator_id, brand_id, interaction_type, created_at)
);

CREATE INDEX IF NOT EXISTS idx_brand_interactions_creator_id ON public.brand_interactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_interactions_brand_id ON public.brand_interactions(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_interactions_type ON public.brand_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_brand_interactions_created_at ON public.brand_interactions(created_at);

-- Enable Row Level Security
ALTER TABLE public.brand_interactions ENABLE ROW LEVEL SECURITY;

-- Creators can view their own interactions
CREATE POLICY "Creators can view their own interactions"
ON public.brand_interactions FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Creators can create their own interactions
CREATE POLICY "Creators can create their own interactions"
ON public.brand_interactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Admins can view all interactions
CREATE POLICY "Admins can view all interactions"
ON public.brand_interactions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Add additional columns to brands table for analytics
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS last_opportunity_date date,
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookmark_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS application_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'mid-tier'; -- 'premium', 'mid-tier', 'niche'

-- Function to update brand interaction counts
CREATE OR REPLACE FUNCTION update_brand_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.interaction_type = 'viewed' THEN
        UPDATE public.brands
        SET view_count = view_count + 1
        WHERE id = NEW.brand_id;
    ELSIF NEW.interaction_type = 'bookmarked' THEN
        UPDATE public.brands
        SET bookmark_count = bookmark_count + 1
        WHERE id = NEW.brand_id;
    ELSIF NEW.interaction_type = 'applied' THEN
        UPDATE public.brands
        SET application_count = application_count + 1
        WHERE id = NEW.brand_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update counts
CREATE TRIGGER brand_interaction_counts_trigger
AFTER INSERT ON public.brand_interactions
FOR EACH ROW
EXECUTE FUNCTION update_brand_interaction_counts();

-- Function to get trending brands (based on recent interactions)
CREATE OR REPLACE FUNCTION get_trending_brands(limit_count integer DEFAULT 10)
RETURNS TABLE (
    brand_id uuid,
    brand_name text,
    interaction_score numeric,
    view_count integer,
    bookmark_count integer,
    application_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        (
            (COUNT(CASE WHEN bi.interaction_type = 'viewed' THEN 1 END) * 1.0) +
            (COUNT(CASE WHEN bi.interaction_type = 'bookmarked' THEN 1 END) * 3.0) +
            (COUNT(CASE WHEN bi.interaction_type = 'applied' THEN 1 END) * 5.0)
        ) / GREATEST(EXTRACT(EPOCH FROM (NOW() - MIN(bi.created_at))) / 86400, 1) as interaction_score,
        b.view_count,
        b.bookmark_count,
        b.application_count
    FROM public.brands b
    LEFT JOIN public.brand_interactions bi ON b.id = bi.brand_id
        AND bi.created_at >= NOW() - INTERVAL '7 days'
    WHERE b.status = 'active'
    GROUP BY b.id, b.name, b.view_count, b.bookmark_count, b.application_count
    ORDER BY interaction_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.brand_interactions IS 'Tracks creator interactions with brands for analytics and recommendations';
COMMENT ON COLUMN public.brand_interactions.interaction_type IS 'Type of interaction: viewed, bookmarked, applied, reviewed, clicked_opportunity';
COMMENT ON COLUMN public.brands.tier IS 'Brand tier: premium (big names), mid-tier (established), niche (small/indie)';
COMMENT ON COLUMN public.brands.last_opportunity_date IS 'Date when brand last posted an opportunity';

