import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from('creator_push_subscriptions')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching creator_push_subscriptions:', error);
  } else {
    console.log('Successfully fetched from creator_push_subscriptions. Rows:', data?.length);
  }
}

checkSchema().catch(console.error);
