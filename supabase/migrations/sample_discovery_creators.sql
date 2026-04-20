-- Create Sample AI Creators for Discovery Lab
INSERT INTO public.profiles (id, username, first_name, role, avatar_url, bio, location, followers_count, engagement_rate, discovery_video_url, is_verified, starting_price)
VALUES 
(
  '00000000-0000-0000-0000-000000000001', 
  'aria_tech', 
  'Aria', 
  'creator', 
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 
  'Tech & AI lifestyle creator. Making complex things simple.', 
  'San Francisco', 
  1250000, 
  4.8, 
  'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-and-moving-her-hands-34440-large.mp4', 
  true, 
  45000
),
(
  '00000000-0000-0000-0000-000000000002', 
  'kaelan_fitness', 
  'Kaelan', 
  'creator', 
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 
  'High-intensity training & nutrition. Transforming lives daily.', 
  'London', 
  850000, 
  5.2, 
  'https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-on-a-treadmill-at-the-gym-42656-large.mp4', 
  true, 
  35000
),
(
  '00000000-0000-0000-0000-000000000003', 
  'maya_travels', 
  'Maya', 
  'creator', 
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', 
  'Exploring hidden gems around the world. Wanderlust guaranteed.', 
  'Singapore', 
  2100000, 
  3.9, 
  'https://assets.mixkit.co/videos/preview/mixkit-woman-walking-on-a-dock-in-the-mountains-43033-large.mp4', 
  true, 
  55000
)
ON CONFLICT (id) DO NOTHING;
