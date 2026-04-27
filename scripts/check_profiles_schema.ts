
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // Query to get column names for 'profiles' table
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
  
  if (error) {
    console.error('RPC error:', error);
    // Fallback: try to select one row and check its keys
    const { data: row, error: rowError } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
    if (rowError) {
        console.error('Select * error:', rowError);
    } else if (row) {
        console.log('Columns in profiles:', Object.keys(row));
    } else {
        console.log('No rows in profiles to check columns');
    }
  } else {
    console.log('Columns in profiles:', data);
  }
}

checkSchema();
