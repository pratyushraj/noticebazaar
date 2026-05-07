import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('creator_push_subscriptions')
    .select('creator_id, last_seen, endpoint')
    .order('last_seen', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }
  
  for (const sub of data) {
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', sub.creator_id).single();
      sub.username = profile?.username;
  }

  console.log('Latest Subscriptions:', JSON.stringify(data, null, 2));
}
check();
