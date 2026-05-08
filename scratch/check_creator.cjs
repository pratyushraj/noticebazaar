
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCreator() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'cutiebug2021')
    .maybeSingle();

  if (error) {
    console.error('Error fetching creator:', error);
  } else if (data) {
    console.log('Creator data:', JSON.stringify(data, null, 2));
  } else {
    console.log('Creator not found.');
  }
}

checkCreator();
