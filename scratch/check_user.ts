import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

async function checkUser() {
  const email = process.argv[2];
  if (!email) {
    console.log('Email required');
    return;
  }

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === email);
  
  if (!user) {
    console.log('Auth user not found');
  } else {
    console.log('Auth User ID:', user.id);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (profile) {
    console.log('Profile:', JSON.stringify(profile, null, 2));
  } else {
    console.log('Profile not found');
  }
}

checkUser();
