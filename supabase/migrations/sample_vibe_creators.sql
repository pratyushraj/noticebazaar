-- Clear existing sample creators if any
DELETE FROM public.profiles WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005'
);

-- Insert Sample Vibe Creators
INSERT INTO public.profiles (
    id, username, first_name, role, avatar_url, bio, location, 
    followers_count, engagement_rate, discovery_video_url, 
    is_verified, starting_price, open_to_collabs, 
    content_vibes, category, suggested_reel_rate
)
VALUES 
(
  '00000000-0000-0000-0000-000000000001', 
  'aria_tech', 
  'Aria', 
  'creator', 
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 
  'Minimalist Tech & AI lifestyle creator. Making complex things simple for 1M+ followers.', 
  'San Francisco', 
  1250000, 
  4.8, 
  'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-and-moving-her-hands-34440-large.mp4', 
  true, 
  45000,
  true,
  ARRAY['Cinematic', 'Minimalist', 'Educational'],
  'Tech',
  45000
),
(
  '00000000-0000-0000-0000-000000000002', 
  'kaelan_fitness', 
  'Kaelan', 
  'creator', 
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 
  'High-performance training & holistic nutrition. Transform your vibe, transform your life.', 
  'London', 
  850000, 
  5.2, 
  'https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-on-a-treadmill-at-the-gym-42656-large.mp4', 
  true, 
  35000,
  true,
  ARRAY['High Energy', 'Lifestyle', 'Educational'],
  'Fitness',
  35000
),
(
  '00000000-0000-0000-0000-000000000003', 
  'maya_travels', 
  'Maya', 
  'creator', 
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', 
  'Exploring hidden luxury gems globally. Wanderlust with a cinematic touch.', 
  'Singapore', 
  2100000, 
  3.9, 
  'https://assets.mixkit.co/videos/preview/mixkit-woman-walking-on-a-dock-in-the-mountains-43033-large.mp4', 
  true, 
  55000,
  true,
  ARRAY['Cinematic', 'Lifestyle', 'Review'],
  'Travel',
  55000
),
(
  '00000000-0000-0000-0000-000000000004', 
  'marcus_style', 
  'Marcus', 
  'creator', 
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 
  'Modern masculinity through minimalist fashion. Aesthetic living in NYC.', 
  'New York', 
  450000, 
  6.1, 
  'https://assets.mixkit.co/videos/preview/mixkit-man-walking-down-a-street-in-slow-motion-42650-large.mp4', 
  true, 
  25000,
  true,
  ARRAY['Minimalist', 'Lifestyle', 'Cinematic'],
  'Fashion',
  25000
),
(
  '00000000-0000-0000-0000-000000000005', 
  'elara_beauty', 
  'Elara', 
  'creator', 
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', 
  'Glossy beauty rituals and skin-first reviews. Authentic beauty for the modern woman.', 
  'Paris', 
  1100000, 
  4.5, 
  'https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-applying-makeup-with-a-brush-34441-large.mp4', 
  true, 
  40000,
  true,
  ARRAY['Review', 'Lifestyle', 'Humor'],
  'Beauty',
  40000
);
