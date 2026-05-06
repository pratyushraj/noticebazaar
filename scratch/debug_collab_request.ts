import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificRequest() {
  const requestId = '89206a57-be3c-45e3-9a6a-fda794c2852f';
  console.log(`Checking request ID: ${requestId}`);

  const { data, error } = await supabase
    .from('collab_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching request:', error);
    return;
  }

  if (!data) {
    console.log('Request NOT FOUND in collab_requests table');
    return;
  }

  console.log('Request found:', JSON.stringify(data, null, 2));

  // Also check the user
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', data.creator_id)
    .maybeSingle();

  if (userError) {
    console.error('Error fetching creator profile:', userError);
  } else {
    console.log('Creator profile:', JSON.stringify(userData, null, 2));
  }
}

checkSpecificRequest();
