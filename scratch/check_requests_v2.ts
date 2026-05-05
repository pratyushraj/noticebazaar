import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRequests() {
  const { data, error } = await supabase
    .from('collab_requests')
    .select('*')
    .in('deal_id', ['a0284c59-9043-446f-b9cc-aa4556debd9f', '99cd86c8-316c-4be5-8d53-ba7de66cccf7']);

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkRequests();
