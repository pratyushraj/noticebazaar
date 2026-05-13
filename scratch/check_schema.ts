
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error checking schema:', error);
  } else {
    console.log('Columns:', Object.keys(data[0]));
  }
}

checkSchema();
