
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const userId = 'a7ed47ed-8490-4846-805b-5c8264f7a35f';
  console.log('Checking user:', userId);

  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (pError) {
    console.error('Profile error:', pError);
  } else {
    console.log('Profile found:', profile.business_name, profile.role);
  }

  const { data: brand, error: bError } = await supabase
    .from('brands')
    .select('*')
    .eq('external_id', userId);

  if (bError) {
    console.error('Brand error:', bError);
  } else {
    console.log('Brand found:', brand);
  }
}

check();
