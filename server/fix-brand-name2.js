import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data, error } = await supabase.from('collab_requests')
    .update({ brand_name: 'Mellow Prints' })
    .eq('id', '80d25aca-a857-43cf-8efb-78379b4ea94c');
  
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Updated successfully:", data);
  }
}

fix();
