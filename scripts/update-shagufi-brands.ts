import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

async function run() {
  const handle = 'shagufikhan_';
  console.log(`🚀 Updating brands for ${handle}...`);

  const { error } = await supabase
    .from('profiles')
    .update({ 
      past_brands: ['Dove', 'Pizza Hut', 'Club 72 Gym', 'Studdmuffyn', 'Pop', 'Ozone'],
      past_brand_count: 100,
      collab_brands_count_override: 100
    })
    .eq('instagram_handle', handle);

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Brands updated!');
  }
}

run();
