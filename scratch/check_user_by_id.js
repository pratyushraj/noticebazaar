
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data, error } = await supabase.auth.admin.getUserById('149bc106-1852-4954-9af0-71244169ab02');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('User Details:');
  console.log(JSON.stringify(data.user, null, 2));
}

checkUser();
