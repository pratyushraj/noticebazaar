
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCollabData() {
  const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';

  const { data, error } = await supabase
    .from('collab_requests')
    .select('*')
    .eq('creator_id', userId)
    .ilike('brand_name', '%mellow%')
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Sample Collab Request Data:');
  console.log(JSON.stringify(data[0], null, 2));
}

checkCollabData();
