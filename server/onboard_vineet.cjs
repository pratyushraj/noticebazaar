const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function onboardVineet() {
  const username = '_cookingwithvineet';
  const email = 'kvineet520@gmail.com';
  const fullName = 'Cooking With Vineet';
  
  console.log(`Onboarding ${fullName} (${username})...`);

  // 1. Auth User
  let userId;
  const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) {
    console.log('User might already exist in Auth, fetching existing user...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);
    if (existingUser) {
      userId = existingUser.id;
    } else {
      console.error('Could not create or find auth user:', authError);
      return;
    }
  } else {
    userId = newAuthUser.user.id;
  }

  // 2. Prepare Profile with Verified Marketplace Metrics
  const profileData = {
    id: userId,
    username,
    first_name: 'Vineet',
    last_name: '',
    role: 'creator',
    is_verified: true,
    onboarding_complete: true,
    instagram_handle: username,
    followers_count: 93800,
    instagram_followers: 93800,
    avg_views: 36000,
    avg_reel_views_manual: 36000,
    engagement_rate: 27.8,
    creator_category: 'Kitchen/Cooking',
    location: 'Delhi',
    bio: 'Easy • Tasty • Quick 🥦 Daily Food Reels | Kitchen/Cooking | 📍 Delhi, India',
    audience_gender_split: { women: 72, men: 28 },
    top_cities: ['Delhi', 'Mumbai', 'Lucknow', 'Bengaluru'],
    audience_age_range: '25-34 (40%)',
    avatar_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/avatar.jpg`,
    discovery_video_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/discovery.mp4`,
    deal_templates: [
      {
        id: 'starter_reel',
        label: '🚀 Starter Collab',
        description: 'Perfect for first-time brand awareness & organic reach.',
        budget: 2000,
        type: 'paid',
        deliverables: [
          '1 Reel (15-30s)',
          'Organic reach focus',
          '1 Revision included'
        ]
      },
      {
        id: 'growth_package',
        label: '⭐ Growth Campaign',
        description: 'Best for brands wanting ads usage + conversions.',
        budget: 5000,
        type: 'paid',
        deliverables: [
          '1 Premium Reel (30-60s)',
          '30-day usage rights (for ads)',
          'Script + hook optimization',
          '2 Story shoutouts',
          '1 Revision included'
        ],
        isPopular: true
      },
      {
        id: 'product_barter',
        label: '🎁 Product Exchange',
        description: 'Barter collaboration for product review/feature.',
        budget: 0,
        type: 'barter',
        deliverables: ['1 Reel or 2 Stories', 'Product review focus']
      }
    ],
    barter_min_value: 3000
  };

  const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting profile:', error);
  } else {
    console.log('✅ Vineet onboarded successfully with standardized packages.');
  }
}

onboardVineet();
