
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use ANON KEY to simulate frontend
);

async function checkAnonFetch() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, discovery_video_url')
    .not('discovery_video_url', 'is', null)
    .limit(5);

  if (error) {
    console.error('Anon Fetch Error:', error);
  } else {
    console.log('Anon Fetch Results:', JSON.stringify(data, null, 2));
  }
}

checkAnonFetch();
