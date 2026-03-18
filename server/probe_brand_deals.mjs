import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error: e1 } = await supabase.from('brand_deals').select('collab_request_id').limit(1);
  console.log('Has collab_request_id:', !e1);
  const { error: e2 } = await supabase.from('brand_deals').select('currency').limit(1);
  console.log('Has currency:', !e2);
  const { error: e3 } = await supabase.from('brand_deals').select('platform').limit(1);
  console.log('Has platform:', !e3);
}

check();
