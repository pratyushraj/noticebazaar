import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeDeal() {
  const username = 'tootifrootie3';
  
  // Find the creator
  const { data: creator, error: creatorError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (creatorError || !creator) {
    console.error('Creator not found:', username);
    return;
  }

  // Find the latest deal
  const { data: deal, error: dealError } = await supabase
    .from('brand_deals')
    .select('id, status')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (dealError || !deal) {
    console.error('No deal found for creator');
    return;
  }

  console.log(`Found deal ${deal.id} with status ${deal.status}. Updating to Completed...`);

  // Update status to Completed
  const { error: updateError } = await supabase
    .from('brand_deals')
    .update({ 
      status: 'Completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', deal.id);

  if (updateError) {
    console.error('Error updating deal:', updateError);
  } else {
    console.log('Successfully updated deal to Completed.');
  }
}

completeDeal();
