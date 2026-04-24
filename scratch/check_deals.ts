import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

async function checkDeals() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, status, brand_name, deal_amount, creator_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

checkDeals();
