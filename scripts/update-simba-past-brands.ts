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

async function main() {
  const username = 'simba_bhimavaram_bullodu';
  console.log(`🚀 Updating past brands for Simba & Sara (@${username})...`);

  const updates = {
    past_brands: ['Drools', 'Datgud', 'Pedigree', 'Active', 'Kennel Kitchen'],
    past_brand_count: 5,
    collab_brands_count_override: 5
  };

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('username', username);

    if (error) throw error;
    console.log(`\n✨ Past Brands Successfully Updated for Simba & Sara!`);
    console.log(`Brands: ${updates.past_brands.join(', ')}`);
    console.log(`🔗 Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Failed to update past brands:', error.message);
  }
}

main();
