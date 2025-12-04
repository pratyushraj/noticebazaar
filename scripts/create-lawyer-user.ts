/**
 * Script to create or update a lawyer user account
 * Usage: tsx scripts/create-lawyer-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
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

async function createOrUpdateLawyerUser() {
  const email = 'lawyer@yopmail.com';
  const password = 'Lawyer123!@#';
  const firstName = 'Legal';
  const lastName = 'Advisor';

  console.log('🔄 Creating/updating lawyer user account...\n');

  try {
    // Step 1: Check if user exists
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(email);

    let userId: string;

    if (existingUser?.user) {
      console.log('✅ User already exists, updating...');
      userId = existingUser.user.id;
    } else {
      console.log('📝 Creating new user...');
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        throw new Error(`Failed to create user: ${createError?.message || 'Unknown error'}`);
      }

      userId = newUser.user.id;
      console.log('✅ User created successfully');
    }

    // Step 2: Update or create profile
    const now = new Date();
    const profileData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      role: 'lawyer',
      onboarding_complete: true,
      updated_at: now.toISOString(),
    };

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
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

    // Step 3: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Lawyer user account setup completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Account Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${userId}`);
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
createOrUpdateLawyerUser();

