import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const email = 'demo@brand.com';
  // Try to list with pagination or filter if supported (some versions support page/perPage)
  let allUsers = [];
  let page = 1;
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('Error:', error);
      break;
    }
    allUsers = allUsers.concat(users);
    if (users.length < 1000) break;
    page++;
  }
  
  const user = allUsers.find(u => u.email?.toLowerCase() === email);
  if (user) {
    console.log('User found:', user.id);
  } else {
    console.log('User not found in', allUsers.length, 'users');
  }
}

check();
