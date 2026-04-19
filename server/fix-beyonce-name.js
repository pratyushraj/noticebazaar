import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { error } = await supabase
    .from('profiles')
    .update({ business_name: 'Beyonce' })
    .eq('id', 'cc68c864-81a1-44d9-9e26-0efec94ee7e3');

  if (error) console.error('Error:', error);
  else console.log('✅ Fixed business_name to "Beyonce" (no accent)');
}
fix();
