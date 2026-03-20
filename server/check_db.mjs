import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'collab_requests' });
  if (error) {
    console.log('Error fetching columns:', error);
    // Try simple query if RPC fails
    const { data, error: selectError } = await supabase.from('collab_requests').select('*').limit(1);
    console.log('Sample data keys:', Object.keys(data?.[0] || {}));
    console.log('Select error:', selectError);
  } else {
    console.log('Columns:', JSON.stringify(cols, null, 2));
  }
}

check();
