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

async function findDeals() {
  const brandEmail = 'mellowprints0707@yopmail.com';
  console.log('Searching for deals for brand:', brandEmail);
  const { data, error } = await supabase
    .from('brand_deals')
    .select('*, profiles!fk_creator_id(first_name, last_name, username)')
    .eq('brand_email', brandEmail)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deals:', error);
    return;
  }

  console.log('Found', data.length, 'deals.');
  data.forEach((deal: any) => {
    console.log('---');
    console.log('ID:', deal.id);
    console.log('Amount:', deal.deal_amount);
    console.log('Status:', deal.status);
    console.log('Payment Status:', deal.payment_status);
    console.log('Payment ID:', deal.payment_id);
    console.log('Created At:', deal.created_at);
  });
}

findDeals();
