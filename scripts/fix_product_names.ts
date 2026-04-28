
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProductNames() {
  const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
  const productName = 'Signature Leather Wallet';

  console.log(`Updating product names to "${productName}" for Mellow Prints requests...`);

  const { data, error } = await supabase
    .from('collab_requests')
    .update({ barter_description: productName })
    .eq('creator_id', userId)
    .ilike('brand_name', '%mellow%');

  if (error) {
    console.error('Error updating requests:', error);
    return;
  }

  console.log('Successfully updated product names.');
}

fixProductNames();
