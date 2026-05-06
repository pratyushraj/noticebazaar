import { createClient } from '@supabase/supabase-api';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findDeal() {
  console.log('Searching for deal with amount 2.00...');
  const { data, error } = await supabase
    .from('brand_deals')
    .select('*, profiles!creator_id(first_name, last_name, username)')
    .eq('deal_amount', 2)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deals:', error);
    return;
  }

  console.log('Found', data.length, 'deals.');
  data.forEach(deal => {
    console.log('---');
    console.log('ID:', deal.id);
    console.log('Status:', deal.status);
    console.log('Payment Status:', deal.payment_status);
    console.log('Payment ID:', deal.payment_id);
    console.log('Creator:', deal.profiles?.first_name, deal.profiles?.last_name, '@' + deal.profiles?.username);
    console.log('Brand Email:', deal.brand_email);
    console.log('Created At:', deal.created_at);
  });
}

findDeal();
