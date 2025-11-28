/**
 * Script to fix user dashboard redirect issue
 * Updates user profile to have 'creator' role and onboarding_complete = true
 * 
 * Usage: npx tsx scripts/fix-user-dashboard.ts <userId>
 * Example: npx tsx scripts/fix-user-dashboard.ts 3f5a1cb5-cbd1-4dff-aa39-66a4d1fbd17b
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserDashboard(userId: string) {
  console.log(`\n🔍 Checking user profile for: ${userId}\n`);

  try {
    // 1. Check current profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, onboarding_complete, first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching profile:', fetchError.message);
      
      // Check if profile exists in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError) {
        console.error('❌ User not found in auth.users:', authError.message);
        process.exit(1);
      }
      
      console.log('✅ User exists in auth.users but no profile found');
      console.log('   Creating profile...');
      
      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'creator',
          onboarding_complete: true,
          first_name: authUser.user.user_metadata?.first_name || null,
          last_name: authUser.user.user_metadata?.last_name || null,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        process.exit(1);
      }

      console.log('✅ Profile created successfully!');
      console.log('   Role: creator');
      console.log('   Onboarding Complete: true');
      return;
    }

    if (!profile) {
      console.error('❌ Profile not found');
      process.exit(1);
    }

    console.log('📋 Current Profile:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Role: ${profile.role || 'null'}`);
    console.log(`   Onboarding Complete: ${profile.onboarding_complete || false}`);
    console.log(`   Name: ${profile.first_name || ''} ${profile.last_name || ''}`);

    // 2. Check if update is needed
    const needsUpdate = profile.role !== 'creator' || !profile.onboarding_complete;

    if (!needsUpdate) {
      console.log('\n✅ Profile is already correct!');
      console.log('   Role: creator');
      console.log('   Onboarding Complete: true');
      return;
    }

    console.log('\n🔧 Updating profile...');

    // 3. Update profile
    const updates: any = {};
    if (profile.role !== 'creator') {
      updates.role = 'creator';
    }
    if (!profile.onboarding_complete) {
      updates.onboarding_complete = true;
    }
    updates.updated_at = new Date().toISOString();

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      process.exit(1);
    }

    console.log('\n✅ Profile updated successfully!');
    console.log('📋 Updated Profile:');
    console.log(`   Role: ${updatedProfile.role}`);
    console.log(`   Onboarding Complete: ${updatedProfile.onboarding_complete}`);
    console.log(`   Updated At: ${updatedProfile.updated_at}`);

    console.log('\n🎉 User should now see the creator dashboard!');
    console.log('   (User may need to refresh the page or log out and log back in)');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID');
  console.error('Usage: npx tsx scripts/fix-user-dashboard.ts <userId>');
  console.error('Example: npx tsx scripts/fix-user-dashboard.ts 3f5a1cb5-cbd1-4dff-aa39-66a4d1fbd17b');
  process.exit(1);
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('❌ Invalid UUID format');
  process.exit(1);
}

// Run the fix
fixUserDashboard(userId)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

