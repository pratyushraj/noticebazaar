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

const updates = [
  {
    username: 'oreo_thegoldyboy_',
    avg_views: 32000
  },
  {
    username: 'meowmate12',
    avg_views: 42000
  },
  {
    username: 'thepawsomelifeofoso',
    avg_views: 35000
  },
  {
    username: 'mylos_kazoku',
    avg_views: 28000
  },
  {
    username: '_its_bruno_the_beagle_',
    avg_views: 4500
  }
];

async function main() {
  console.log('🐾 Updating average views for the remaining 5 pet creators...');

  for (const item of updates) {
    console.log(`➡️ Updating @${item.username} with avg_views = ${item.avg_views}...`);
    const { error } = await supabase
      .from('profiles')
      .update({
        avg_views: item.avg_views
      })
      .eq('username', item.username);

    if (error) {
      console.error(`   ❌ Failed for @${item.username}:`, error.message);
    } else {
      console.log(`   ✅ Successfully updated @${item.username}!`);
    }
  }

  console.log('\n🐾 Verification audit after updates:');
  const { data, error } = await supabase
    .from('profiles')
    .select('username, followers_count, avg_views, engagement_rate')
    .in('username', [
      'simba_bhimavaram_bullodu',
      'helloiamsparkle',
      'meowmate12',
      'thepawsomelifeofoso',
      'oreo_thegoldyboy_',
      'mylos_kazoku',
      '_its_bruno_the_beagle_'
    ]);

  if (error) {
    console.error('❌ Verification failed:', error.message);
  } else {
    console.table(data);
  }
}

main();
