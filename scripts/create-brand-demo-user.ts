/**
 * Simple Brand Demo User Creation Script
 *
 * Creates a demo BRAND user (role: 'brand') for accessing /brand-dashboard.
 *
 * Usage:
 *   npx tsx scripts/create-brand-demo-user.ts
 *
 * Requires:
 *   - VITE_SUPABASE_URL in .env or .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) in .env or .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Demo BRAND account credentials
const DEMO_EMAIL = 'brand-demo@noticebazaar.com';
const DEMO_PASSWORD = 'BrandDemo123!@#';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createBrandDemoUser() {
  console.log('🌱 Creating brand demo user account...\n');

  try {
    console.log('📧 Checking if brand demo user exists...');
    const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw new Error(`Failed to list users: ${listErr.message}`);

    const existingUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);
    let userId: string;

    if (existingUser) {
      console.log('⚠️  Brand demo user already exists.');
      console.log(`   User ID: ${existingUser.id}`);
      userId = existingUser.id;
    } else {
      console.log('\n👤 Creating brand demo user...');
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: 'Brand',
          last_name: 'Demo',
        },
      });

      if (userError) throw new Error(`Failed to create user: ${userError.message}`);
      if (!newUser.user) throw new Error('Failed to create user: No user returned');

      userId = newUser.user.id;
      console.log(`✅ Brand demo user created: ${userId}`);
    }

    console.log('\n📝 Upserting brand profile...');
    const now = new Date().toISOString();
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          role: 'brand',
          first_name: 'Brand',
          last_name: 'Demo',
          business_name: 'Demo Brand Co',
          onboarding_complete: true,
          updated_at: now,
        },
        { onConflict: 'id' }
      );

    if (profileError) throw new Error(`Failed to upsert profile: ${profileError.message}`);
    console.log('✅ Brand profile ready');

    console.log('\n' + '='.repeat(50));
    console.log('✅ Brand demo account ready!');
    console.log('='.repeat(50));
    console.log('\n📋 Brand Demo Credentials:');
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log(`   Role: brand`);
    console.log('\n🚀 Login at: /login (then you should land on /brand-dashboard)\n');
  } catch (err: any) {
    console.error('\n❌ Error creating brand demo user:');
    console.error(err?.message || String(err));
    process.exit(1);
  }
}

createBrandDemoUser();
