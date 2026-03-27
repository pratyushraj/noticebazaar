import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('collab_request_leads').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Leads Columns:', Object.keys(data[0]));
  } else if (error) {
    console.log('Error checking leads:', error.message);
  } else {
    console.log('Leads table empty, trying to probe columns with specific select');
    const { error: e2 } = await supabase.from('collab_request_leads').select('brand_logo_url').limit(1);
    console.log('Has brand_logo_url:', !e2);
  }
}

check();
