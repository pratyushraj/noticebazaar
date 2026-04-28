/**
 * E2E Test: Brand Shipping Address Endpoint
 * Tests POST /api/deals/:id/brand-shipping-address
 *
 * Usage: npx tsx scratch/test-brand-shipping-e2e.ts [dealId]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';
const apiBase = 'http://127.0.0.1:3001';
const TEST_PASSWORD = 'TestBrand123!@#';

const DEAL_ID = process.argv[2] || '';

async function main() {
  let dealId = DEAL_ID;

  // 1. Discover a barter deal if not provided
  if (!dealId) {
    console.log('🔍 No deal ID provided; discovering a barter deal...');
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: deals } = await supabase.from('brand_deals').select('id, brand_email, brand_name, deal_type').eq('deal_type', 'barter').limit(1);
    if (!deals || deals.length === 0) {
      console.error('❌ No barter deals found.');
      process.exit(1);
    }
    dealId = deals[0].id;
    console.log(`✅ Using deal: ${dealId} (${deals[0].brand_name})`);
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // 2. Fetch deal to get brand_email
  const { data: deal, error: dealErr } = await supabase.from('brand_deals').select('id, brand_email, brand_name, deal_type').eq('id', dealId).single();
  if (dealErr || !deal) {
    console.error('❌ Deal not found:', dealErr?.message);
    process.exit(1);
  }
  const brandEmail = deal.brand_email;
  if (!brandEmail) {
    console.error('❌ Deal has no brand_email.');
    process.exit(1);
  }
  console.log(`📧 Deal belongs to brand: ${brandEmail}`);

  // 3. Ensure auth user exists with known password
  let userId: string;
  {
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = (users?.users || []).find(u => u.email === brandEmail);
    if (existing) {
      console.log(`✅ Brand user exists: ${existing.email} (id: ${existing.id})`);
      userId = existing.id;
      await supabase.auth.admin.updateUserById(existing.id, { password: TEST_PASSWORD });
    } else {
      console.log(`⚙️ Creating brand user: ${brandEmail}`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: brandEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'brand' },
      });
      if (createErr) throw createErr;
      userId = newUser.user?.id;
      console.log(`✅ Created user id: ${userId}`);
    }
  }

  // 4. Ensure profile with role='brand' exists
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (!profile) {
    await supabase.from('profiles').insert({
      id: userId,
      email: brandEmail,
      role: 'brand',
      first_name: 'Test',
      last_name: 'Brand',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('✅ Created profile with role=brand');
  } else if (profile.role !== 'brand') {
    await supabase.from('profiles').update({ role: 'brand' }).eq('id', userId);
    console.log('🔧 Updated profile role to brand');
  } else {
    console.log('✅ Profile role already brand');
  }

  // 5. Login as brand to get access token
  console.log('\n🔑 Logging in as brand...');
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ';
  const loginSupabase = createClient(supabaseUrl, anonKey);
  const { data: session, error: loginErr } = await loginSupabase.auth.signInWithPassword({
    email: brandEmail,
    password: TEST_PASSWORD,
  });
  if (loginErr || !session.session) {
    console.error('❌ Login failed:', loginErr?.message || 'No session');
    process.exit(1);
  }
  const accessToken = session.session.access_token;
  console.log('✅ Logged in. Token acquired.');

  // Verify profile role
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  console.log(`   Profile role from DB: ${prof?.role || 'missing'}`);

  // 6. Check current state directly from DB
  const before = await supabase.from('brand_deals').select('brand_address, contact_person, brand_phone').eq('id', dealId).maybeSingle();
  console.log('\n📋 Current deal state (direct DB):');
  console.log('   brand_address:', before.data?.brand_address || '(null)');
  console.log('   contact_person:', before.data?.contact_person || '(null)');
  console.log('   brand_phone:', before.data?.brand_phone || '(null)');

  // 7. POST brand-shipping-address
  const newAddress = '123 Test Street, Test City, Maharashtra - 400001';
  const newContact = 'Automated Test Contact';
  const newPhone = '+919988776655';

  console.log('\n📤 Posting new shipping address...');
  const updateRes = await fetch(`${apiBase}/api/deals/${dealId}/brand-shipping-address`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: newAddress,
      contactName: newContact,
      phone: newPhone,
    }),
  });

  const updateJson = await updateRes.json();
  if (!updateRes.ok) {
    console.error('❌ Update failed:', updateJson.error || updateRes.statusText);
    console.error('   Status:', updateRes.status);
    process.exit(1);
  }
  console.log('✅ Update succeeded:', updateJson.message);

  // 8. Verify via direct DB select
  const after = await supabase.from('brand_deals').select('brand_address, contact_person, brand_phone').eq('id', dealId).maybeSingle();
  console.log('\n🔍 Verifying after update (direct DB):');
  const checks = [
    { name: 'brand_address', expected: newAddress, actual: after.data?.brand_address },
    { name: 'contact_person', expected: newContact, actual: after.data?.contact_person },
    { name: 'brand_phone', expected: newPhone, actual: after.data?.brand_phone },
  ];

  let allOk = true;
  for (const c of checks) {
    const ok = c.actual === c.expected;
    console.log(`   ${ok ? '✅' : '❌'} ${c.name}: expected="${c.expected}" actual="${c.actual}"`);
    if (!ok) allOk = false;
  }

  if (allOk) {
    console.log('\n🎉 All checks passed! Brand shipping address endpoint works.');
  } else {
    console.error('\n❌ Some checks failed.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
