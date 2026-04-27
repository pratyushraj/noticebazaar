
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: deals, error } = await supabase
    .from('brand_deals')
    .select('*')
    .ilike('brand_name', '%Mellow%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Deals error:', error);
  } else {
    console.log('Found', deals?.length, 'Mellow deals');
    deals?.forEach(d => {
      console.log(`- ID: ${d.id}, Creator: ${d.creator_id}, Status: ${d.status}, Brand: ${d.brand_name}`);
    });
  }

  // Also check profiles for the email from the screenshot
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'tootifrootie3@yopmail.com')
    .maybeSingle();

  if (profError) {
    console.error('Profile error:', profError);
  } else if (profile) {
    console.log('Found profile for tootifrootie3@yopmail.com:', profile.id);
    
    // Now check deals for THIS creator id specifically
    const { data: creatorDeals } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('creator_id', profile.id);
    
    console.log('Deals for this creator:', creatorDeals?.length);
  } else {
    console.log('No profile found for tootifrootie3@yopmail.com');
  }
}

check();
