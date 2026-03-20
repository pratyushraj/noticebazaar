import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const noticeUser = users.users.find(u => u.email === 'notice104@yopmail.com');
  if (!noticeUser) {
    console.log('Notice104 not found in auth.users');
    return;
  }
  
  const creatorId = noticeUser.id;
  console.log('Creator ID:', creatorId);
  
  const { data: subs, error } = await supabase
    .from('creator_push_subscriptions')
    .select('*')
    .eq('creator_id', creatorId);
    
  console.log('Subscriptions:', JSON.stringify(subs, null, 2));
  console.log('Error:', error);
}

check();
