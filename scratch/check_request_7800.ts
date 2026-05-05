
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'api/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCollabRequest() {
  const { data, error } = await supabase
    .from('collab_requests')
    .select('id, brand_name, exact_budget, barter_value, status')
    .eq('id', '78008506-d778-4887-bb5c-af254c869ce1')
    .maybeSingle();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Collab Request 78008506:');
  console.table([data]);
}

checkCollabRequest();
