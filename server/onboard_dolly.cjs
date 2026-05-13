const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function onboardDolly() {
  const email = 'Patelheena1810@gmail.com';
  const username = 'd_dollypatel';
  const fullName = 'Dolly Patel';
  
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

  const userId = authData?.user?.id || (await supabase.from('profiles').select('id').eq('username', username).single()).data?.id;
  
  if (!userId) {
    // If still no ID, find by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);
    if (!user) {
        console.error('Could not find or create user ID');
        return;
    }
    userId = user.id;
  }

  console.log(`User ID: ${userId}`);

  // 2. Prepare Profile Data
  const profileData = {
    id: userId,
    username,
    first_name: 'Dolly',
    last_name: 'Patel',
    full_name: fullName,
    instagram_handle: username,
    instagram_followers: 33900,
    followers_count: 33900,
    content_niches: ['Beauty', 'Lifestyle', 'Fashion', 'Food'],
    avg_rate_reel: 2000,
    reel_price: 2000,
    story_price: 500,
    collaboration_preference: 'Hybrid', // Barter mentioned
    bio: 'INDIAN🇮🇳 BEAUTY🪞lIFESTYLE🎒FASHION 👛 FOOD🍕 COFFEE ☕️',
    avatar_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/avatar.jpg`,
    discovery_video_url: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/${username}/discovery.mp4`,
    is_verified: true,
    onboarding_status: 'completed',
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
    followers: 33900,
    profile_pic_url: profileData.avatar_url,
    updated_at: new Date().toISOString()
  });

  console.log('Instagram cache updated.');
  
  console.log('--- NEXT STEPS ---');
  console.log('1. Upload avatar to storage');
  console.log('2. Upload discovery reel to storage');
  console.log('3. Generate password link');
}

onboardDolly();
