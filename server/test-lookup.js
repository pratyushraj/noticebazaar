import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const email = 'mellowprints0707@yopmail.com';
  const { data: requests } = await supabase.from('collab_requests').select('id, brand_name, brand_email, created_at').eq('brand_email', email);
  console.log("Collab Requests:", requests);
}

check();
