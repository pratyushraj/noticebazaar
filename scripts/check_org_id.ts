
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrgId() {
  const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .maybeSingle();
    
  const { data: deals } = await supabase
    .from('brand_deals')
    .select('id, organization_id, brand_name')
    .eq('creator_id', userId);

  console.log('User Org ID:', profile?.organization_id);
  console.log('Deals:');
  deals?.forEach(d => {
    console.log(`- Deal: ${d.brand_name}, Org ID: ${d.organization_id}`);
  });
}

checkOrgId();
