const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function onboardPrachi() {
  const username = 'prachisculinarycanvas';
  const email = 'prachisculinarycanvas@gmail.com';
  const firstName = 'Prachi';
  const fullName = 'Prachi | Healthy Recipes';
  
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

  // 2. Prepare Profile
  const profileData = {
    id: userId,
    username,
    first_name: firstName,
    last_name: '',
    role: 'creator',
    is_verified: true,
    onboarding_complete: true,
    instagram_handle: username,
    followers_count: 0, // Will update after research
    avg_views: 0,
    engagement_rate: 0,
    creator_category: 'Food & Drink',
    bio: 'Healthy Recipes • Clean Ingredients • Kitchen Products | @prachisculinarycanvas',
    avatar_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/avatar.jpg`,
    discovery_video_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/discovery.mp4`,
    deal_templates: [
      {
        id: 'starter_reel',
        label: '🚀 Starter Collab',
        description: 'Perfect for first-time brand awareness & organic reach.',
        budget: 5000,
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
        budget: 10000,
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
    ]
  };

  const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting profile:', error);
  } else {
    console.log('✅ Prachi onboarded successfully.');
  }
}

onboardPrachi();
