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

const barterUpdates = [
  { username: 'goofy.timtim', barter_min_value: 10000 },
  { username: 'savour.n.binge', barter_min_value: 4000 },
  { username: 'goldenasginger', barter_min_value: null },
  { username: 'versatile_meals', barter_min_value: null },
  { username: 'arnishringi', barter_min_value: 5000 },
  { username: 'postothezippypuppy', barter_min_value: null }
];

async function main() {
  console.log('🔄 Updating barter preferences based on DM details...');
  
  for (const update of barterUpdates) {
    const { error } = await supabase
      .from('profiles')
      .update({ barter_min_value: update.barter_min_value })
      .eq('username', update.username);

    if (error) {
      console.error(`❌ Failed to update ${update.username}:`, error.message);
    } else {
      console.log(`✅ Updated ${update.username}: barter_min_value set to ${update.barter_min_value}`);
    }
  }

  console.log('✨ All barter preferences successfully synchronized in Supabase!');
}

main();
