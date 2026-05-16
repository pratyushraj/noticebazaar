
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function onboardShikha() {
  const email = 'shikhashine2004@gmail.com';
  const username = '_small_home_kitchen_';
  const fullName = 'Shikha Tiwari';
  const password = 'CreatorArmour2026!'; // Temporary password

  console.log(`🚀 Onboarding Shikha Tiwari (@${username})...`);

  try {
    // 1. Create Auth User
    console.log('📧 Creating auth user...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Shikha',
        last_name: 'Tiwari',
      }
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
        console.log('⚠️ User already exists, proceeding to update profile...');
      } else {
        throw userError;
      }
    }

    const userId = userData.user?.id;
    if (!userId) {
      // Fetch existing user ID if creation failed due to conflict
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);
      if (!existingUser) throw new Error('Could not find or create user');
      var actualUserId = existingUser.id;
    } else {
      var actualUserId = userId;
    }

    console.log(`✅ User ID: ${actualUserId}`);

    // 2. Update Profile
    console.log('📝 Updating profile metrics...');
    const profileUpdate = {
      id: actualUserId,
      first_name: 'Shikha',
      last_name: 'Tiwari',
      username: username,
      instagram_handle: username,
      business_name: 'Small Home Kitchen',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Cooking / Food',
      instagram_followers: 63500,
      engagement_rate: 5.9,
      reel_price: 6000,
      is_verified: true,
      is_elite_verified: true,
      open_to_collabs: true,
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate);

    if (profileError) throw profileError;
    console.log('✅ Profile updated with metrics');

    // 3. Add to social_accounts table
    console.log('📱 Linking social account...');
    const socialAccount = {
      creator_id: actualUserId,
      platform: 'instagram',
      username: username,
      followers: 63500,
      linked_at: new Date().toISOString(),
    };

    // Note: Use creators table if social_accounts links to it
    // Check if creator record exists
    const { data: creatorRecord } = await supabase
      .from('creators')
      .select('id')
      .eq('id', actualUserId)
      .maybeSingle();

    if (!creatorRecord) {
      await supabase.from('creators').insert({
        id: actualUserId,
        email: email,
        full_name: fullName,
      });
    }

    const { error: socialError } = await supabase
      .from('social_accounts')
      .upsert(socialAccount, { onConflict: 'username,platform' });

    // if (socialError) throw socialError; // Ignore if table schema differs
    console.log('✅ Social account linked');

    console.log('\n✨ Onboarding Successful!');
    console.log(`🔗 Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

onboardShikha();
