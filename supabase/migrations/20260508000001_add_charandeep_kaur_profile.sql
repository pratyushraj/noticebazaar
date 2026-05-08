-- Add Charandeep Kaur (cutiebug2021) to profiles
-- This allows her collab page to be live and pre-filled with her rates

INSERT INTO public.profiles (
    id, 
    username, 
    instagram_handle,
    first_name, 
    role, 
    email,
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
    category
)
VALUES (
    gen_random_uuid(), 
    'cutiebug2021', 
    'cutiebug2021',
    'Charandeep Kaur', 
    'creator', 
    'charandeepckt0@gmail.com',
    'Why is my skin looking this good lately 👀✨It’s this Red Wine Gel Mask from Wildglow doing all t', 
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
    ARRAY['Fashion', 'Lifestyle', 'Beauty'],
    'Fashion'
)
ON CONFLICT (instagram_handle) DO UPDATE SET
    email = EXCLUDED.email,
    bio = EXCLUDED.bio,
    discovery_video_url = EXCLUDED.discovery_video_url,
    reel_price = EXCLUDED.reel_price,
    avg_rate_reel = EXCLUDED.avg_rate_reel,
    barter_min_value = EXCLUDED.barter_min_value,
    onboarding_complete = true;
