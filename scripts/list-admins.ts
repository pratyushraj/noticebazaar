
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAdmins() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching admins:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No admins found in profiles');
    return;
  }

  console.log(`Found ${profiles.length} admins:`);
  for (const profile of profiles) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
    if (userError) {
      console.error(`Error fetching user for ${profile.id}:`, userError);
      continue;
    }
    console.log(`- Email: ${userData.user?.email}, ID: ${profile.id}`);
  }
}

listAdmins();
