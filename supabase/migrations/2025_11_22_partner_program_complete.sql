-- ================================================
-- NoticeBazaar Partner Program - Complete Migration
-- ================================================
-- This migration creates all tables, functions, and policies
-- for the Partner Program. It is idempotent and can be run multiple times.
-- ================================================

-- ================================================
-- 1. REFERRAL_LINKS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.referral_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON public.referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON public.referral_links(code);

-- Enable RLS
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own referral links" ON public.referral_links;
DROP POLICY IF EXISTS "Users can insert their own referral links" ON public.referral_links;
DROP POLICY IF EXISTS "Users can update their own referral links" ON public.referral_links;

-- RLS Policies
CREATE POLICY "Users can view their own referral links"
ON public.referral_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral links"
ON public.referral_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral links"
ON public.referral_links FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 2. REFERRALS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscribed boolean DEFAULT false NOT NULL,
    first_payment_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT referrals_referrer_referred_unique UNIQUE (referrer_id, referred_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_subscribed ON public.referrals(subscribed);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at DESC);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view referrals where they are referrer or referred" ON public.referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;

-- RLS Policies
CREATE POLICY "Users can view referrals where they are referrer or referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update referrals"
ON public.referrals FOR UPDATE
USING (true);

-- ================================================
-- 3. PARTNER_MILESTONES TABLE (must be created before partner_earnings)
-- ================================================
CREATE TABLE IF NOT EXISTS public.partner_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_name text NOT NULL,
    reward_type text NOT NULL CHECK (reward_type IN ('voucher', 'credit')),
    reward_value numeric NOT NULL,
    achieved_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT partner_milestones_user_milestone_unique UNIQUE (user_id, milestone_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_milestones_user_id ON public.partner_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_milestones_achieved_at ON public.partner_milestones(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_milestones_milestone_name ON public.partner_milestones(milestone_name);

-- Enable RLS
ALTER TABLE public.partner_milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own milestones" ON public.partner_milestones;
DROP POLICY IF EXISTS "System can insert milestones" ON public.partner_milestones;

-- RLS Policies
CREATE POLICY "Users can view their own milestones"
ON public.partner_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert milestones"
ON public.partner_milestones FOR INSERT
WITH CHECK (true);

-- ================================================
-- 4. PARTNER_EARNINGS TABLE
-- ================================================
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_earnings_user_id ON public.partner_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_created_at ON public.partner_earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_type ON public.partner_earnings(type);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_source ON public.partner_earnings(source);

-- Enable RLS
ALTER TABLE public.partner_earnings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.partner_earnings;
DROP POLICY IF EXISTS "System can insert earnings" ON public.partner_earnings;

-- RLS Policies
CREATE POLICY "Users can view their own earnings"
ON public.partner_earnings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings"
ON public.partner_earnings FOR INSERT
WITH CHECK (true);

-- ================================================
-- 5. PARTNER_STATS TABLE
-- ================================================
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_stats_tier ON public.partner_stats(tier);
CREATE INDEX IF NOT EXISTS idx_partner_stats_total_earnings ON public.partner_stats(total_earnings DESC);
CREATE INDEX IF NOT EXISTS idx_partner_stats_active_referrals ON public.partner_stats(active_referrals DESC);

-- Enable RLS
ALTER TABLE public.partner_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own stats" ON public.partner_stats;
DROP POLICY IF EXISTS "System can update partner stats" ON public.partner_stats;

-- RLS Policies
CREATE POLICY "Users can view their own stats"
ON public.partner_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can update partner stats"
ON public.partner_stats FOR ALL
USING (true)
WITH CHECK (true);

-- ================================================
-- 6. UPDATE PROFILES TABLE
-- ================================================
-- Add free_months_credit column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS free_months_credit integer DEFAULT 0;

-- Add partner_tier column if it doesn't exist (for quick access, synced with partner_stats)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS partner_tier text DEFAULT 'starter';

-- Add check constraint for partner_tier
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_partner_tier_check'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_partner_tier_check 
        CHECK (partner_tier IN ('starter', 'partner', 'elite', 'pro'));
    END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.profiles.free_months_credit IS 'Free months credit earned from referrals';
COMMENT ON COLUMN public.profiles.partner_tier IS 'Partner tier (synced with partner_stats.tier)';

-- ================================================
-- 7. HELPER FUNCTIONS
-- ================================================

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_uuid uuid)
RETURNS text AS $$
DECLARE
    code text;
    exists_check boolean;
BEGIN
    -- Try to use user's existing referral_code from profiles if available
    SELECT referral_code INTO code FROM public.profiles 
    WHERE id = user_uuid AND referral_code IS NOT NULL;
    
    IF code IS NOT NULL THEN
        -- Check if referral link already exists for this code
        SELECT EXISTS(SELECT 1 FROM public.referral_links WHERE code = code) INTO exists_check;
        IF NOT exists_check THEN
            RETURN code;
        END IF;
    END IF;
    
    -- Generate new code: NB-XXXXXX format
    LOOP
        code := 'NB-' || UPPER(SUBSTRING(
            MD5(RANDOM()::TEXT || user_uuid::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT) 
            FROM 1 FOR 6
        ));
        SELECT EXISTS(SELECT 1 FROM public.referral_links WHERE code = code) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize partner stats
CREATE OR REPLACE FUNCTION initialize_partner_stats(user_uuid uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.partner_stats (user_id, total_referrals, active_referrals, total_earnings, tier)
    VALUES (user_uuid, 0, 0, 0, 'starter')
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply TDS (Section 194-O rules)
CREATE OR REPLACE FUNCTION apply_tds(amount numeric, user_yearly_total numeric)
RETURNS TABLE(tds_applied boolean, tds_amount numeric, net_amount numeric) AS $$
DECLARE
    yearly_threshold numeric := 15000; -- ₹15,000 threshold
    tds_rate numeric := 0.05; -- 5% TDS rate
    should_apply_tds boolean;
    calculated_tds numeric;
    calculated_net numeric;
BEGIN
    -- If yearly total exceeds threshold, apply TDS
    should_apply_tds := (user_yearly_total + amount) > yearly_threshold;
    
    IF should_apply_tds THEN
        -- Only apply TDS on amount above threshold (if applicable)
        IF user_yearly_total < yearly_threshold THEN
            calculated_tds := (user_yearly_total + amount - yearly_threshold) * tds_rate;
        ELSE
            calculated_tds := amount * tds_rate;
        END IF;
        calculated_net := amount - calculated_tds;
    ELSE
        calculated_tds := 0;
        calculated_net := amount;
    END IF;
    
    RETURN QUERY SELECT should_apply_tds, calculated_tds, calculated_net;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(p_user_id uuid, subscription_amount numeric)
RETURNS numeric AS $$
DECLARE
    current_tier text;
    commission_rate numeric;
    commission_amount numeric;
BEGIN
    -- Get current tier
    SELECT tier INTO current_tier FROM public.partner_stats WHERE user_id = p_user_id;
    
    IF current_tier IS NULL THEN
        current_tier := 'starter';
    END IF;
    
    -- Set commission rate based on tier
    CASE current_tier
        WHEN 'starter' THEN commission_rate := 0.0; -- No commission for starter
        WHEN 'partner' THEN commission_rate := 0.20; -- 20%
        WHEN 'elite' THEN commission_rate := 0.25; -- 25%
        WHEN 'pro' THEN commission_rate := 0.30; -- 30%
        ELSE commission_rate := 0.0;
    END CASE;
    
    commission_amount := subscription_amount * commission_rate;
    
    RETURN commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update partner tier
CREATE OR REPLACE FUNCTION update_partner_tier(p_user_id uuid)
RETURNS text AS $$
DECLARE
    total_paid_referrals integer;
    new_tier text;
    old_tier text;
BEGIN
    -- Count paid referrals
    SELECT COUNT(*) INTO total_paid_referrals
    FROM public.referrals
    WHERE referrer_id = p_user_id AND subscribed = true;
    
    -- Get current tier
    SELECT tier INTO old_tier FROM public.partner_stats WHERE user_id = p_user_id;
    
    -- Determine new tier based on paid referrals
    IF total_paid_referrals >= 100 THEN
        new_tier := 'pro';
    ELSIF total_paid_referrals >= 10 THEN
        new_tier := 'elite';
    ELSIF total_paid_referrals >= 1 THEN
        new_tier := 'partner';
    ELSE
        new_tier := 'starter';
    END IF;
    
    -- Update tier if changed
    IF old_tier IS NULL OR old_tier != new_tier THEN
        UPDATE public.partner_stats
        SET tier = new_tier, updated_at = now()
        WHERE user_id = p_user_id;
        
        -- Initialize stats if not exists
        IF NOT FOUND THEN
            INSERT INTO public.partner_stats (user_id, tier, updated_at)
            VALUES (p_user_id, new_tier, now())
            ON CONFLICT (user_id) DO UPDATE SET tier = new_tier, updated_at = now();
        END IF;
        
        -- Sync tier to profiles table
        UPDATE public.profiles
        SET partner_tier = new_tier
        WHERE id = p_user_id;
    END IF;
    
    RETURN new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record referral commission
CREATE OR REPLACE FUNCTION record_referral_commission(
    p_referral_id uuid,
    p_subscription_amount numeric
)
RETURNS uuid AS $$
DECLARE
    v_referrer_id uuid;
    v_commission numeric;
    v_tier text;
    v_yearly_total numeric;
    v_tds_result RECORD;
    v_earning_id uuid;
BEGIN
    -- Get referrer ID
    SELECT referrer_id INTO v_referrer_id FROM public.referrals WHERE id = p_referral_id;
    
    IF v_referrer_id IS NULL THEN
        RAISE EXCEPTION 'Referral not found';
    END IF;
    
    -- Get current tier
    SELECT tier INTO v_tier FROM public.partner_stats WHERE user_id = v_referrer_id;
    IF v_tier IS NULL THEN
        v_tier := 'starter';
    END IF;
    
    -- Calculate commission
    v_commission := calculate_commission(v_referrer_id, p_subscription_amount);
    
    IF v_commission <= 0 THEN
        RETURN NULL; -- No commission for starter tier
    END IF;
    
    -- Get yearly earnings total for TDS calculation
    SELECT COALESCE(SUM(net_amount), 0) INTO v_yearly_total
    FROM public.partner_earnings
    WHERE user_id = v_referrer_id
      AND type = 'cash'
      AND created_at >= date_trunc('year', now());
    
    -- Apply TDS
    SELECT * INTO v_tds_result FROM apply_tds(v_commission, v_yearly_total);
    
    -- Insert earnings record
    INSERT INTO public.partner_earnings (
        user_id,
        amount,
        type,
        source,
        description,
        tds_applied,
        tds_amount,
        net_amount,
        referral_id
    ) VALUES (
        v_referrer_id,
        v_commission,
        'cash',
        'referral',
        'Commission from referral subscription',
        v_tds_result.tds_applied,
        v_tds_result.tds_amount,
        v_tds_result.net_amount,
        p_referral_id
    )
    RETURNING id INTO v_earning_id;
    
    -- Update partner stats
    UPDATE public.partner_stats
    SET 
        total_earnings = total_earnings + v_tds_result.net_amount,
        updated_at = now()
    WHERE user_id = v_referrer_id;
    
    -- Initialize stats if not exists
    IF NOT FOUND THEN
        INSERT INTO public.partner_stats (user_id, total_earnings, updated_at)
        VALUES (v_referrer_id, v_tds_result.net_amount, now())
        ON CONFLICT (user_id) DO UPDATE
        SET total_earnings = partner_stats.total_earnings + v_tds_result.net_amount,
            updated_at = now();
    END IF;
    
    -- Update tier
    PERFORM update_partner_tier(v_referrer_id);
    
    RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to issue voucher reward
CREATE OR REPLACE FUNCTION issue_voucher_reward(
    p_user_id uuid,
    p_milestone_name text,
    p_reward_value numeric
)
RETURNS uuid AS $$
DECLARE
    v_milestone_id uuid;
    v_earning_id uuid;
BEGIN
    -- Insert milestone record
    INSERT INTO public.partner_milestones (user_id, milestone_name, reward_type, reward_value)
    VALUES (p_user_id, p_milestone_name, 'voucher', p_reward_value)
    ON CONFLICT (user_id, milestone_name) DO NOTHING
    RETURNING id INTO v_milestone_id;
    
    IF v_milestone_id IS NULL THEN
        SELECT id INTO v_milestone_id FROM public.partner_milestones 
        WHERE user_id = p_user_id AND milestone_name = p_milestone_name;
    END IF;
    
    IF v_milestone_id IS NULL THEN
        RAISE EXCEPTION 'Failed to create milestone';
    END IF;
    
    -- Insert earnings record
    INSERT INTO public.partner_earnings (
        user_id,
        amount,
        type,
        source,
        description,
        tds_applied,
        tds_amount,
        net_amount,
        milestone_id
    ) VALUES (
        p_user_id,
        p_reward_value,
        'voucher',
        'milestone',
        'Voucher reward: ' || p_milestone_name,
        false,
        0,
        p_reward_value,
        v_milestone_id
    )
    RETURNING id INTO v_earning_id;
    
    RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award milestones
CREATE OR REPLACE FUNCTION check_and_award_milestones(p_user_id uuid)
RETURNS void AS $$
DECLARE
    v_total_referrals integer;
    v_milestone_name text;
    v_reward_value numeric;
    v_already_awarded boolean;
BEGIN
    -- Get total paid referrals
    SELECT COUNT(*) INTO v_total_referrals
    FROM public.referrals
    WHERE referrer_id = p_user_id AND subscribed = true;
    
    -- Check milestone: 5 referrals → ₹250 Amazon voucher
    IF v_total_referrals >= 5 THEN
        v_milestone_name := '5_referrals';
        v_reward_value := 250;
        SELECT EXISTS(SELECT 1 FROM public.partner_milestones 
                     WHERE user_id = p_user_id AND milestone_name = v_milestone_name) INTO v_already_awarded;
        IF NOT v_already_awarded THEN
            PERFORM issue_voucher_reward(p_user_id, v_milestone_name, v_reward_value);
        END IF;
    END IF;
    
    -- Check milestone: 20 referrals → ₹750 Myntra voucher
    IF v_total_referrals >= 20 THEN
        v_milestone_name := '20_referrals';
        v_reward_value := 750;
        SELECT EXISTS(SELECT 1 FROM public.partner_milestones 
                     WHERE user_id = p_user_id AND milestone_name = v_milestone_name) INTO v_already_awarded;
        IF NOT v_already_awarded THEN
            PERFORM issue_voucher_reward(p_user_id, v_milestone_name, v_reward_value);
        END IF;
    END IF;
    
    -- Check milestone: 50 referrals → ₹2,000 Croma voucher
    IF v_total_referrals >= 50 THEN
        v_milestone_name := '50_referrals';
        v_reward_value := 2000;
        SELECT EXISTS(SELECT 1 FROM public.partner_milestones 
                     WHERE user_id = p_user_id AND milestone_name = v_milestone_name) INTO v_already_awarded;
        IF NOT v_already_awarded THEN
            PERFORM issue_voucher_reward(p_user_id, v_milestone_name, v_reward_value);
        END IF;
    END IF;
    
    -- Check milestone: 100 referrals → ₹5,000 Flipkart voucher
    IF v_total_referrals >= 100 THEN
        v_milestone_name := '100_referrals';
        v_reward_value := 5000;
        SELECT EXISTS(SELECT 1 FROM public.partner_milestones 
                     WHERE user_id = p_user_id AND milestone_name = v_milestone_name) INTO v_already_awarded;
        IF NOT v_already_awarded THEN
            PERFORM issue_voucher_reward(p_user_id, v_milestone_name, v_reward_value);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add free month credit
CREATE OR REPLACE FUNCTION add_free_month_credit(p_user_id uuid, months_count integer DEFAULT 1)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET free_months_credit = COALESCE(free_months_credit, 0) + months_count
    WHERE id = p_user_id;
    
    -- Also update partner stats
    UPDATE public.partner_stats
    SET free_months_credit = COALESCE(free_months_credit, 0) + months_count,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Initialize stats if not exists
    IF NOT FOUND THEN
        INSERT INTO public.partner_stats (user_id, free_months_credit, updated_at)
        VALUES (p_user_id, months_count, now())
        ON CONFLICT (user_id) DO UPDATE
        SET free_months_credit = partner_stats.free_months_credit + months_count,
            updated_at = now();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh partner stats
CREATE OR REPLACE FUNCTION refresh_partner_stats(p_user_id uuid)
RETURNS void AS $$
DECLARE
    v_total_referrals integer;
    v_active_referrals integer;
    v_total_earnings numeric;
    v_tier text;
BEGIN
    -- Count total referrals
    SELECT COUNT(*) INTO v_total_referrals
    FROM public.referrals
    WHERE referrer_id = p_user_id;
    
    -- Count active (subscribed) referrals
    SELECT COUNT(*) INTO v_active_referrals
    FROM public.referrals
    WHERE referrer_id = p_user_id AND subscribed = true;
    
    -- Calculate total earnings
    SELECT COALESCE(SUM(net_amount), 0) INTO v_total_earnings
    FROM public.partner_earnings
    WHERE user_id = p_user_id;
    
    -- Update or insert stats
    INSERT INTO public.partner_stats (user_id, total_referrals, active_referrals, total_earnings, updated_at)
    VALUES (p_user_id, v_total_referrals, v_active_referrals, v_total_earnings, now())
    ON CONFLICT (user_id) DO UPDATE
    SET 
        total_referrals = v_total_referrals,
        active_referrals = v_active_referrals,
        total_earnings = v_total_earnings,
        updated_at = now();
    
    -- Update tier
    SELECT update_partner_tier(p_user_id) INTO v_tier;
    
    -- Check and award milestones
    PERFORM check_and_award_milestones(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate referral (mark as subscribed)
CREATE OR REPLACE FUNCTION activate_referral(referral_id uuid)
RETURNS void AS $$
DECLARE
    r record;
    v_referrer_id uuid;
BEGIN
    -- Get referral record
    SELECT * INTO r FROM public.referrals WHERE id = referral_id;
    
    IF r IS NULL THEN
        RAISE EXCEPTION 'Referral not found';
    END IF;
    
    -- If already subscribed, return
    IF r.subscribed = true THEN 
        RETURN; 
    END IF;
    
    -- Update referral
    UPDATE public.referrals 
    SET subscribed = true, first_payment_at = now()
    WHERE id = referral_id;
    
    -- Refresh referrer's stats
    SELECT referrer_id INTO v_referrer_id FROM public.referrals WHERE id = referral_id;
    IF v_referrer_id IS NOT NULL THEN
        PERFORM refresh_partner_stats(v_referrer_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. GRANT PERMISSIONS
-- ================================================
-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.referral_links TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT SELECT ON public.partner_earnings TO authenticated;
GRANT SELECT ON public.partner_stats TO authenticated;
GRANT SELECT ON public.partner_milestones TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_or_create_referral_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_partner_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_partner_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION record_referral_commission(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION issue_voucher_reward(uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_milestones(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION add_free_month_credit(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_commission(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION update_partner_tier(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_tds(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_referral(uuid) TO authenticated;

-- ================================================
-- 9. COMMENTS
-- ================================================
COMMENT ON TABLE public.referral_links IS 'Unique referral links for each partner';
COMMENT ON TABLE public.referrals IS 'Referral relationships between users';
COMMENT ON TABLE public.partner_earnings IS 'All earnings (cash, vouchers, credits) for partners';
COMMENT ON TABLE public.partner_stats IS 'Aggregated statistics for each partner';
COMMENT ON TABLE public.partner_milestones IS 'Milestone achievements and rewards';

COMMENT ON FUNCTION get_or_create_referral_link(uuid) IS 'Get or create a referral link for a user';
COMMENT ON FUNCTION refresh_partner_stats(uuid) IS 'Refresh all partner statistics';
COMMENT ON FUNCTION record_referral_commission(uuid, numeric) IS 'Record commission when referral subscribes';
COMMENT ON FUNCTION check_and_award_milestones(uuid) IS 'Check and award milestone vouchers';
COMMENT ON FUNCTION add_free_month_credit(uuid, integer) IS 'Add free month credits to user profile';

