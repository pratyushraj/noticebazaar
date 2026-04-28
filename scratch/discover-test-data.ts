/**
 * Quick discovery script: find a barter deal and a brand user for testing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function discover() {
  console.log('🔍 Discovering test data...\n');

  // 1. Find a barter deal with shipping details required
  const { data: barterDeals, error: dealErr } = await supabase
    .from('brand_deals')
    .select('id, deal_type, brand_email, brand_name, shipping_required, shipping_status, brand_address, contact_person, brand_phone')
    .eq('deal_type', 'barter')
    .limit(5);

  if (dealErr) {
    console.error('❌ Error fetching barter deals:', dealErr.message);
    process.exit(1);
  }

  if (!barterDeals || barterDeals.length === 0) {
    console.error('❌ No barter deals found in database.');
    process.exit(1);
  }

  console.log('📦 Found barter deals:');
  for (const d of barterDeals) {
    console.log(`   • ${d.id} | brand: ${d.brand_name} | shipping_required: ${d.shipping_required} | status: ${d.shipping_status || 'N/A'}`);
  }

  const testDeal = barterDeals[0];
  console.log(`\n🎯 Using deal: ${testDeal.id} (${testDeal.brand_name})`);

  // 2. Find a brand user whose email matches a brand in the system
  let brandUsers: any[] = [];
  try {
    const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error('⚠️ Could not list auth users:', listErr.message);
    } else {
      brandUsers = (users?.users || []).filter(u => 
        u.user_metadata?.role === 'brand'
      );
      console.log('\n👤 Brand auth users found:', brandUsers.length);
      if (brandUsers.length > 0) {
        console.log(`   Example: ${brandUsers[0].email} (role: ${brandUsers[0].user_metadata?.role || 'unknown'})`);
      }
    }
  } catch (authErr: any) {
    console.error('⚠️ Could not list auth users:', authErr.message);
  }

  // Output env export helper
  console.log('\n📝 To run the test, set these env vars:');
  console.log(`   export TEST_DEAL_ID="${testDeal.id}"`);
  if (brandUsers.length > 0) {
    console.log(`   export TEST_BRAND_EMAIL="${brandUsers[0].email}"`);
    console.log(`   export TEST_BRAND_PASSWORD="<you'll need to set/reset this>"`);
  } else {
    console.log('   # No brand auth user found with role=brand. You may need to create one via signup flow.');
    console.log('   # Alternatively, use a creator account to test brand shipping via token link.');
  }
}

discover().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
