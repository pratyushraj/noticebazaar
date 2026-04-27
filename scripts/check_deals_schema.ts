
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDealsSchema() {
  const { data: deals, error } = await supabase
    .from('brand_deals')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (deals && deals.length > 0) {
    console.log('Columns in brand_deals:', Object.keys(deals[0]));
  } else {
    console.log('No deals found to check schema');
  }
}

checkDealsSchema();
