import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const email = 'mellowprints0707@yopmail.com';
  
  // It's best to clear out the incorrect 'beyoncebeauty' handle for this email
  const { data, error } = await supabase.from('collab_requests')
    .update({ brand_instagram: null })
    .eq('brand_email', email)
    .eq('brand_instagram', 'beyoncebeauty');
  
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Updated instagram successfully");
  }
}

fix();
