
import { supabase } from '../server/src/lib/supabase.js';

async function checkSchema() {
  console.log('Checking brand_deals columns...');
  const { data: deals, error: dealsErr } = await supabase.from('brand_deals').select('*').limit(1);
  if (dealsErr) {
    console.error('Error fetching brand_deals:', dealsErr);
  } else {
    console.log('brand_deals columns:', Object.keys(deals[0] || {}));
  }

  console.log('Checking collab_requests columns...');
  const { data: reqs, error: reqsErr } = await supabase.from('collab_requests').select('*').limit(1);
  if (reqsErr) {
    console.error('Error fetching collab_requests:', reqsErr);
  } else {
    console.log('collab_requests columns:', Object.keys(reqs[0] || {}));
  }
}

checkSchema();
