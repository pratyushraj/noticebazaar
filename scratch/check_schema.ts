
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  try {
    const { data, error } = await supabase.from('brands').select('*').limit(1);
    if (error) {
      console.error('Error fetching brands:', error);
    } else {
      console.log('Brands Columns:', Object.keys(data[0] || {}));
    }
    
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
      console.error('Error fetching profiles:', pError);
    } else {
      console.log('Profiles Columns:', Object.keys(pData[0] || {}));
    }
  } catch (err) {
    console.error('Crash:', err);
  }
}

check();
