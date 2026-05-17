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
  const trueAvgViews = 490000;

  console.log(`🐾 Updating verified manual and average views for @${username}...`);

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avg_views: trueAvgViews,
        avg_reel_views_manual: trueAvgViews,
        updated_at: new Date().toISOString()
      })
      .eq('username', username);

    if (updateError) throw updateError;
    console.log(`✅ Database profiles table updated for @${username}!`);

    // Verify
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('username, avg_views, avg_reel_views_manual')
      .eq('username', username)
      .single();

    if (selectError) throw selectError;
    console.log('\n🐾 Verification audit:');
    console.log(`- Username: @${profile.username}`);
    console.log(`- Average Views (avg_views): ${profile.avg_views}`);
    console.log(`- Manual Reel Views (avg_reel_views_manual): ${profile.avg_reel_views_manual}`);
    console.log('\n✨ Database Manual Views Sync Completed Successfully!');

  } catch (error: any) {
    console.error('❌ Database update failed:', error.message);
  }
}

main();
