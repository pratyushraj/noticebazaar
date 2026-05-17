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

const reverts = [
  {
    username: 'oreo_thegoldyboy_',
    followers_count: null,
    avg_views: null,
    engagement_rate: 11.2
  },
  {
    username: 'meowmate12',
    followers_count: 26100,
    avg_views: null,
    engagement_rate: 6.8
  },
  {
    username: '_its_bruno_the_beagle_',
    followers_count: null,
    avg_views: null,
    engagement_rate: 7.4
  },
  {
    username: 'thepawsomelifeofoso',
    followers_count: 25100,
    avg_views: null,
    engagement_rate: 6.5
  },
  {
    username: 'mylos_kazoku',
    followers_count: null,
    avg_views: null,
    engagement_rate: 18.5
  }
];

async function main() {
  console.log('🐾 Reverting pet creator database metrics back to original real values...');

  for (const item of reverts) {
    console.log(`➡️ Reverting @${item.username}...`);
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
      console.log(`   ✅ Successfully reverted @${item.username}!`);
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
