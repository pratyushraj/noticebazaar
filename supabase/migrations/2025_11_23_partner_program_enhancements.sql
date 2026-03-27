-- Partner Program Enhancements Migration
-- Adds new columns and tables for performance metrics, rewards, and events

-- ================================================
-- 1. UPDATE partner_stats TABLE
-- ================================================

-- Add new columns to partner_stats if they don't exist
ALTER TABLE public.partner_stats
ADD COLUMN IF NOT EXISTS total_clicks integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_signups integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_paid_users integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS current_month_earnings numeric DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS partner_rank integer,
ADD COLUMN IF NOT EXISTS next_reward_referrals integer,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Update tier constraint to include 'Growth'
ALTER TABLE public.partner_stats
DROP CONSTRAINT IF EXISTS partner_stats_tier_check;

ALTER TABLE public.partner_stats
ADD CONSTRAINT partner_stats_tier_check 
CHECK (tier IN ('starter', 'partner', 'growth', 'elite', 'pro'));

-- Comments
COMMENT ON COLUMN public.partner_stats.total_clicks IS 'Total number of referral link clicks';
COMMENT ON COLUMN public.partner_stats.total_signups IS 'Total number of signups from referrals';
COMMENT ON COLUMN public.partner_stats.total_paid_users IS 'Total number of paid subscribers from referrals';
COMMENT ON COLUMN public.partner_stats.current_month_earnings IS 'Earnings for the current month';
COMMENT ON COLUMN public.partner_stats.partner_rank IS 'Rank among all partners (1 = highest earner)';
COMMENT ON COLUMN public.partner_stats.next_reward_referrals IS 'Referrals needed to unlock next reward';

-- ================================================
-- 2. CREATE partner_rewards TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS public.partner_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_type text NOT NULL CHECK (reward_type IN ('cash', 'voucher', 'free_month')),
    amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'locked' CHECK (status IN ('paid', 'unlocked', 'locked')),
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_rewards_user_id ON public.partner_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_rewards_status ON public.partner_rewards(status);
CREATE INDEX IF NOT EXISTS idx_partner_rewards_created_at ON public.partner_rewards(created_at DESC);

ALTER TABLE public.partner_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rewards" ON public.partner_rewards;
CREATE POLICY "Users can view their own rewards"
ON public.partner_rewards FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert/update rewards" ON public.partner_rewards;
CREATE POLICY "System can insert/update rewards"
ON public.partner_rewards FOR ALL
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.partner_rewards IS 'Partner rewards (cash, vouchers, free months)';

-- ================================================
-- 3. CREATE referral_events TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS public.referral_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('click', 'signup', 'paid')),
    referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
    metadata jsonb,
    timestamp timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_events_user_id ON public.referral_events(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_event_type ON public.referral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_events_timestamp ON public.referral_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_referral_events_referral_id ON public.referral_events(referral_id);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own referral events" ON public.referral_events;
CREATE POLICY "Users can view their own referral events"
ON public.referral_events FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert referral events" ON public.referral_events;
CREATE POLICY "System can insert referral events"
ON public.referral_events FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE public.referral_events IS 'Referral link clicks, signups, and paid subscription events';

-- ================================================
-- 4. FUNCTIONS FOR AUTOMATIC STATS UPDATES
-- ================================================

-- Function to track referral event
CREATE OR REPLACE FUNCTION track_referral_event(
    p_user_id uuid,
    p_event_type text,
    p_referral_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Insert event
    INSERT INTO public.referral_events (user_id, event_type, referral_id)
    VALUES (p_user_id, p_event_type, p_referral_id);
    
    -- Update partner_stats based on event type
    IF p_event_type = 'click' THEN
        UPDATE public.partner_stats
        SET total_clicks = total_clicks + 1,
            updated_at = now()
        WHERE user_id = p_user_id;
        
        -- Initialize if not exists
        IF NOT FOUND THEN
            INSERT INTO public.partner_stats (user_id, total_clicks, updated_at)
            VALUES (p_user_id, 1, now())
            ON CONFLICT (user_id) DO UPDATE
            SET total_clicks = partner_stats.total_clicks + 1,
                updated_at = now();
        END IF;
    ELSIF p_event_type = 'signup' THEN
        UPDATE public.partner_stats
        SET total_signups = total_signups + 1,
            updated_at = now()
        WHERE user_id = p_user_id;
        
        IF NOT FOUND THEN
            INSERT INTO public.partner_stats (user_id, total_signups, updated_at)
            VALUES (p_user_id, 1, now())
            ON CONFLICT (user_id) DO UPDATE
            SET total_signups = partner_stats.total_signups + 1,
                updated_at = now();
        END IF;
    ELSIF p_event_type = 'paid' THEN
        UPDATE public.partner_stats
        SET total_paid_users = total_paid_users + 1,
            active_referrals = active_referrals + 1,
            updated_at = now()
        WHERE user_id = p_user_id;
        
        IF NOT FOUND THEN
            INSERT INTO public.partner_stats (user_id, total_paid_users, active_referrals, updated_at)
            VALUES (p_user_id, 1, 1, now())
            ON CONFLICT (user_id) DO UPDATE
            SET total_paid_users = partner_stats.total_paid_users + 1,
                active_referrals = partner_stats.active_referrals + 1,
                updated_at = now();
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update partner rank
CREATE OR REPLACE FUNCTION update_partner_ranks()
RETURNS void AS $$
DECLARE
    rank_counter integer := 1;
    partner_record RECORD;
BEGIN
    -- Update ranks based on total_earnings (descending)
    FOR partner_record IN
        SELECT user_id
        FROM public.partner_stats
        ORDER BY total_earnings DESC, updated_at ASC
    LOOP
        UPDATE public.partner_stats
        SET partner_rank = rank_counter
        WHERE user_id = partner_record.user_id;
        
        rank_counter := rank_counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh partner stats with new metrics
CREATE OR REPLACE FUNCTION refresh_partner_stats_complete(p_user_id uuid)
RETURNS void AS $$
DECLARE
    v_total_clicks integer;
    v_total_signups integer;
    v_total_paid_users integer;
    v_current_month_earnings numeric;
BEGIN
    -- Count clicks
    SELECT COUNT(*) INTO v_total_clicks
    FROM public.referral_events
    WHERE user_id = p_user_id AND event_type = 'click';
    
    -- Count signups
    SELECT COUNT(*) INTO v_total_signups
    FROM public.referral_events
    WHERE user_id = p_user_id AND event_type = 'signup';
    
    -- Count paid users
    SELECT COUNT(*) INTO v_total_paid_users
    FROM public.referral_events
    WHERE user_id = p_user_id AND event_type = 'paid';
    
    -- Calculate current month earnings
    SELECT COALESCE(SUM(net_amount), 0) INTO v_current_month_earnings
    FROM public.partner_earnings
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('month', now())
      AND type = 'cash';
    
    -- Update or insert stats
    INSERT INTO public.partner_stats (
        user_id,
        total_clicks,
        total_signups,
        total_paid_users,
        current_month_earnings,
        total_referrals,
        active_referrals,
        total_earnings,
        updated_at
    )
    SELECT
        p_user_id,
        v_total_clicks,
        v_total_signups,
        v_total_paid_users,
        v_current_month_earnings,
        COUNT(*),
        COUNT(*) FILTER (WHERE subscribed = true),
        COALESCE(SUM(pe.net_amount), 0),
        now()
    FROM public.referrals r
    LEFT JOIN public.partner_earnings pe ON pe.referral_id = r.id
    WHERE r.referrer_id = p_user_id
    GROUP BY p_user_id
    ON CONFLICT (user_id) DO UPDATE
    SET
        total_clicks = v_total_clicks,
        total_signups = v_total_signups,
        total_paid_users = v_total_paid_users,
        current_month_earnings = v_current_month_earnings,
        total_referrals = EXCLUDED.total_referrals,
        active_referrals = EXCLUDED.active_referrals,
        total_earnings = EXCLUDED.total_earnings,
        updated_at = now();
    
    -- Update ranks for all partners
    PERFORM update_partner_ranks();
    
    -- Update tier
    PERFORM update_partner_tier(p_user_id);
    
    -- Check and award milestones
    PERFORM check_and_award_milestones(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total partner count
CREATE OR REPLACE FUNCTION get_total_partners()
RETURNS integer AS $$
DECLARE
    total_count integer;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM public.partner_stats;
    
    RETURN COALESCE(total_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 5. TRIGGER TO AUTO-UPDATE STATS ON REFERRAL EVENT
-- ================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_stats_on_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Stats are updated in track_referral_event function
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.partner_rewards TO authenticated;
GRANT SELECT, INSERT ON public.referral_events TO authenticated;
GRANT EXECUTE ON FUNCTION track_referral_event(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_partner_ranks() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_partner_stats_complete(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_partners() TO authenticated;

COMMENT ON FUNCTION track_referral_event(uuid, text, uuid) IS 'Track referral link clicks, signups, and paid conversions';
COMMENT ON FUNCTION update_partner_ranks() IS 'Update ranks for all partners based on total earnings';
COMMENT ON FUNCTION refresh_partner_stats_complete(uuid) IS 'Refresh all partner statistics including performance metrics';

