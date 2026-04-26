import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRequest() {
  const { data, error } = await supabase
    .from('collab_requests')
    .select('*')
    .eq('id', '9b40f0ae-83c3-4227-a70b-74cd351424cd')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Request Data:', JSON.stringify(data, null, 2));
  }
}

checkRequest();
