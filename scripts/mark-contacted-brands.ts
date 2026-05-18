import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const targetBrands = [
  'Wakefit',
  'Sleepyhead',
  'Daily Objects',
  'Chumbak',
  'Nicobar',
  'Furtados'
];

async function main() {
  console.log(`🚀 Checking and marking user-specified brands as contacted...`);

  try {
    for (const name of targetBrands) {
      // Find the brand lead first (using case-insensitive match)
      const { data: leads, error: checkError } = await supabase
        .from('brand_leads')
        .select('*')
        .ilike('brand_name', `%${name}%`);

      if (checkError) throw checkError;

      if (!leads || leads.length === 0) {
        console.log(`⚠️ Brand "${name}" was not found in the database.`);
        continue;
      }

      for (const lead of leads) {
        console.log(`➡️ Found brand: "${lead.brand_name}" (Current status: ${lead.status || 'not_contacted'}). Updating status...`);

        const { error: updateError } = await supabase
          .from('brand_leads')
          .update({
            status: 'contacted',
            outreach_count: Math.max(lead.outreach_count || 0, 1),
            last_contacted_at: lead.last_contacted_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notes: 'Marked as contacted per user request to enforce strict duplicate skip check.'
          })
          .eq('id', lead.id);

        if (updateError) throw updateError;
        console.log(`   ✅ Successfully updated "${lead.brand_name}" to contacted!`);
      }
    }

    console.log(`\n🐾 Verification Audit:`);
    const { data: updatedLeads } = await supabase
      .from('brand_leads')
      .select('brand_name, status, outreach_count, notes')
      .in('brand_name', targetBrands);

    console.table(updatedLeads);
    console.log(`✨ Selected brands successfully protected from future bulk duplicate campaign dispatches!`);

  } catch (err: any) {
    console.error('❌ Failed to update requested contacted brands:', err.message);
  }
}

main();
