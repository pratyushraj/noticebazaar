import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('rpc').select('*').limit(1); // This won't work usually
  // Query information_schema.routines via a select on a view if exposed?
  // Usually rpc are not listed like this.
  
  // Try to use a common one
  const { data: d, error: e } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
  if (e) console.log('get_table_columns failed:', e.message);
  else console.log('get_table_columns exists');
}

check();
