import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from multiple possible locations
dotenv.config({ path: join(process.cwd(), 'server/.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const USER_IDS = [
  'f5e28653-d355-4408-ae77-4ee27ae41102',
  'de7fe513-487a-4f90-bf1a-ce0e8014d6ef'
];

async function fixNewAccounts() {
  console.log('🔧 Fixing new accounts...\n');

  try {
    // Step 1: Check current status
    console.log('📋 Checking current profile status...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name, onboarding_complete')
      .in('id', USER_IDS);

    if (profileError) {
      console.error('❌ Error checking profiles:', profileError.message);
      return;
    }

    console.log('Current profiles:');
    profiles?.forEach(p => {
      console.log(`  - ${p.id}: role=${p.role || 'NULL'}, onboarding=${p.onboarding_complete}`);
    });

    // Step 2: Check if users exist in auth
    console.log('\n📧 Checking auth users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error checking users:', usersError.message);
      return;
    }

    const existingUsers = users?.users?.filter(u => USER_IDS.includes(u.id));
    console.log(`Found ${existingUsers?.length || 0} users in auth:`);
    existingUsers?.forEach(u => {
      console.log(`  - ${u.id}: ${u.email}`);
    });

    // Step 3: Fix profiles
    console.log('\n🔧 Fixing profiles...');
    for (const userId of USER_IDS) {
      const existingProfile = profiles?.find(p => p.id === userId);
      const user = existingUsers?.find(u => u.id === userId);

      if (!user) {
        console.log(`⚠️  User ${userId} not found in auth.users, skipping...`);
        continue;
      }

      const profileData: any = {
        id: userId,
        role: 'creator',
        onboarding_complete: false, // Allow dashboard access
        updated_at: new Date().toISOString(),
      };

      // If profile doesn't exist, add created_at
      if (!existingProfile) {
        profileData.created_at = new Date().toISOString();
        console.log(`  Creating profile for ${userId}...`);
      } else {
        console.log(`  Updating profile for ${userId} (current role: ${existingProfile.role || 'NULL'})...`);
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error(`  ❌ Error updating profile for ${userId}:`, upsertError.message);
      } else {
        console.log(`  ✅ Profile fixed for ${userId}`);
      }
    }

    // Step 4: Verify the fix
    console.log('\n✅ Verifying fix...');
    const { data: fixedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, role, onboarding_complete')
      .in('id', USER_IDS);

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError.message);
      return;
    }

    console.log('\n📊 Final status:');
    fixedProfiles?.forEach(p => {
      console.log(`  - ${p.id}: role=${p.role}, onboarding=${p.onboarding_complete}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Fix completed!');
    console.log('='.repeat(50));
    console.log('\n📋 Next steps:');
    console.log('   1. Users should refresh their browser');
    console.log('   2. Navbar should now appear');
    console.log('   3. "Add Deal" and "Track Payments" buttons should work');
    console.log('   4. All creator routes should be accessible\n');

  } catch (error: any) {
    console.error('\n❌ Error during fix:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the script
fixNewAccounts();

