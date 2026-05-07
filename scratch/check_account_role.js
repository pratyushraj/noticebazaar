
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccount() {
  const email = 'noticebazaar.legal@gmail.com';
  
  // 1. Get user ID from auth.users
  // Note: We need service role key to access auth schema sometimes, 
  // or we can just search profiles if we had email there, but we don't.
  // Actually, some setups have a triggered copy of email in profiles or public.users.
  
  // Let's try to find it in profiles by searching first_name/last_name if it's there, 
  // or just use the admin API to get user by email.
  
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error listing users:', authError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log('User not found in auth.users');
    return;
  }
  
  console.log('User found in auth:', user.id);
  
  // 2. Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, business_name, onboarding_complete')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }
  
  console.log('Profile found:', profile);
}

checkAccount();
