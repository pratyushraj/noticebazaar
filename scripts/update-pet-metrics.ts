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
    followers_count: 14500,
    avg_views: 12000,
    engagement_rate: 11.2
  },
  {
    username: 'meowmate12',
    followers_count: 26100,
    avg_views: 15000,
    engagement_rate: 6.8
  },
  {
    username: '_its_bruno_the_beagle_',
    followers_count: 11800,
    avg_views: 10000,
    engagement_rate: 7.4
  },
  {
    username: 'thepawsomelifeofoso',
    followers_count: 25100,
    avg_views: 18000,
    engagement_rate: 6.5
  },
  {
    username: 'mylos_kazoku',
    followers_count: 18200,
    avg_views: 16500,
    engagement_rate: 18.5
  }
];

async function main() {
  console.log('🐾 Updating database metrics for pet creators...');

  for (const item of updates) {
    console.log(`➡️ Updating @${item.username}...`);
    const { error } = await supabase
      .from('profiles')
      .update({
        followers_count: item.followers_count,
        avg_views: item.avg_views,
        engagement_rate: item.engagement_rate
      })
      .eq('username', item.username);

    if (error) {
      console.error(`   ❌ Failed for @${item.username}:`, error.message);
    } else {
      console.log(`   ✅ Successfully updated @${item.username}!`);
    }
  }

  console.log('\n🐾 Verification audit:');
  const { data } = await supabase
    .from('profiles')
    .select('username, followers_count, avg_views, engagement_rate')
    .in('username', ['simba_bhimavaram_bullodu', 'helloiamsparkle', 'meowmate12', 'thepawsomelifeofoso', 'oreo_thegoldyboy_', 'mylos_kazoku', '_its_bruno_the_beagle_']);
  
  console.table(data);
}

main();
