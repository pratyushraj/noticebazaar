
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking for creator: notice104...');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, instagram_handle, role')
    .or('username.eq.notice104,instagram_handle.eq.notice104');
  
  if (error) {
    console.error('Error querying Supabase:', error);
    process.exit(1);
  }
  
  console.log('Profile Result:', JSON.stringify(data, null, 2));
  
  if (data && data.length > 0) {
    const profile = data[0];
    if (profile.username === 'notice104' && profile.instagram_handle && profile.instagram_handle !== 'notice104') {
        console.log('!!! WARNING: Stale Handle Detected !!!');
        console.log(`Username is "notice104" but Instagram handle is "${profile.instagram_handle}".`);
        console.log('The backend will return 404 for /api/collab/notice104/submit.');
        console.log(`Please use /api/collab/${profile.instagram_handle}/submit instead.`);
    }
  } else {
    console.log('!!! ERROR: Profile NOT FOUND !!!');
    console.log('No profile exists with username or instagram_handle = "notice104".');
  }
}

check();
