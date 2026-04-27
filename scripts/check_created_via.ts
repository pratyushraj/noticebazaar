
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCreatedVia() {
  const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
  const { data: deals } = await supabase
    .from('brand_deals')
    .select('id, created_via, brand_name')
    .eq('creator_id', userId);

  deals?.forEach(d => {
    console.log(`Deal: ${d.brand_name}, CreatedVia: ${d.created_via}`);
  });
}

checkCreatedVia();
