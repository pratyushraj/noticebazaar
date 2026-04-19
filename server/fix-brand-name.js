import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const email = 'mellowprints0707@yopmail.com';
  
  console.log("Checking profiles...");
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', email);
  console.log("Profiles:", profile);

  console.log("Checking collab_requests...");
  const { data: requests } = await supabase.from('collab_requests').select('id, brand_name, brand_email').eq('brand_email', email);
  console.log("Collab Requests:", requests);

  if (requests && requests.length > 0) {
     for (const r of requests) {
         if (r.brand_name === 'Beyonce Beauty') {
             console.log("Fixing request ID", r.id);
             await supabase.from('collab_requests').update({ brand_name: null }).eq('id', r.id);
         }
     }
     console.log("Done fixing.");
  }
}

fix();
