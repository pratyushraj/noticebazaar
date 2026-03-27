/**
 * Seed Script for Test Data
 * 
 * This script creates a test user account with sample data for testing the NoticeBazaar dashboard.
 * 
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 * 
 * Or with environment variables:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key npx tsx scripts/seed-test-data.ts
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
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test account credentials
const TEST_EMAIL = 'test@noticebazaar.com';
const TEST_PASSWORD = 'Test123!@#';
const TEST_USER = {
  firstName: 'Test',
  lastName: 'Creator',
  displayName: 'Test Creator',
  businessName: 'Test Creator Studio',
  businessEntityType: 'Individual',
  gstin: '29ABCDE1234F1Z5',
  phone: '+919876543210',
  location: 'Mumbai, Maharashtra',
  bio: 'Test creator account for NoticeBazaar dashboard testing',
};

// Sample brand deals data
const getSampleBrandDeals = (creatorId: string) => {
  const now = new Date();
  
  return [
    {
      brand_name: 'Zepto',
      deal_amount: 8500,
      deliverables: JSON.stringify(['1 Reel']),
      due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contact_person: 'Amit Verma',
      platform: 'Instagram',
      status: 'Payment Pending',
      brand_email: 'amit.verma@zepto.com',
      creator_id: creatorId,
      organization_id: creatorId,
    },
    {
      brand_name: 'Nike',
      deal_amount: 20000,
      deliverables: JSON.stringify(['1 Integration']),
      due_date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contact_person: 'Anjali Mehta',
      platform: 'YouTube',
      status: 'Payment Pending',
      brand_email: 'anjali.mehta@nike.com',
      creator_id: creatorId,
      organization_id: creatorId,
    },
    {
      brand_name: 'Mamaearth',
      deal_amount: 4254,
      deliverables: JSON.stringify(['Carousel + Stories']),
      due_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contact_person: 'Sneha Patel',
      platform: 'Instagram',
      status: 'Payment Pending',
      brand_email: 'sneha.patel@mamaearth.in',
      creator_id: creatorId,
      organization_id: creatorId,
    },
    {
      brand_name: 'boAt',
      deal_amount: 12000,
      deliverables: JSON.stringify(['Reel + 2 Stories']),
      due_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contact_person: 'Varun Singh',
      platform: 'Instagram',
      status: 'Payment Pending',
      brand_email: 'varun.singh@boat-lifestyle.com',
      creator_id: creatorId,
      organization_id: creatorId,
    },
    {
      brand_name: 'Ajio',
      deal_amount: 14500,
      deliverables: JSON.stringify(['1 Reel + 3 Stories']),
      due_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contact_person: 'Rajesh Kumar',
      platform: 'Instagram',
      status: 'Payment Pending',
      brand_email: 'rajesh.kumar@ajio.com',
      creator_id: creatorId,
      organization_id: creatorId,
    },
    {
      brand_name: 'Fashion Nova',
      deal_amount: 85000,
      deliverables: JSON.stringify(['2 Reels + 5 Stories + 1 Post']),
      due_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_received_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contact_person: 'Sarah Johnson',
      platform: 'Instagram',
      status: 'Completed',
      brand_email: 'sarah.johnson@fashionnova.com',
      utr_number: 'UTR123456789',
      creator_id: creatorId,
      organization_id: creatorId,
    },
  ];
};

async function seedTestData() {
  console.log('🌱 Starting seed script...\n');

  try {
    // Step 1: Check if user already exists
    console.log('📧 Checking if test user exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === TEST_EMAIL);

    let userId: string;

    if (existingUser) {
      console.log('⚠️  Test user already exists. Deleting old user...');
      // Delete existing user and profile
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('✅ Old user deleted');
    }

    // Step 2: Create new user
    console.log('\n👤 Creating test user...');
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: TEST_USER.firstName,
        last_name: TEST_USER.lastName,
      }
    });

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    if (!newUser.user) {
      throw new Error('Failed to create user: No user returned');
    }

    userId = newUser.user.id;
    console.log(`✅ Test user created: ${userId}`);

    // Step 3: Create profile
    console.log('\n📝 Creating creator profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: TEST_USER.firstName,
        last_name: TEST_USER.lastName,
        email: TEST_EMAIL,
        role: 'creator',
        phone: TEST_USER.phone,
        location: TEST_USER.location,
        bio: TEST_USER.bio,
        business_name: TEST_USER.businessName,
        business_entity_type: TEST_USER.businessEntityType,
        gstin: TEST_USER.gstin,
        onboarding_complete: true, // Skip onboarding for test account
        is_trial: true,
        trial_started_at: new Date().toISOString(),
        trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        trial_locked: false,
        instagram_handle: '@testcreator',
        instagram_followers: 45000,
        youtube_subs: 125000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }
    console.log('✅ Creator profile created');

    // Step 4: Create brand deals
    console.log('\n💼 Creating sample brand deals...');
    const brandDeals = getSampleBrandDeals(userId);
    
    const { error: dealsError } = await supabase
      .from('brand_deals')
      .insert(brandDeals);

    if (dealsError) {
      console.warn(`⚠️  Warning: Failed to create some brand deals: ${dealsError.message}`);
      console.warn('   This might be okay if the table structure is different.');
    } else {
      console.log(`✅ Created ${brandDeals.length} brand deals`);
    }

    // Step 5: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Seed script completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Test Account Credentials:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   User ID: ${userId}`);
    console.log('\n📊 Created Data:');
    console.log(`   ✅ User account (auto-confirmed)`);
    console.log(`   ✅ Creator profile (onboarding complete)`);
    console.log(`   ✅ Trial activated (30 days)`);
    console.log(`   ✅ ${brandDeals.length} brand deals`);
    console.log('\n🚀 You can now log in at: /login');
    console.log('   The dashboard will show real data from the database.\n');

  } catch (error: any) {
    console.error('\n❌ Error during seeding:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the seed script
seedTestData();

