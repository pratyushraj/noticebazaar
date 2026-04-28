
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('collab_requests')
    .select('*')
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in collab_requests:');
    console.log(Object.keys(data[0]).sort());
  }
}

checkColumns();
