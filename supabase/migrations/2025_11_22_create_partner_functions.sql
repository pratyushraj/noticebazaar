-- Partner Program Helper Functions
-- Commission calculation, tier updates, and payout generation

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
    END IF;
    
    RETURN new_tier;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-- Function to check and award milestones
CREATE OR REPLACE FUNCTION check_and_award_milestones(p_user_id uuid)
RETURNS void AS $$
DECLARE
    v_total_referrals integer;
    v_milestone_name text;
    v_reward_value numeric;
    v_already_awarded boolean;
BEGIN
    -- Get total referrals
    SELECT COUNT(*) INTO v_total_referrals
    FROM public.referrals
    WHERE referrer_id = p_user_id AND subscribed = true;
    
    -- Check milestone: 5 referrals
    IF v_total_referrals >= 5 THEN
        v_milestone_name := '5_referrals';
        v_reward_value := 250;
        SELECT EXISTS(SELECT 1 FROM public.partner_milestones 
                     WHERE user_id = p_user_id AND milestone_name = v_milestone_name) INTO v_already_awarded;
        IF NOT v_already_awarded THEN
            PERFORM issue_voucher_reward(p_user_id, v_milestone_name, v_reward_value);
        END IF;
    END IF;
    
    -- Check milestone: 20 referrals
    IF v_total_referrals >= 20 THEN
        v_milestone_name := '20_referrals';
        v_reward_value := 750;
        SELECT EXISTS(SELECT 1 FROM public.partner_milestones 
                     WHERE user_id = p_user_id AND milestone_name = v_milestone_name) INTO v_already_awarded;
        IF NOT v_already_awarded THEN
            PERFORM issue_voucher_reward(p_user_id, v_milestone_name, v_reward_value);
        END IF;
    END IF;
    
    -- Check milestone: 50 referrals
    IF v_total_referrals >= 50 THEN
        v_milestone_name := '50_referrals';
        v_reward_value := 2000;
        SELECT EXISTS(SELECT 1 FROM public.partner_milestones 
                     WHERE user_id = p_user_id AND milestone_name = v_milestone_name) INTO v_already_awarded;
        IF NOT v_already_awarded THEN
            PERFORM issue_voucher_reward(p_user_id, v_milestone_name, v_reward_value);
        END IF;
    END IF;
    
    -- Check milestone: 100 referrals
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-- Function to refresh partner stats
CREATE OR REPLACE FUNCTION refresh_partner_stats(p_user_id uuid)
RETURNS void AS $$
DECLARE
    v_total_referrals integer;
    v_active_referrals integer;
    v_total_earnings numeric;
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
    PERFORM update_partner_tier(p_user_id);
END;
$$ LANGUAGE plpgsql;

