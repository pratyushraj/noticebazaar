/**
 * Quick discovery: fetch details for a specific barter deal
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';

const dealId = '3962cb09-fff9-4c92-9b2a-81d4f6878b48';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, brand_email, brand_name, deal_type, shipping_required, shipping_status, brand_address')
    .eq('id', dealId)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Deal details:');
  console.log(JSON.stringify(data, null, 2));

  // Lookup brand user by email
  const brandEmail = data.brand_email;
  if (brandEmail) {
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const brandUser = (users?.users || []).find(u => u.email === brandEmail);
      if (brandUser) {
        console.log(`\n🔐 Matching brand user found: ${brandUser.email} (id: ${brandUser.id})`);
      } else {
        console.log(`\n⚠️ No auth user found for brand email: ${brandEmail}`);
      }
    } catch (e: any) {
      console.error('Error fetching auth users:', e.message);
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
