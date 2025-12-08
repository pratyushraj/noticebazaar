/**
 * Script to Update Prateek's Profile
 *
 * Updates first_name and last_name for Prateek (lawyer)
 * User ID: 27239566-f735-4423-a898-8dbaee1ec77f
 *
 * Usage:
 *   npm run update-prateek-profile
 *
 * Requires:
 *   - VITE_SUPABASE_URL in .env
 *   - SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const PRATEEK_USER_ID = '27239566-f735-4423-a898-8dbaee1ec77f';

async function updatePrateekProfile() {
  console.log('🔄 Updating Prateek\'s profile...\n');
  console.log(`👤 User ID: ${PRATEEK_USER_ID}\n`);

  try {
    // Step 1: Check current profile
    console.log('📝 Checking current profile...');
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('id', PRATEEK_USER_ID)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch profile: ${fetchError.message}`);
    }

    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    console.log('   Current profile:');
    console.log(`   - First Name: ${currentProfile.first_name || '(null)'}`);
    console.log(`   - Last Name: ${currentProfile.last_name || '(null)'}`);
    console.log(`   - Role: ${currentProfile.role}\n`);

    // Step 2: Update profile
    console.log('🔄 Updating profile...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: 'Prateek',
        last_name: '',
        updated_at: new Date().toISOString()
      })
      .eq('id', PRATEEK_USER_ID)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log('✅ Profile updated successfully\n');

    // Step 3: Verify update
    console.log('📋 Updated Profile:');
    console.log(`   - First Name: ${updatedProfile.first_name}`);
    console.log(`   - Last Name: ${updatedProfile.last_name || '(empty)'}`);
    console.log(`   - Role: ${updatedProfile.role}`);
    console.log(`   - Updated At: ${updatedProfile.updated_at}\n`);

    console.log('='.repeat(50));
    console.log('✅ Prateek\'s profile update completed successfully!');
    console.log('='.repeat(50));
    console.log('\n🚀 Next steps:');
    console.log('   1. Refresh the Messages page');
    console.log('   2. The advisor name should now show "Prateek" instead of "null null"');

  } catch (error: any) {
    console.error('\n❌ Error updating profile:', error.message);
    process.exit(1);
  }
}

updatePrateekProfile();

