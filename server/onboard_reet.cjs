const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function onboardReet() {
  const email = 'reet30sharma@gmail.com';
  const username = 'chroniclesofffoods';
  const fullName = 'Reet Sharma';
  
  console.log(`Onboarding ${fullName} (${username})...`);

  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists in Auth, fetching details...');
    } else {
      console.error('Error creating auth user:', authError);
      return;
    }
  }

  let userId = authData?.user?.id;
  
  if (!userId) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);
    if (!user) {
        // Try finding by username in profiles
        const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single();
        if (profile) {
            userId = profile.id;
        } else {
            console.error('Could not find or create user ID');
            return;
        }
    } else {
        userId = user.id;
    }
  }

  console.log(`User ID: ${userId}`);

  // 2. Prepare Profile Data
  const profileData = {
    id: userId,
    username,
    first_name: 'Reet',
    last_name: 'Sharma',
    instagram_handle: username,
    instagram_followers: 20800,
    followers_count: 20800,
    content_niches: ['Food', 'Recipes', 'Lifestyle'],
    avg_rate_reel: 2000,
    reel_price: 2000,
    story_price: 500,
    collaboration_preference: 'Hybrid',
    bio: '❤️Sharing my foodie adventures and recipes ! ⭐BARTER / PAID CONTENT CREATOR',
    avatar_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/avatar.jpg`,
    discovery_video_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/discovery.mp4`,
    is_verified: true,
    is_elite_verified: true,
    onboarding_complete: true,
    avg_views: 130000,
    engagement_rate: 4.9,
    audience_gender_split: { female: 76.1, male: 23.9 },
    top_cities: ['Delhi', 'Mumbai', 'Lucknow', 'Jaipur'],
    audience_age_range: { '18-24': 56.1, '25-34': 26.7, '35-44': 8.1 },
    updated_at: new Date().toISOString()
  };

  // 3. Upsert Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData);

  if (profileError) {
    console.error('Error upserting profile:', profileError);
    return;
  }

  console.log('Profile created/updated successfully!');

  // 4. Update Instagram cache
  await supabase.from('instagram_cache').upsert({
    handle: username,
    full_name: fullName,
    followers: 20800,
    profile_pic_url: profileData.avatar_url,
    updated_at: new Date().toISOString()
  });

  // 5. Setup Deal Templates
  const dealTemplates = [
    {
      name: '🚀 Starter',
      description: '1 High-quality Reel showcasing your brand/product.',
      price: 2000,
      deliverables: ['1 Reel'],
      is_active: true
    },
    {
      name: '⭐ Growth',
      description: '2 Reels + 2 Stories for enhanced visibility.',
      price: 5000,
      deliverables: ['2 Reels', '2 Stories'],
      is_active: true
    },
    {
        name: '🎁 Product Exchange',
        description: 'Barter collaboration for product review/feature.',
        price: 0,
        deliverables: ['1 Reel or 2 Stories'],
        is_active: true
    }
  ];

  const { error: dealsError } = await supabase
    .from('profiles')
    .update({ deal_templates: dealTemplates })
    .eq('id', userId);

  if (dealsError) {
    console.error('Error updating deal templates:', dealsError);
  } else {
    console.log('Deal templates updated.');
  }

  console.log('Instagram cache updated.');
  
  console.log('--- NEXT STEPS ---');
  console.log('1. Upload avatar to storage');
  console.log('2. Download and Normalize discovery reel');
  console.log('3. Upload discovery reel to storage');
}

onboardReet();
