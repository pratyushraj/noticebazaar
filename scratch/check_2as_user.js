
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserByEmail() {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  const user = data.users.find(u => u.email === 'noticebazaar.legal@gmail.com');
  if (user) {
    console.log('User found (2 as):');
    console.log(JSON.stringify(user, null, 2));
    
    // Also check profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    console.log('Profile:');
    console.log(JSON.stringify(profile, null, 2));
  } else {
    console.log('User noticebazaar.legal@gmail.com not found.');
  }
}

checkUserByEmail();
