import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Querying collab_requests...');
  const { data, error } = await supabase.from('collab_requests').select('*').limit(1);
  if (error) {
    console.error('Error querying collab_requests:', error);
  } else {
    console.log('Successfully queried collab_requests');
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty');
      // Try to get info from information_schema if possible via RPC
    }
  }
}

check();
