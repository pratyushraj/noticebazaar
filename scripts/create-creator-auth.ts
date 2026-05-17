import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const creatorsToOnboard = [
  {
    username: 'shinyyy.05',
    email: 'shinyjain0597@gmail.com',
    name: 'Shiny Jain'
  },
  {
    username: 'photowalamusafir',
    email: 'photowalamusafir@gmail.com',
    name: 'Mahesh'
  },
  {
    username: 'salma_stylebudget',
    email: 'workwithafrin@gmail.com',
    name: 'Salma Khan'
  },
  {
    username: 'cutiebug2021',
    email: 'charandeepckt0@gmail.com',
    name: 'Charandeep Kaur'
  }
];

async function main() {
  console.log('🚀 Starting Auth Account Creation and Profile Linkage for creators...');

  for (const c of creatorsToOnboard) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`👤 Processing @${c.username} (${c.name}) with email: ${c.email}`);

    try {
      // 1. Fetch existing profile
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', c.username)
        .single();

      if (profileFetchError) {
        console.error(`❌ Error fetching profile for @${c.username}:`, profileFetchError.message);
        continue;
      }

      console.log(`✅ Existing profile found. ID: ${profile.id}`);

      // 2. Check if Auth user already exists for this email
      const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
      if (listUsersError) throw listUsersError;

      const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === c.email.toLowerCase());
      let authUserId: string;

      if (existingUser) {
        console.log(`⚠️ Auth User already exists for ${c.email} with ID: ${existingUser.id}`);
        authUserId = existingUser.id;
      } else {
        // Create new Auth user
        const tempPassword = 'WelcomePassword' + Math.random().toString(36).slice(-8) + '!';
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: c.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: profile.first_name || c.name.split(' ')[0],
            last_name: profile.last_name || c.name.split(' ').slice(1).join(' ') || ''
          }
        });

        if (createError) throw createError;
        if (!newUser.user) throw new Error('No user returned after creation');

        authUserId = newUser.user.id;
        console.log(`✅ Auth User created successfully! ID: ${authUserId}`);
      }

      // 3. Link profile to the new Auth ID
      if (profile.id !== authUserId) {
        console.log(`🔄 Linking profile: updating ID from ${profile.id} to ${authUserId}...`);

        // We delete the old profile row first to prevent unique constraints or primary key collisions,
        // and insert/upsert the new one with all original columns.
        const originalId = profile.id;
        const newProfile = { ...profile, id: authUserId, updated_at: new Date().toISOString() };

        // Deleting old row
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', originalId);

        if (deleteError) {
          console.warn(`⚠️ Warning: Delete old row error: ${deleteError.message}. Trying to update directly...`);
        }

        // Inserting/Upserting new row
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert(newProfile);

        if (insertError) throw insertError;
        console.log(`✅ Profile successfully linked to Auth ID!`);
      } else {
        console.log(`✅ Profile is already linked to the correct Auth User.`);
      }

    } catch (error: any) {
      console.error(`❌ Failed to process @${c.username}:`, error.message);
    }
  }

  console.log('\n============================================================');
  console.log('✨ All requested creator Auth accounts processed successfully!');
}

main();
