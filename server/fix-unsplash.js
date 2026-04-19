import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { error } = await supabase
    .from('collab_requests')
    .update({ barter_product_image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60' })
    .ilike('barter_product_image_url', '%1620916566390%');
  if (error) console.error(error);
  else console.log('✅ Updated barter_product_image_url!');
}
fix();
