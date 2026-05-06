import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: 'api/server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase keys');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const dealId = '61f867a0-13cc-49e2-a875-c0922264aba8';
  const { data, error } = await supabase
    .from('brand_deals')
    .select('status, payment_status, payment_id')
    .eq('id', dealId)
    .single();

  if (error) {
    console.error('Error fetching deal:', error);
    return;
  }

  console.log('Deal Status:', data.status);
  console.log('Payment Status:', data.payment_status);
  console.log('Payment ID:', data.payment_id);
}

check();
