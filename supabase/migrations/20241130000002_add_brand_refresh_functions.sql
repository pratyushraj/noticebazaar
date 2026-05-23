-- Brand Refresh and Maintenance Functions
-- Functions to keep brand directory fresh and dynamic

-- Function to mark stale brands as inactive
CREATE OR REPLACE FUNCTION mark_stale_brands()
RETURNS integer AS $$
DECLARE
    updated_count integer;
BEGIN
    UPDATE public.brands
    SET status = 'inactive',
        updated_at = NOW()
    WHERE status = 'active'
        AND updated_at < NOW() - INTERVAL '30 days'
        AND source IN ('scraped', 'marketplace')
        AND id NOT IN (
            -- Keep brands that have recent opportunities
            SELECT DISTINCT brand_id
            FROM public.opportunities
            WHERE created_at >= NOW() - INTERVAL '30 days'
        );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh brand opportunity dates
CREATE OR REPLACE FUNCTION refresh_brand_opportunity_dates()
RETURNS void AS $$
BEGIN
    UPDATE public.brands b
    SET last_opportunity_date = (
        SELECT MAX(created_at)::date
        FROM public.opportunities o
        WHERE o.brand_id = b.id
            AND o.status = 'open'
    )
    WHERE EXISTS (
        SELECT 1
        FROM public.opportunities o
        WHERE o.brand_id = b.id
            AND o.status = 'open'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate brand popularity score
CREATE OR REPLACE FUNCTION calculate_brand_popularity_score(brand_uuid uuid)
RETURNS numeric AS $$
DECLARE
    score numeric;
BEGIN
    SELECT 
        COALESCE(
            (b.view_count * 0.1) +
            (b.bookmark_count * 2.0) +
            (b.application_count * 5.0) +
            (CASE WHEN b.verified THEN 10 ELSE 0 END) +
            (CASE WHEN b.last_opportunity_date >= CURRENT_DATE - INTERVAL '7 days' THEN 5 ELSE 0 END) +
            (CASE WHEN b.rating >= 4.5 THEN 3 ELSE 0 END),
            0
        )
    INTO score
    FROM public.brands b
    WHERE b.id = brand_uuid;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended brands for a creator
CREATE OR REPLACE FUNCTION get_recommended_brands(
    creator_uuid uuid,
    limit_count integer DEFAULT 10
)
RETURNS TABLE (
    brand_id uuid,
    brand_name text,
    industry text,
    match_reason text,
    popularity_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.industry,
        CASE
            WHEN b.industry = p.creator_category THEN 'Matches your category'
            WHEN b.tier = 'niche' THEN 'Great for micro-creators'
            WHEN b.verified = true THEN 'Verified brand'
            WHEN b.last_opportunity_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'Recent opportunities'
            ELSE 'Popular choice'
        END as match_reason,
        calculate_brand_popularity_score(b.id) as popularity_score
    FROM public.brands b
    CROSS JOIN public.profiles p
    WHERE p.id = creator_uuid
        AND b.status = 'active'
        AND b.id NOT IN (
            -- Exclude brands creator has already interacted with
            SELECT DISTINCT brand_id
            FROM public.brand_interactions
            WHERE creator_id = creator_uuid
        )
    ORDER BY popularity_score DESC, b.verified DESC, b.last_opportunity_date DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_stale_brands() IS 'Marks brands as inactive if they havent been updated in 30 days and have no recent opportunities';
COMMENT ON FUNCTION refresh_brand_opportunity_dates() IS 'Updates last_opportunity_date for all brands based on their open opportunities';
COMMENT ON FUNCTION calculate_brand_popularity_score(uuid) IS 'Calculates a popularity score for a brand based on interactions and metrics';
COMMENT ON FUNCTION get_recommended_brands(uuid, integer) IS 'Returns recommended brands for a creator based on their profile and brand popularity';

