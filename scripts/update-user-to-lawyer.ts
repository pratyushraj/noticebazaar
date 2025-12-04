/**
 * Script to update a specific user to lawyer role
 * Usage: tsx scripts/update-user-to-lawyer.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function updateUserToLawyer() {
  const userId = '27239566-f735-4423-a898-8dbaee1ec77f';
  const firstName = 'Legal';
  const lastName = 'Advisor';

  console.log('🔄 Updating user to lawyer role...\n');
  console.log(`📋 User ID: ${userId}\n`);

  try {
    // Step 1: Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }

    const user = userData?.users?.find(u => u.id === userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(`✅ User found: ${user.email}`);

    // Step 2: Check current profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (currentProfile) {
      console.log(`   Current role: ${currentProfile.role || 'not set'}`);
      console.log(`   Current name: ${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`);
    } else {
      console.log('   No profile found - will create one');
    }

    // Step 3: Update or create profile
    const now = new Date();
    const profileData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      role: 'lawyer',
      onboarding_complete: true,
      updated_at: now.toISOString(),
    };

    if (currentProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      console.log('✅ Profile updated successfully');
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          created_at: now.toISOString(),
        });

      if (insertError) {
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }
      console.log('✅ Profile created successfully');
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ User updated to lawyer role successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Account Details:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: lawyer`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log('\n🔗 Login URL: http://localhost:8080/login');
    console.log('📱 Dashboard URL: http://localhost:8080/lawyer-dashboard');
    console.log('\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
updateUserToLawyer();

