
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeAndSeed() {
  console.log('Starting database wipe and seed...');

  // 1. List all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const keepers = ['admin@creatorarmour.com', 'noticebazaar.legal@gmail.com'];
  const toDelete = users.filter(u => !keepers.includes(u.email));

  console.log(`Deleting ${toDelete.length} users...`);
  for (const user of toDelete) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`Failed to delete ${user.email}:`, deleteError.message);
    } else {
      console.log(`Deleted: ${user.email}`);
    }
  }

  // 2. Create Demo Brand
  console.log('Creating Demo Brand...');
  const brandEmail = 'brand-demo@noticebazaar.com';
  const { data: { user: brandUser }, error: brandError } = await supabase.auth.admin.createUser({
    email: brandEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      role: 'brand',
      full_name: 'Demo Brand Co.',
      business_name: 'Demo Brand Co.'
    }
  });

  if (brandError) {
    console.error('Error creating brand demo:', brandError.message);
  } else if (brandUser) {
    console.log(`Brand Demo created: ${brandEmail}`);
    // Update profile
    await supabase.from('profiles').update({
      role: 'brand',
      business_name: 'Demo Brand Co.',
      onboarding_complete: true,
      avatar_url: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/brand-assets/logos/demo-logo.png'
    }).eq('id', brandUser.id);
  }

  // 3. Create Demo Creator
  console.log('Creating Demo Creator...');
  const creatorEmail = 'creator-demo@noticebazaar.com';
  const { data: { user: creatorUser }, error: creatorError } = await supabase.auth.admin.createUser({
    email: creatorEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      role: 'creator',
      full_name: 'Verified Creator',
      instagram_handle: 'armour_creator'
    }
  });

  if (creatorError) {
    console.error('Error creating creator demo:', creatorError.message);
  } else if (creatorUser) {
    console.log(`Creator Demo created: ${creatorEmail}`);
    // Update profile
    await supabase.from('profiles').update({
      role: 'creator',
      username: 'armour_creator',
      instagram_handle: 'armour_creator',
      onboarding_complete: true,
      business_name: 'Verified Creator',
      bio: 'Fashion & Lifestyle Creator | Content Strategist',
      creator_category: 'Fashion',
      instagram_followers: 25000,
      avatar_url: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/profile-photos/demo-creator.jpg'
    }).eq('id', creatorUser.id);
  }

  console.log('Wipe and seed complete!');
}

wipeAndSeed();
