
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260508000001_add_charandeep_kaur_profile.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    // If rpc('exec_sql') doesn't exist, we might have to use another way or just report failure
    console.error('Error applying migration:', error);
    
    // Attempting direct query if possible (though supabase-js doesn't support raw SQL easily without RPC)
    console.log('Trying alternative insert...');
    
    // Manual insert for Charandeep Kaur to ensure she's there
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: 'c8a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c',
        username: 'cutiebug2021',
        instagram_handle: 'cutiebug2021',
        first_name: 'Charandeep Kaur',
        role: 'creator',
        bio: 'Professional Fashion, Lifestyle & Beauty creator. Focused on high-quality aesthetic content and authentic brand storytelling.',
        location: 'India',
        followers_count: 111000,
        engagement_rate: 4.5,
        discovery_video_url: '/videos/discovery/cutiebug2021_discovery.mp4',
        is_verified: true,
        starting_price: 6000,
        reel_price: 10000,
        avg_rate_reel: 10000,
        barter_min_value: 5000,
        onboarding_complete: true,
        open_to_collabs: true,
        creator_category: 'Fashion'
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Successfully upserted Charandeep Kaur!');
    }
  } else {
    console.log('Migration applied successfully via RPC!');
  }
}

applyMigration();
