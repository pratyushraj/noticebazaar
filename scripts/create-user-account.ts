/**
 * Script to Create a User Account with Custom Email
 *
 * This script creates a user account with a specified email address.
 * It's useful for creating test accounts with real email addresses.
 *
 * Usage:
 *   npm run create-user -- --email pratyushraj@outlook.com --password YourPassword123!
 *
 * Or set environment variables:
 *   USER_EMAIL=pratyushraj@outlook.com USER_PASSWORD=YourPassword123! npm run create-user
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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Get email and password from command line args or environment variables
const args = process.argv.slice(2);
let userEmail = process.env.USER_EMAIL;
let userPassword = process.env.USER_PASSWORD;
let userRole: 'creator' | 'client' = (process.env.USER_ROLE as any) || 'client';
let skipOnboarding = process.env.SKIP_ONBOARDING === 'true' || false;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) {
    userEmail = args[i + 1];
    i++;
  } else if (args[i] === '--password' && args[i + 1]) {
    userPassword = args[i + 1];
    i++;
  } else if (args[i] === '--role' && args[i + 1]) {
    userRole = args[i + 1] as 'creator' | 'client';
    i++;
  } else if (args[i] === '--skip-onboarding') {
    skipOnboarding = true;
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
  console.error('  npm run create-user -- --email your@email.com --password YourPassword123!');
  console.error('\nOr set environment variables:');
  console.error('  USER_EMAIL=your@email.com USER_PASSWORD=YourPassword123! npm run create-user');
  process.exit(1);
}

if (!userPassword) {
  console.error('❌ Error: Password is required');
  console.error('\nUsage:');
  console.error('  npm run create-user -- --email your@email.com --password YourPassword123!');
  console.error('\nOr set environment variables:');
  console.error('  USER_EMAIL=your@email.com USER_PASSWORD=YourPassword123! npm run create-user');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserAccount() {
  console.log('🌱 Starting user account creation script...\n');
  console.log(`📧 Email: ${userEmail}`);
  console.log(`👤 Role: ${userRole}`);
  console.log(`✅ Skip Onboarding: ${skipOnboarding}\n`);

  try {
    // Step 1: Check if user already exists
    console.log('📧 Checking if user exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === userEmail);

    let userId: string;

    if (existingUser) {
      console.log('⚠️  User already exists. Deleting old user...');
      // Delete existing user and profile
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('✅ Old user deleted');
    }

    // Step 2: Create new user
    console.log('\n👤 Creating user account...');
    const firstName = userEmail.split('@')[0].split('.')[0];
    const lastName = userEmail.split('@')[0].split('.').slice(1).join(' ') || '';
    
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        last_name: lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1) : '',
      }
    });

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    if (!newUser.user) {
      throw new Error('Failed to create user: No user returned');
    }

    userId = newUser.user.id;
    console.log(`✅ User created: ${userId}`);

    // Step 3: Create/Update profile
    console.log('\n📝 Creating/Updating profile...');
    const now = new Date();
    const trialExpiresAt = new Date(now);
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

    const profileData: any = {
      id: userId,
      first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      last_name: lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1) : '',
      role: userRole,
      onboarding_complete: skipOnboarding,
      is_trial: userRole === 'creator',
      trial_started_at: userRole === 'creator' ? now.toISOString() : null,
      trial_expires_at: userRole === 'creator' ? trialExpiresAt.toISOString() : null,
      trial_locked: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      });

    if (profileError) {
      throw new Error(`Failed to create/update profile: ${profileError.message}`);
    }
    console.log('✅ Profile created/updated');

    // Step 4: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ User account creation completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Account Credentials:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Onboarding Complete: ${skipOnboarding}`);
    console.log('\n🚀 You can now log in at: /login');
    if (userRole === 'creator' && !skipOnboarding) {
      console.log('   You will be redirected to the onboarding flow.');
    } else {
      console.log(`   You will be redirected to the ${userRole} dashboard.\n`);
    }

  } catch (error: any) {
    console.error('\n❌ Error during user account creation:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the script
createUserAccount();

