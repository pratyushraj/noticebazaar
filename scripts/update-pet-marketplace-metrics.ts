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

const verifiedUpdates = [
  {
    username: 'oreo_thegoldyboy_',
    followers_count: 21500,
    engagement_rate: 11.4,
    avg_views: null // Will ask user for verified avg views
  },
  {
    username: 'meowmate12',
    followers_count: 26200,
    engagement_rate: 9.2,
    avg_views: null
  },
  {
    username: '_its_bruno_the_beagle_',
    followers_count: 15700,
    engagement_rate: 7.4,
    avg_views: null
  },
  {
    username: 'thepawsomelifeofoso',
    followers_count: 25200,
    engagement_rate: 7.8,
    avg_views: null
  },
  {
    username: 'mylos_kazoku',
    followers_count: 10700,
    engagement_rate: 18.4,
    avg_views: null
  }
];

async function main() {
  console.log('🐾 Updating verified Meta Creator Marketplace metrics for pet creators...');

  for (const item of verifiedUpdates) {
    console.log(`➡️ Updating @${item.username}...`);
    const { error } = await supabase
      .from('profiles')
      .update({
        followers_count: item.followers_count,
        engagement_rate: item.engagement_rate,
        avg_views: item.avg_views
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
