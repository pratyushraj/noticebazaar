-- Add Shagufi Khan (shagufikhan_) to auth and profiles

-- 0. Ensure past_brand_count exists on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS past_brand_count integer DEFAULT 0;

-- 1. Ensure auth user exists
INSERT INTO auth.users (id, email, email_confirmed_at, aud, role, created_at, updated_at)
VALUES (
    'd1396000-0000-0000-0000-000000000003',
    'shagufikhan@creatorarmour.com',
    now(),
    'authenticated',
    'authenticated',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Ensure profile exists and is updated
INSERT INTO public.profiles (
    id,
    username,
    instagram_handle,
    first_name,
    role,
    bio,
    location,
    followers_count,
    engagement_rate,
    is_verified,
    starting_price,
    reel_price,
    avg_rate_reel,
    barter_min_value,
    onboarding_complete,
    open_to_collabs,
    content_niches,
    creator_category,
    audience_gender_split,
    audience_age_range,
    top_cities,
    avg_reel_views_manual,
    past_brand_count,
    past_brands,
    reliability_score,
    response_hours
)
VALUES (
    'd1396000-0000-0000-0000-000000000003',
    'shagufikhan_',
    'shagufikhan_',
    'Shagufi Khan',
    'creator',
    '✨ Ambitious dreamer with creative sparkles | Makeup 💄 Fashion 👗 Lifestyle 🏠. High interaction | Strong hooks.',
    'Delhi, India',
    139600,
    6.7,
    true,
    5000,
    8000,
    8000,
    4000,
    true,
    true,
    '["Fashion", "Lifestyle", "Beauty"]'::jsonb,
    'Fashion',
    '20% Women, 80% Men',
    '18-24',
    '["Delhi, India"]'::jsonb,
    70600,
    15,
    '["AURIC", "Velura"]'::jsonb,
    99,
    2
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    instagram_handle = EXCLUDED.instagram_handle,
    first_name = EXCLUDED.first_name,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    followers_count = EXCLUDED.followers_count,
    engagement_rate = EXCLUDED.engagement_rate,
    is_verified = EXCLUDED.is_verified,
    starting_price = EXCLUDED.starting_price,
    reel_price = EXCLUDED.reel_price,
    avg_rate_reel = EXCLUDED.avg_rate_reel,
    barter_min_value = EXCLUDED.barter_min_value,
    onboarding_complete = EXCLUDED.onboarding_complete,
    open_to_collabs = EXCLUDED.open_to_collabs,
    content_niches = EXCLUDED.content_niches,
    creator_category = EXCLUDED.creator_category,
    audience_gender_split = EXCLUDED.audience_gender_split,
    audience_age_range = EXCLUDED.audience_age_range,
    top_cities = EXCLUDED.top_cities,
    avg_reel_views_manual = EXCLUDED.avg_reel_views_manual,
    past_brand_count = EXCLUDED.past_brand_count,
    past_brands = EXCLUDED.past_brands,
    reliability_score = EXCLUDED.reliability_score,
    response_hours = EXCLUDED.response_hours;
