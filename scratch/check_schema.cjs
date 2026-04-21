
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking profiles table schema...');
  // Try to select the specific columns to see if they exist
  const { data, error } = await supabase
    .from('profiles')
    .select('id, discovery_video_url, portfolio_videos')
    .limit(1);
  
  if (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('!!! SCHEMA ERROR: Discovery columns are MISSING !!!');
        console.log('Error message:', error.message);
    } else {
        console.error('Database error:', error);
    }
    process.exit(1);
  }
  
  console.log('✅ SCHEMA VERIFIED: Discovery columns exist in profiles table.');
}

checkSchema();
