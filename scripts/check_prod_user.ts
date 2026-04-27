
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkUser() {
  console.log('Checking for user: tootifrootie3@yopmail.com');
  
  // 1. Find user in auth.users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('List users error:', usersError);
    return;
  }

  const user = users.find(u => u.email === 'tootifrootie3@yopmail.com');
  
  if (!user) {
    console.log('User not found in auth.users');
    return;
  }

  console.log('Found user:', user.id);

  // 2. Check profiles
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profError) {
    console.error('Profile error:', profError);
  } else if (profile) {
    console.log('Profile found for ID:', user.id, 'Role:', profile.role);
  } else {
    console.log('No profile found for ID:', user.id);
  }

  // 3. Check deals
  const { data: deals, error: dealsError } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('creator_id', user.id);

  if (dealsError) {
    console.error('Deals error:', dealsError);
  } else {
    console.log('Found', deals?.length, 'deals for this creator');
    deals?.forEach(d => {
      console.log(`- ID: ${d.id}, Brand: ${d.brand_name}, Status: ${d.status}, CreatedAt: ${d.created_at}`);
    });
  }
}

checkUser();
