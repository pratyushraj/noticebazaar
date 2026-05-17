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
  const username = 'cookku_with_chikku';
  
  // Marketplace verified stats from the screenshot:
  // - Reached Accounts (30d) = 5,900,000 (5.9M)
  // - Active posts per month = ~12 (3 posts per week)
  // - True average views = 5,900,000 / 12 = ~490,000 (490K avg views)
  const trueAvgViews = 490000;
  const trueFollowers = 74000;
  const trueEngagement = 2.5;

  console.log(`🐾 Updating verified average views for @${username}...`);

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avg_views: trueAvgViews,
        followers_count: trueFollowers,
        engagement_rate: trueEngagement,
        updated_at: new Date().toISOString()
      })
      .eq('username', username);

    if (updateError) throw updateError;
    console.log(`✅ Database profiles table updated for @${username}!`);

    // Verify
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('username, followers_count, avg_views, engagement_rate')
      .eq('username', username)
      .single();

    if (selectError) throw selectError;
    console.log('\n🐾 Verification audit:');
    console.log(`- Username: @${profile.username}`);
    console.log(`- Followers Count: ${profile.followers_count}`);
    console.log(`- Average Views: ${profile.avg_views} (490K)`);
    console.log(`- Engagement Rate: ${profile.engagement_rate}%`);
    console.log('\n✨ Database Sync Completed Successfully!');

  } catch (error: any) {
    console.error('❌ Database update failed:', error.message);
  }
}

main();
