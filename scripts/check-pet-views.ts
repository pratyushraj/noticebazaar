import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const targetUsernames = [
    'simba_bhimavaram_bullodu',
    'helloiamsparkle',
    'meowmate12',
    'thepawsomelifeofoso',
    'oreo_thegoldyboy_',
    'mylos_kazoku',
    '_its_bruno_the_beagle_'
  ];

  const { data, error } = await supabase
    .from('profiles')
    .select('username, followers_count, avg_views, engagement_rate')
    .in('username', targetUsernames);

  if (error) {
    console.error('❌ Failed:', error.message);
    return;
  }

  console.table(data);
}

main();
