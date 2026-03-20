
-- Create brand_feedback table
CREATE TABLE IF NOT EXISTS public.brand_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.brand_deals(id) NOT NULL UNIQUE,
    brand_name TEXT NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) NOT NULL,
    
    -- Feedback Metrics (Boolean Yes/No questions)
    delivered_on_time BOOLEAN DEFAULT false,
    followed_brief BOOLEAN DEFAULT false,
    smooth_communication BOOLEAN DEFAULT false,
    content_brand_ready BOOLEAN DEFAULT false,
    easy_to_work_with BOOLEAN DEFAULT false,
    would_collaborate_again BOOLEAN DEFAULT false,
    would_recommend BOOLEAN DEFAULT false,
    
    additional_comments TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_feedback_creator_id ON public.brand_feedback(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_feedback_deal_id ON public.brand_feedback(deal_id);

-- Enable RLS
ALTER TABLE public.brand_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read feedback (for trust metrics aggregation)
CREATE POLICY "Public read access to feedback" 
ON public.brand_feedback FOR SELECT 
USING (true);

-- Backend function/service role will rely on service key, but for anon/authenticated inputs:
-- Ideally linked to the brand who owns the deal. 
-- Since we use tokens for brand access usually, we might allow public insert if they have the deal ID (validated by API).
-- For now, open insert for authenticated users or anon (API handles semantic checks)
CREATE POLICY "Allow insert feedback" 
ON public.brand_feedback FOR INSERT 
WITH CHECK (true);
