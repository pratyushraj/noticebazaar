-- Brands table (master brand directory)
-- This table stores all brands that creators can discover and collaborate with

CREATE TABLE IF NOT EXISTS public.brands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    logo_url text,
    industry text NOT NULL,
    description text,
    website_url text,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Metadata
    budget_min numeric,
    budget_max numeric,
    avg_payment_time_days integer,
    late_payment_reports integer DEFAULT 0,
    -- Source tracking
    source text DEFAULT 'manual', -- 'manual', 'marketplace', 'scraped', 'self-signup'
    external_id text, -- ID from external marketplace if applicable
    -- Status
    status text DEFAULT 'active', -- 'active', 'inactive', 'pending_verification'
    CONSTRAINT brands_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_brands_industry ON public.brands(industry);
CREATE INDEX IF NOT EXISTS idx_brands_verified ON public.brands(verified);
CREATE INDEX IF NOT EXISTS idx_brands_status ON public.brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_source ON public.brands(source);

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated creators (only active brands)
CREATE POLICY "Creators can view all active brands"
ON public.brands FOR SELECT
TO authenticated
USING (status = 'active');

-- Admins can manage brands
CREATE POLICY "Admins can manage brands"
ON public.brands FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Brands can manage their own profile (if they have a profile linked)
-- This would require a brands.profile_id column if you want brand self-management
-- For now, only admins can manage

COMMENT ON TABLE public.brands IS 'Master directory of brands available for creator collaborations';
COMMENT ON COLUMN public.brands.source IS 'How the brand was added: manual (admin), marketplace (imported), scraped (web scraping), self-signup (brand registered themselves)';
COMMENT ON COLUMN public.brands.status IS 'Brand status: active (visible to creators), inactive (hidden), pending_verification (awaiting admin approval)';

