import { supabase } from '@/integrations/supabase/client';

async function checkDeals() {
  const { data: deals, error } = await supabase
    .from('brand_deals')
    .select('id, campaign_goal, selected_package_label, form_data, campaign_description')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching deals:', error);
    return;
  }

  console.log('Recent deals:');
  deals.forEach(deal => {
    console.log(`ID: ${deal.id}`);
    console.log(`Goal: ${deal.campaign_goal}`);
    console.log(`Label: ${deal.selected_package_label}`);
    console.log(`FormData: ${JSON.stringify(deal.form_data)}`);
    console.log(`Desc snippet: ${deal.campaign_description?.substring(0, 100)}...`);
    console.log('---');
  });
}

checkDeals();
