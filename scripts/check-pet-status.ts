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

const petGiants = [
  'Heads Up For Tails',
  'Wiggles',
  'Supertails',
  'Captain Zack'
];

async function main() {
  console.log(`🔍 Checking contact status for Pet Care Giants in brand_leads...`);

  try {
    const { data: rows, error } = await supabase
      .from('brand_leads')
      .select('brand_name, email, website, status, outreach_count, last_contacted_at')
      .in('brand_name', petGiants);

    if (error) throw error;

    console.log(`\n📊 PET CARE GIANTS STATUS REPORT:`);
    console.table(rows);

  } catch (err: any) {
    console.error('❌ Error checking status:', err.message);
  }
}

main();
