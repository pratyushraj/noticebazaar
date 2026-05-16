
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreators() {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, discovery_video_url')
    .in('username', ['shavy.0404', 'blogsbysnehaaa', 'rohit_cheeku_bhandari']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Creators Data:', JSON.stringify(data, null, 2));
}

checkCreators();
