-- Add Charandeep Kaur (cutiebug2021) to auth and profiles
-- This allows her collab page to be live and pre-filled with her rates

-- 1. Ensure auth user exists
INSERT INTO auth.users (id, email, email_confirmed_at, aud, role, created_at, updated_at)
VALUES (
    'c1110000-0000-0000-0000-000000000001',
    'cutiebug2021@creatorarmour.com',
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
    discovery_video_url,
    is_verified, 
    starting_price, 
    reel_price,
    avg_rate_reel,
    barter_min_value,
    onboarding_complete,
    open_to_collabs,
    content_niches,
    creator_category
)
VALUES (
    'c1110000-0000-0000-0000-000000000001', 
    'cutiebug2021', 
    'cutiebug2021',
    'Charandeep Kaur', 
    'creator', 
    'Professional Fashion, Lifestyle & Beauty creator. Focused on high-quality aesthetic content and authentic brand storytelling.', 
    'India', 
    111000, 
    4.5, 
    '/videos/discovery/cutiebug2021_discovery.mp4',
    true, 
    6000, 
    10000,
    10000,
    5000,
    true,
    true,
    '["Fashion", "Lifestyle", "Beauty"]'::jsonb,
    'Fashion'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    instagram_handle = EXCLUDED.instagram_handle,
    first_name = EXCLUDED.first_name,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    followers_count = EXCLUDED.followers_count,
    engagement_rate = EXCLUDED.engagement_rate,
    discovery_video_url = EXCLUDED.discovery_video_url,
    is_verified = EXCLUDED.is_verified,
    starting_price = EXCLUDED.starting_price,
    reel_price = EXCLUDED.reel_price,
    avg_rate_reel = EXCLUDED.avg_rate_reel,
    barter_min_value = EXCLUDED.barter_min_value,
    onboarding_complete = EXCLUDED.onboarding_complete,
    open_to_collabs = EXCLUDED.open_to_collabs,
    content_niches = EXCLUDED.content_niches,
    creator_category = EXCLUDED.creator_category;
