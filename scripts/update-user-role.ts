/**
 * Script to Update User Role
 *
 * This script updates a user's role in the database.
 * Useful for changing a user from 'client' to 'creator' or vice versa.
 *
 * Usage:
 *   npm run update-role -- --email pratyushraj@outlook.com --role creator
 *
 * Or set environment variables:
 *   USER_EMAIL=pratyushraj@outlook.com USER_ROLE=creator npm run update-role
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

// Get email and role from command line args or environment variables
const args = process.argv.slice(2);
let userEmail = process.env.USER_EMAIL;
let userRole: 'creator' | 'client' | 'admin' | 'chartered_accountant' = (process.env.USER_ROLE as any) || 'creator';

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) {
    userEmail = args[i + 1];
    i++;
  } else if (args[i] === '--role' && args[i + 1]) {
    userRole = args[i + 1] as any;
    i++;
  }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

if (!userEmail) {
  console.error('❌ Error: Email is required');
  console.error('\nUsage:');
  console.error('  npm run update-role -- --email your@email.com --role creator');
  console.error('\nOr set environment variables:');
  console.error('  USER_EMAIL=your@email.com USER_ROLE=creator npm run update-role');
  process.exit(1);
}

const allowedRoles = ['creator', 'client', 'admin', 'chartered_accountant'];
if (!allowedRoles.includes(userRole)) {
  console.error(`❌ Error: Invalid role "${userRole}"`);
  console.error(`Allowed roles: ${allowedRoles.join(', ')}`);
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserRole() {
  console.log('🔄 Starting user role update...\n');
  console.log(`📧 Email: ${userEmail}`);
  console.log(`👤 New Role: ${userRole}\n`);

  try {
    // Step 1: Find user by email
    console.log('📧 Finding user by email...');
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }

    const user = userData?.users?.find(u => u.email === userEmail);
    
    if (!user) {
      throw new Error(`User with email ${userEmail} not found`);
    }

    console.log(`✅ User found: ${user.id}`);

    // Step 2: Check current profile
    console.log('\n📝 Checking current profile...');
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    if (currentProfile) {
      console.log(`   Current role: ${currentProfile.role || 'not set'}`);
      console.log(`   Onboarding complete: ${currentProfile.onboarding_complete || false}`);
    } else {
      console.log('   No profile found - will create one');
    }

    // Step 3: Update or create profile
    console.log(`\n🔄 Updating profile to role: ${userRole}...`);
    const now = new Date();
    
    const profileData: any = {
      id: user.id,
      role: userRole,
      updated_at: now.toISOString(),
    };

    // If creating a new profile, add default fields
    if (!currentProfile) {
      profileData.created_at = now.toISOString();
      profileData.onboarding_complete = userRole === 'creator' ? false : true;
      
      // Add trial fields for creators
      if (userRole === 'creator') {
        const trialExpiresAt = new Date(now);
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);
        profileData.is_trial = true;
        profileData.trial_started_at = now.toISOString();
        profileData.trial_expires_at = trialExpiresAt.toISOString();
        profileData.trial_locked = false;
      }
    } else {
      // If changing to creator and onboarding wasn't complete, keep it false
      // If changing from creator to another role, set onboarding_complete to true
      if (userRole === 'creator' && currentProfile.role !== 'creator') {
        // If user is switching TO creator, check if they want onboarding
        // For fixing dashboard issues, set onboarding_complete to true
        profileData.onboarding_complete = true; // Changed: set to true to skip onboarding
      } else if (userRole !== 'creator' && currentProfile.role === 'creator') {
        profileData.onboarding_complete = true;
      } else if (userRole === 'creator' && currentProfile.role === 'creator') {
        // Already creator, ensure onboarding_complete is true
        profileData.onboarding_complete = true;
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      });

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log('✅ Profile updated successfully');

    // Step 4: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ User role update completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Updated Account:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Onboarding Complete: ${profileData.onboarding_complete}`);
    console.log('\n🚀 Next steps:');
    if (userRole === 'creator' && !profileData.onboarding_complete) {
      console.log('   1. Log out and log back in');
      console.log('   2. You will be redirected to /creator-onboarding');
      console.log('   3. Complete onboarding to access the Creator Dashboard');
    } else {
      console.log('   1. Log out and log back in');
      console.log(`   2. You will be redirected to /${userRole === 'client' ? 'client' : 'creator'}-dashboard`);
    }
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Error during role update:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the script
updateUserRole();

