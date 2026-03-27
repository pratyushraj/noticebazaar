import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const creatorId = '703f68cf-a5cd-4368-9eae-a347c7bd3608'; // notice104@yopmail.com
  const { data, error } = await supabase
    .from('creator_push_subscriptions')
    .select('*')
    .eq('creator_id', creatorId);
    
  console.log('Subscriptions:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

check();
