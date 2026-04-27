
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillCollabRequestIds() {
  const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
  
  // 1. Get all requests that have a deal_id
  const { data: requests, error: reqError } = await supabase
    .from('collab_requests')
    .select('id, deal_id')
    .eq('creator_id', userId)
    .not('deal_id', 'is', null);

  if (reqError) {
    console.error('Error fetching requests:', reqError);
    return;
  }

  console.log(`Found ${requests.length} mappings to backfill`);

  for (const r of requests) {
    console.log(`Backfilling Deal ${r.deal_id} with Request ${r.id}...`);
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({ collab_request_id: r.id })
      .eq('id', r.deal_id);

    if (updateError) {
      console.error(`  Failed to update deal ${r.deal_id}:`, updateError);
    } else {
      console.log(`  Successfully updated deal ${r.deal_id}`);
    }
  }
}

backfillCollabRequestIds();
