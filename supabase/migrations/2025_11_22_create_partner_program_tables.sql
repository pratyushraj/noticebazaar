-- Partner Program Database Migration
-- Creates all tables for the NoticeBazaar Partner Program

-- 1. Referral Links Table
CREATE TABLE IF NOT EXISTS public.referral_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON public.referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON public.referral_links(code);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral links"
ON public.referral_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral links"
ON public.referral_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscribed boolean DEFAULT false NOT NULL,
    first_payment_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT referrals_referrer_referred_unique UNIQUE (referrer_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_subscribed ON public.referrals(subscribed);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals where they are referrer or referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update referrals"
ON public.referrals FOR UPDATE
USING (true);

-- 3. Partner Earnings Table
CREATE TABLE IF NOT EXISTS public.partner_earnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    type text NOT NULL CHECK (type IN ('cash', 'voucher', 'credit')),
    source text NOT NULL CHECK (source IN ('referral', 'milestone')),
    description text,
    tds_applied boolean DEFAULT false NOT NULL,
    tds_amount numeric DEFAULT 0 NOT NULL,
    net_amount numeric NOT NULL,
    referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
    milestone_id uuid REFERENCES public.partner_milestones(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_earnings_user_id ON public.partner_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_created_at ON public.partner_earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_type ON public.partner_earnings(type);

ALTER TABLE public.partner_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earnings"
ON public.partner_earnings FOR SELECT
USING (auth.uid() = user_id);

-- 4. Partner Stats Table (Materialized/Computed view)
CREATE TABLE IF NOT EXISTS public.partner_stats (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_referrals integer DEFAULT 0 NOT NULL,
    active_referrals integer DEFAULT 0 NOT NULL,
    total_earnings numeric DEFAULT 0 NOT NULL,
    tier text DEFAULT 'starter' NOT NULL CHECK (tier IN ('starter', 'partner', 'elite', 'pro')),
    next_payout_date timestamp with time zone,
    free_months_credit integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_stats_tier ON public.partner_stats(tier);
CREATE INDEX IF NOT EXISTS idx_partner_stats_total_earnings ON public.partner_stats(total_earnings DESC);

ALTER TABLE public.partner_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
ON public.partner_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can update partner stats"
ON public.partner_stats FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Partner Milestones Table
CREATE TABLE IF NOT EXISTS public.partner_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_name text NOT NULL,
    reward_type text NOT NULL CHECK (reward_type IN ('voucher', 'credit')),
    reward_value numeric NOT NULL,
    achieved_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT partner_milestones_user_milestone_unique UNIQUE (user_id, milestone_name)
);

CREATE INDEX IF NOT EXISTS idx_partner_milestones_user_id ON public.partner_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_milestones_achieved_at ON public.partner_milestones(achieved_at DESC);

ALTER TABLE public.partner_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
ON public.partner_milestones FOR SELECT
USING (auth.uid() = user_id);

-- Add free_months_credit column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS free_months_credit integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.free_months_credit IS 'Free months credit earned from referrals';

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_uuid uuid)
RETURNS text AS $$
DECLARE
    code text;
    exists_check boolean;
BEGIN
    -- Try to use user's existing referral_code from profiles if available
    SELECT referral_code INTO code FROM public.profiles WHERE id = user_uuid AND referral_code IS NOT NULL;
    
    IF code IS NOT NULL THEN
        -- Check if referral link already exists for this code
        SELECT EXISTS(SELECT 1 FROM public.referral_links WHERE code = code) INTO exists_check;
        IF NOT exists_check THEN
            RETURN code;
        END IF;
    END IF;
    
    -- Generate new code: NB-XXXXXX format
    LOOP
        code := 'NB-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_uuid::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT) FROM 1 FOR 6));
        SELECT EXISTS(SELECT 1 FROM public.referral_links WHERE code = code) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create referral link for user
CREATE OR REPLACE FUNCTION get_or_create_referral_link(user_uuid uuid)
RETURNS text AS $$
DECLARE
    link_code text;
BEGIN
    -- Check if referral link exists
    SELECT code INTO link_code FROM public.referral_links WHERE user_id = user_uuid LIMIT 1;
    
    IF link_code IS NULL THEN
        -- Generate new code
        link_code := generate_referral_code(user_uuid);
        
        -- Create referral link
        INSERT INTO public.referral_links (user_id, code)
        VALUES (user_uuid, link_code)
        ON CONFLICT (code) DO NOTHING;
        
        -- If conflict, fetch existing
        SELECT code INTO link_code FROM public.referral_links WHERE user_id = user_uuid LIMIT 1;
    END IF;
    
    RETURN link_code;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize partner stats
CREATE OR REPLACE FUNCTION initialize_partner_stats(user_uuid uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.partner_stats (user_id, total_referrals, active_referrals, total_earnings, tier)
    VALUES (user_uuid, 0, 0, 0, 'starter')
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

