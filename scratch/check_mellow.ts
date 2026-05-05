import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMellowDeals() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('*')
    .ilike('brand_name', '%Mellow%')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkMellowDeals();
