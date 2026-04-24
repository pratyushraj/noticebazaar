import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

async function checkUserById() {
  const id = process.argv[2];
  if (!id) {
    console.log('ID required');
    return;
  }

  const { data: user, error } = await supabase.auth.admin.getUserById(id);
  
  if (error) {
    console.error('Auth error:', error);
  } else if (user) {
    console.log('Auth User:', JSON.stringify(user, null, 2));
  } else {
    console.log('Auth user not found');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (profile) {
    console.log('Profile:', JSON.stringify(profile, null, 2));
  } else {
    console.log('Profile not found');
  }
}

checkUserById();
