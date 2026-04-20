import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const creators = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'aria_tech',
    first_name: 'Aria',
    role: 'creator',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    intro_line: 'Minimalist Tech & AI lifestyle creator. Making complex things simple for 1M+ followers.',
    location: 'San Francisco, CA',
    discovery_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-and-moving-her-hands-34440-large.mp4',
    open_to_collabs: true,
    creator_category: 'Tech',
    avg_rate_reel: 45000,
    avg_reel_views_manual: 125000
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    username: 'kaelan_fitness',
    first_name: 'Kaelan',
    role: 'creator',
    avatar_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    intro_line: 'High-performance training & holistic nutrition. Transform your vibe, transform your life.',
    location: 'London, UK',
    discovery_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-on-a-treadmill-at-the-gym-42656-large.mp4',
    open_to_collabs: true,
    creator_category: 'Fitness',
    avg_rate_reel: 35000,
    avg_reel_views_manual: 85000
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    username: 'maya_travels',
    first_name: 'Maya',
    role: 'creator',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    intro_line: 'Exploring hidden luxury gems globally. Wanderlust with a cinematic touch.',
    location: 'Singapore',
    discovery_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-walking-on-a-dock-in-the-mountains-43033-large.mp4',
    open_to_collabs: true,
    creator_category: 'Travel',
    avg_rate_reel: 55000,
    avg_reel_views_manual: 210000
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    username: 'marcus_style',
    first_name: 'Marcus',
    role: 'creator',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    intro_line: 'Modern masculinity through minimalist fashion. Aesthetic living in NYC.',
    location: 'New York, NY',
    discovery_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-walking-down-a-street-in-slow-motion-42650-large.mp4',
    open_to_collabs: true,
    creator_category: 'Fashion',
    avg_rate_reel: 25000,
    avg_reel_views_manual: 45000
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    username: 'elara_beauty',
    first_name: 'Elara',
    role: 'creator',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    intro_line: 'Glossy beauty rituals and skin-first reviews. Authentic beauty for the modern woman.',
    location: 'Paris, FR',
    discovery_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-applying-makeup-with-a-brush-34441-large.mp4',
    open_to_collabs: true,
    creator_category: 'Beauty',
    avg_rate_reel: 40000,
    avg_reel_views_manual: 110000
  }
];

async function seed() {
  console.log('🚀 Seeding Vibe Creators...');
  
  for (const creatorData of creators) {
    const { id, username, ...profileData } = creatorData;
    const email = `${username}@demo.creatorarmour.com`;
    
    console.log(`\n🔍 Processing ${username} (${email})...`);
    
    // Step 1: Check if user exists in auth.users
    const { data: usersList } = await supabase.auth.admin.listUsers();
    let user = usersList?.users?.find(u => u.email === email);
    let userId = user?.id;

    if (!user) {
      console.log(`  👤 Creating auth user for ${username}...`);
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'VibeCreator123!',
        email_confirm: true,
        user_metadata: {
          first_name: profileData.first_name,
          username: username
        }
      });

      if (authError) {
        console.error(`  ❌ Failed to create auth user for ${username}:`, authError.message);
        continue;
      }
      userId = newUser.user!.id;
      console.log(`  ✅ Auth user created: ${userId}`);
    } else {
      console.log(`  ✅ Auth user already exists: ${userId}`);
    }

    // Step 2: Upsert profile
    console.log(`  📝 Upserting profile for ${username}...`);
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        ...profileData,
        id: userId,
        username,
        role: 'creator',
        onboarding_complete: true
      }, { onConflict: 'id' });
    
    if (profileError) {
      console.error(`  ❌ Failed to seed profile for ${username}:`, profileError.message);
    } else {
      console.log(`  ✅ Profile seeded successfully`);
    }
  }
  
  console.log('\n✨ Seeding complete!');
}

seed();
