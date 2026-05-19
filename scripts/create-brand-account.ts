import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import crypto from 'crypto';

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

// Brand details to insert
const BRAND_EMAIL = 'meenakshi.s@nuvexo.co.in';
const BRAND_NAME = 'Lickicious';
const BRAND_FIRST_NAME = 'Meenakshi';
const BRAND_LAST_NAME = 'S.';
const BRAND_PHONE = '9918383777';
const BRAND_INDUSTRY = 'Pet Care';
const BRAND_WEBSITE = 'https://www.lickicious.com/';
const BRAND_INSTAGRAM = 'lickicious.petfood';
const BRAND_ADDRESS = 'Regus- Chembur, Unit no 9, 9th Floor, Corporate Park II, Chembur, Mumbai, Maharashtra, 400071';
const BRAND_DESCRIPTION = 'Founded by alumni from IIT/SP Jain and NIT/XLRI along with industry experts, LICKICIOUS™ is dedicated to addressing the distinct challenges faced by Indian pet parents & their pets. LICKICIOUS offers dog and cat food crafted with superior nutrition (incorporating 39-43 essential nutrients) optimized for the hot & humid Indian climate.';

// Parse command line arguments
const args = process.argv.slice(2);
let customPassword = '';
let forceRecreate = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--password' && args[i + 1]) {
    customPassword = args[i + 1];
    i++;
  } else if (args[i] === '--force') {
    forceRecreate = true;
  }
}

// Generate a secure temporary password if not provided
const password = customPassword || generateSecurePassword();

function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let pass = '';
  // Ensure at least one of each class
  pass += 'A';
  pass += 'a';
  pass += '1';
  pass += '!';
  for (let i = 4; i < 16; i++) {
    pass += chars.charAt(crypto.randomInt(0, chars.length));
  }
  // Shuffle password
  return pass.split('').sort(() => 0.5 - Math.random()).join('');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  console.log('🌱 Starting brand account creation for Lickicious...\n');
  console.log(`📧 Primary Email: ${BRAND_EMAIL}`);
  console.log(`👤 Name: ${BRAND_FIRST_NAME} ${BRAND_LAST_NAME}`);
  console.log(`📞 Phone: ${BRAND_PHONE}`);
  console.log(`🏢 Brand: ${BRAND_NAME}`);
  console.log(`🌐 Website: ${BRAND_WEBSITE}`);
  console.log(`📸 Instagram: ${BRAND_INSTAGRAM}`);
  console.log(`📍 Address: ${BRAND_ADDRESS}\n`);

  try {
    // 1. Check if user already exists
    console.log('🔍 Checking if user exists in Supabase Auth...');
    const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw new Error(`Failed to list users: ${listErr.message}`);

    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === BRAND_EMAIL.toLowerCase());
    let userId: string;

    if (existingUser) {
      if (forceRecreate) {
        console.log('⚠️ User already exists. Deleting user for a fresh recreation (--force)...');
        const { error: deleteErr } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (deleteErr) throw new Error(`Failed to delete user: ${deleteErr.message}`);
        
        // Also delete profile and brand records to prevent orphaned constraint issues
        await supabase.from('profiles').delete().eq('id', existingUser.id);
        await supabase.from('brands').delete().eq('external_id', existingUser.id);
        console.log('✅ Existing user deleted.');
        
        userId = await createAuthUser();
      } else {
        console.log(`✅ User already exists. Keeping existing user with ID: ${existingUser.id}`);
        userId = existingUser.id;
      }
    } else {
      userId = await createAuthUser();
    }

    // 2. Upsert Profile
    console.log('\n📝 Upserting profile record...');
    const now = new Date().toISOString();
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: 'brand',
        first_name: BRAND_FIRST_NAME,
        last_name: BRAND_LAST_NAME,
        business_name: BRAND_NAME,
        phone: BRAND_PHONE,
        onboarding_complete: true,
        updated_at: now,
      }, { onConflict: 'id' });

    if (profileError) throw new Error(`Failed to upsert profile: ${profileError.message}`);
    console.log('✅ Profile updated/created.');

    // 3. Upsert Brand Record
    console.log('\n🏢 Upserting brand record...');
    // We check if a brand with external_id = userId already exists
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('external_id', userId)
      .maybeSingle();

    const brandPayload: any = {
      external_id: userId,
      name: BRAND_NAME,
      industry: BRAND_INDUSTRY,
      description: BRAND_DESCRIPTION,
      website_url: BRAND_WEBSITE,
      instagram_handle: BRAND_INSTAGRAM,
      verified: true,
      status: 'active',
      source: 'manual',
      address: BRAND_ADDRESS,
      updated_at: now,
    };

    let brandId: string;
    if (existingBrand?.id) {
      console.log(`   Brand entry found. Updating brand ID: ${existingBrand.id}`);
      const { error: brandErr } = await supabase
        .from('brands')
        .update(brandPayload)
        .eq('id', existingBrand.id);
      if (brandErr) throw new Error(`Failed to update brand: ${brandErr.message}`);
      brandId = existingBrand.id;
    } else {
      console.log('   No brand entry found. Inserting new brand record...');
      const { data: newBrand, error: brandErr } = await supabase
        .from('brands')
        .insert({
          ...brandPayload,
          created_at: now,
        })
        .select('id')
        .single();
      if (brandErr) throw new Error(`Failed to insert brand: ${brandErr.message}`);
      brandId = newBrand.id;
    }
    console.log(`✅ Brand record configured with ID: ${brandId}`);

    // 4. Print beautiful output
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BRAND ACCOUNT CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log(`   Email:    ${BRAND_EMAIL}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     brand`);
    console.log(`   User ID:  ${userId}`);
    console.log(`   Brand ID: ${brandId}`);
    console.log('\n🚀 Brand can now log in at:');
    console.log('   http://localhost:8080/login');
    console.log('   (They will be redirected straight to the brand dashboard)\n');

  } catch (err: any) {
    console.error('\n❌ Account creation failed:');
    console.error(err?.message || String(err));
    process.exit(1);
  }
}

async function createAuthUser(): Promise<string> {
  console.log('👤 Creating brand auth user...');
  const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
    email: BRAND_EMAIL,
    password: password,
    email_confirm: true,
    user_metadata: {
      first_name: BRAND_FIRST_NAME,
      last_name: BRAND_LAST_NAME,
      full_name: `${BRAND_FIRST_NAME} ${BRAND_LAST_NAME}`,
      role: 'brand',
      account_mode: 'brand',
    },
  });

  if (userError) throw new Error(`Failed to create auth user: ${userError.message}`);
  if (!newUser.user) throw new Error('Failed to create auth user: No user returned');

  console.log(`✅ Auth user created with ID: ${newUser.user.id}`);
  return newUser.user.id;
}

run();
