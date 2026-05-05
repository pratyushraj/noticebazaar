import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmins() {
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  const ids = admins?.map(a => a.id) || [];
  
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  const adminUsers = data.users.filter(u => ids.includes(u.id));

  console.log('Admin Users:');
  console.log(JSON.stringify(adminUsers.map(u => ({ id: u.id, email: u.email })), null, 2));
}

checkAdmins();
