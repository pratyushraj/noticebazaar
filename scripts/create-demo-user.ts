/**
 * Simple Demo User Creation Script
 * 
 * Creates a demo user account with minimal setup.
 * 
 * Usage:
 *   npx tsx scripts/create-demo-user.ts
 * 
 * Or with environment variables:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key npx tsx scripts/create-demo-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  console.error('\nAlternatively, you can create the user manually in Supabase Dashboard.');
  console.error('See DEMO_USER_CREDENTIALS.md for instructions.\n');
  process.exit(1);
}

// Demo account credentials
const DEMO_EMAIL = 'demo@noticebazaar.com';
const DEMO_PASSWORD = 'Demo123!@#';

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUser() {
  console.log('🌱 Creating demo user account...\n');

  try {
    // Step 1: Check if user already exists
    console.log('📧 Checking if demo user exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);

    let userId: string;

    if (existingUser) {
      console.log('⚠️  Demo user already exists.');
      console.log(`   User ID: ${existingUser.id}`);
      userId = existingUser.id;
      
      // Update profile to ensure it's set up correctly
      console.log('\n📝 Updating profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: 'creator',
          first_name: 'Demo',
          last_name: 'User',
          onboarding_complete: true,
          is_trial: true,
          trial_started_at: new Date().toISOString(),
          trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_locked: false,
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.warn(`⚠️  Warning: Could not update profile: ${profileError.message}`);
      } else {
        console.log('✅ Profile updated');
      }
    } else {
      // Step 2: Create new user
      console.log('\n👤 Creating demo user...');
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: 'Demo',
          last_name: 'User',
        }
      });

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      if (!newUser.user) {
        throw new Error('Failed to create user: No user returned');
      }

      userId = newUser.user.id;
      console.log(`✅ Demo user created: ${userId}`);

      // Step 3: Create profile
      console.log('\n📝 Creating creator profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: 'Demo',
          last_name: 'User',
          role: 'creator',
          onboarding_complete: true, // Skip onboarding for demo account
          is_trial: true,
          trial_started_at: new Date().toISOString(),
          trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          trial_locked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
      console.log('✅ Creator profile created');
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo user account ready!');
    console.log('='.repeat(50));
    console.log('\n📋 Demo Account Credentials:');
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log(`   User ID: ${userId}`);
    console.log('\n📊 Account Details:');
    console.log(`   ✅ User account (email confirmed)`);
    console.log(`   ✅ Creator profile (onboarding complete)`);
    console.log(`   ✅ Trial activated (30 days)`);
    console.log('\n🚀 You can now log in at: /login');
    console.log('   The account will go directly to the creator dashboard.\n');

  } catch (error: any) {
    console.error('\n❌ Error creating demo user:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.error('\n💡 Tip: You can also create the user manually in Supabase Dashboard.');
    console.error('   See DEMO_USER_CREDENTIALS.md for instructions.\n');
    process.exit(1);
  }
}

// Run the script
createDemoUser();

