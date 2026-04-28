/**
 * Test script: Brand shipping address endpoint
 * This script performs an end-to-end test of the brand shipping address feature.
 *
 * Prereqs:
 * - Backend API running on http://127.0.0.1:3001
 * - A brand user exists with email/password
 * - A barter deal exists for that brand
 *
 * Environment variables (set in .env or inline):
 *   TEST_BRAND_EMAIL=brand@example.com
 *   TEST_BRAND_PASSWORD=password123
 *   TEST_DEAL_ID=uuid-of-barter-deal
 *
 * Usage: tsx test-brand-shipping-address.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load env from project .env if available
try {
  await import('dotenv').config({ path: '../.env' });
} catch { }

const API_BASE = 'http://127.0.0.1:3001';
const supabaseUrl = 'https://joshbvdbypznbgjzfimv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvc2hidmZieXB6bmJnajFqaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjA3ODYsImV4cCI6MjA2MDQ5Njc4Nn0.yYdA4CWith7z5x4vf01fSS2EI3s1LaJ4LKt2ly4kfU';

interface TestResult {
  pass: boolean;
  message: string;
  data?: any;
}

async function loginAsBrand(email: string, password: string): Promise<string | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ Login failed:', error.message);
      return null;
    }
    console.log('✅ Logged in as brand:', email);
    return data.session?.access_token || null;
  } catch (err: any) {
    console.error('❌ Login exception:', err.message);
    return null;
  }
}

async function fetchDeal(token: string, dealId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/deals/${dealId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch deal');
  return json.deal;
}

async function updateShippingAddress(token: string, dealId: string, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/api/deals/${dealId}/brand-shipping-address`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update address');
  return json;
}

async function runTest(): Promise<void> {
  const brandEmail = process.env.TEST_BRAND_EMAIL;
  const brandPassword = process.env.TEST_BRAND_PASSWORD;
  const dealId = process.env.TEST_DEAL_ID;

  if (!brandEmail || !brandPassword || !dealId) {
    console.error('❌ Missing environment variables:');
    console.error('   Required: TEST_BRAND_EMAIL, TEST_BRAND_PASSWORD, TEST_DEAL_ID');
    process.exit(1);
  }

  console.log('🚀 Starting brand shipping address test...\n');

  // Step 1: Login
  const token = await loginAsBrand(brandEmail, brandPassword);
  if (!token) process.exit(1);

  // Step 2: Fetch current deal state
  console.log('\n📋 Fetching deal:', dealId);
  let deal;
  try {
    deal = await fetchDeal(token, dealId);
    console.log('   Deal type:', deal.deal_type);
    console.log('   Current brand_address:', deal.brand_address || '(none)');
    console.log('   Current contact_person:', deal.contact_person || '(none)');
    console.log('   Current brand_phone:', deal.brand_phone || '(none)');
  } catch (err: any) {
    console.error('❌ Fetch deal error:', err.message);
    process.exit(1);
  }

  // Step 3: Save new shipping address
  const newAddress = '456 Test Avenue, Test City, Test State - 400001';
  const newContact = 'Test Contact Name';
  const newPhone = '+919988776655';

  console.log('\n📦 Posting new shipping address...');
  let result;
  try {
    result = await updateShippingAddress(token, dealId, {
      address: newAddress,
      contactName: newContact,
      phone: newPhone,
    });
    console.log('   ✅ Response:', result.message);
  } catch (err: any) {
    console.error('❌ Update failed:', err.message);
    process.exit(1);
  }

  // Step 4: Verify by re-fetching
  console.log('\n🔍 Verifying update...');
  const updatedDeal = await fetchDeal(token, dealId);

  const checks: TestResult[] = [
    {
      pass: updatedDeal.brand_address === newAddress,
      message: 'brand_address',
      data: { expected: newAddress, actual: updatedDeal.brand_address },
    },
    {
      pass: updatedDeal.contact_person === newContact,
      message: 'contact_person',
      data: { expected: newContact, actual: updatedDeal.contact_person },
    },
    {
      pass: updatedDeal.brand_phone === newPhone,
      message: 'brand_phone',
      data: { expected: newPhone, actual: updatedDeal.brand_phone },
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    const symbol = check.pass ? '✅' : '❌';
    console.log(`   ${symbol} ${check.message}: ${JSON.stringify(check.data)}`);
    if (!check.pass) allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 All checks passed! Shipping address endpoint is working correctly.');
  } else {
    console.error('\n❌ Some checks failed. Review output above.');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
