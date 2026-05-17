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

const creatorsToCheck = [
  { username: 'shinyyy.05', email: 'shinyjain0597@gmail.com' },
  { username: 'photowalamusafir', email: 'photowalamusafir@gmail.com' },
  { username: 'salma_stylebudget', email: 'workwithafrin@gmail.com' },
  { username: 'cutiebug2021', email: 'charandeepckt0@gmail.com' }
];

async function main() {
  console.log('🔄 Checking all pages of Supabase Auth to find registered emails...');

  try {
    let allUsers: any[] = [];
    let page = 1;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 100
      });

      if (error) throw error;

      if (data.users && data.users.length > 0) {
        allUsers = allUsers.concat(data.users);
        console.log(`Loaded page ${page} (${data.users.length} users)...`);
        page++;
      } else {
        keepFetching = false;
      }

      // If we loaded fewer than 100 users, it was the last page
      if (data.users && data.users.length < 100) {
        keepFetching = false;
      }
    }

    console.log(`\n✅ Total users loaded from Supabase Auth: ${allUsers.length}`);

    for (const c of creatorsToCheck) {
      console.log(`\n------------------------------------------------------------`);
      console.log(`👤 Creator: @${c.username} (${c.email})`);

      // Find the user in auth.users by email
      const authUser = allUsers.find(u => u.email?.toLowerCase() === c.email.toLowerCase());

      if (!authUser) {
        console.log(`❌ No Auth account found for email: ${c.email}. Let's create one!`);
        
        // Let's create a new Auth user for them!
        const tempPassword = 'WelcomePassword' + Math.random().toString(36).slice(-8) + '!';
        
        // Fetch original profile first
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', c.username)
          .single();

        if (profileFetchError) {
          console.error(`❌ Profile fetch error:`, profileFetchError.message);
          continue;
        }

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: c.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: profile.first_name || c.username,
            last_name: profile.last_name || ''
          }
        });

        if (createError) {
          console.error(`❌ Failed to create user:`, createError.message);
          continue;
        }

        if (!newUser.user) {
          console.error(`❌ No user returned on creation`);
          continue;
        }

        console.log(`✅ Auth user created successfully! ID: ${newUser.user.id}`);

        // Link profile
        const oldId = profile.id;
        const linkedProfile = { ...profile, id: newUser.user.id, updated_at: new Date().toISOString() };

        await supabase.from('profiles').delete().eq('id', oldId);
        const { error: insertError } = await supabase.from('profiles').insert(linkedProfile);

        if (insertError) {
          console.error(`❌ Link error:`, insertError.message);
        } else {
          console.log(`🎉 Success! Linked new Auth account to profile.`);
        }
        continue;
      }

      console.log(`✅ Auth account exists:`);
      console.log(`   Auth UUID  : ${authUser.id}`);

      // Fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', c.username)
        .single();

      if (profileError) {
        console.error(`❌ Profile fetch error:`, profileError.message);
        continue;
      }

      console.log(`   Profile ID : ${profile.id}`);

      if (profile.id !== authUser.id) {
        console.log(`⚠️ UUID Mismatch Detected! Re-linking profile...`);

        // We delete the old row and insert with new ID to safely migrate primary key
        const oldId = profile.id;
        const linkedProfile = { ...profile, id: authUser.id, updated_at: new Date().toISOString() };

        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', oldId);

        if (deleteError) {
          console.error(`❌ Failed to delete old row:`, deleteError.message);
          continue;
        }

        const { error: insertError } = await supabase
          .from('profiles').insert(linkedProfile);

        if (insertError) {
          console.error(`❌ Failed to insert linked profile:`, insertError.message);
          continue;
        }

        console.log(`🎉 Success! Profile for @${c.username} is now correctly linked to Auth account.`);
      } else {
        console.log(`✅ Profile is already correctly linked.`);
      }
    }

  } catch (error: any) {
    console.error('❌ Failed to run mismatch resolver:', error.message);
  }
}

main();
