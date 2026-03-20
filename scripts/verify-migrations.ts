/**
 * Migration Verification Script
 * 
 * Verifies that all required database columns exist in the profiles table.
 * This helps identify which migrations need to be run.
 * 
 * Usage:
 *   npm run verify-migrations
 * 
 * Or directly:
 *   npx tsx scripts/verify-migrations.ts
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

// Define all required columns with their expected types
const REQUIRED_COLUMNS = {
  // Core profile fields (should always exist)
  core: [
    'id',
    'first_name',
    'last_name',
    'avatar_url',
    'role',
    'created_at',
    'updated_at',
  ],
  
  // Onboarding fields
  onboarding: [
    'onboarding_complete',
  ],
  
  // Business fields
  business: [
    'business_name',
    'gstin',
    'business_entity_type',
    'organization_id',
  ],
  
  // Trial fields (from 2025_11_20_add_trial_fields_to_profiles.sql)
  trial: [
    'is_trial',
    'trial_started_at',
    'trial_expires_at',
    'trial_locked',
  ],
  
  // Creator profile fields (from 2025_11_21_add_creator_profile_fields.sql)
  creator_profile: [
    'creator_category',
    'pricing_min',
    'pricing_avg',
    'pricing_max',
    'bank_account_name',
    'bank_account_number',
    'bank_ifsc',
    'bank_upi',
    'gst_number',
    'pan_number',
    'referral_code',
    'instagram_followers',
    'youtube_subs',
    'tiktok_followers',
    'twitter_followers',
    'facebook_followers',
  ],
  
  // Social handles
  social_handles: [
    'instagram_handle',
    'youtube_channel_id',
    'tiktok_handle',
    'facebook_profile_url',
    'twitter_handle',
  ],
  
  // Profile fields (from 2025_11_26_add_profile_fields.sql)
  profile_fields: [
    'phone',
    'location',
    'bio',
    'platforms',
    'goals',
  ],
};

async function verifyMigrations() {
  console.log('🔍 Verifying database migrations...\n');
  console.log('📋 Checking required columns in `profiles` table...\n');

  try {
    // Test each column by attempting to select it
    // Note: Supabase client doesn't support querying information_schema directly
    // So we'll test each column by attempting to select it
    
    console.log('⚠️  Testing columns by attempting to query them...\n');
    
    const results: Record<string, { exists: boolean; category: string }> = {};
    
    // Test each column by trying to select it
    for (const category of Object.keys(REQUIRED_COLUMNS)) {
      const columns = REQUIRED_COLUMNS[category as keyof typeof REQUIRED_COLUMNS];
      for (const column of columns) {
        try {
          // Try to select just this column (will fail if column doesn't exist)
          const { error: testError } = await supabase
            .from('profiles')
            .select(column)
            .limit(1);
          
          const exists = !testError || 
            (testError as any)?.code !== '42703' && 
            !(testError as any)?.message?.includes('column') &&
            !(testError as any)?.message?.includes('does not exist');
          
          results[column] = { exists, category };
        } catch (err: any) {
          const exists = !err?.message?.includes('column') && 
                        !err?.message?.includes('does not exist');
          results[column] = { exists, category };
        }
      }
    }
    
    // Report results
    let allGood = true;
    const missingByCategory: Record<string, string[]> = {};
    
    for (const [category, columns] of Object.entries(REQUIRED_COLUMNS)) {
      console.log(`\n📦 ${category.toUpperCase().replace('_', ' ')}:`);
      const missing: string[] = [];
      
      for (const column of columns) {
        const result = results[column];
        if (result && result.exists) {
          console.log(`  ✅ ${column}`);
        } else {
          console.log(`  ❌ ${column} - MISSING`);
          missing.push(column);
          allGood = false;
        }
      }
      
      if (missing.length > 0) {
        missingByCategory[category] = missing;
        console.log(`\n  ⚠️  Missing columns: ${missing.join(', ')}`);
      }
    }
    
    if (allGood) {
      console.log('\n✅ All required columns exist!');
      console.log('🎉 Your database is up to date.');
    } else {
      console.log('\n❌ Some columns are missing. Please run the required migrations.');
      console.log('\n📚 Migration files to run:');
      
      if (missingByCategory.trial) {
        console.log('  📝 2025_11_20_add_trial_fields_to_profiles.sql');
      }
      if (missingByCategory.creator_profile) {
        console.log('  📝 2025_11_21_add_creator_profile_fields.sql');
      }
      if (missingByCategory.profile_fields) {
        console.log('  📝 2025_11_26_add_profile_fields.sql');
      }
      
      console.log('\n💡 To fix: Copy the SQL from the migration file and run it in Supabase Dashboard → SQL Editor');
    }

  } catch (error: any) {
    console.error('\n❌ Error verifying migrations:');
    console.error(error.message);
    
    if (error.message?.includes('permission') || error.message?.includes('access')) {
      console.error('\n💡 Tip: Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly');
    }
    
    process.exit(1);
  }
}

// Run the verification
verifyMigrations();

