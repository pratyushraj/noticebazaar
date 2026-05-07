
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBrands() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, business_name, role')
    .eq('role', 'brand');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Brand Profiles:');
  console.log(JSON.stringify(data, null, 2));
}

listBrands();
