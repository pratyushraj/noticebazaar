import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function find() {
  const { data: p } = await supabase.from('creator_portfolio').select('*');
  const badP = (p || []).filter(row => JSON.stringify(row).includes('1620916566390'));
  console.log('Portfolio:', JSON.stringify(badP, null, 2));

  const { data: b } = await supabase.from('collab_requests').select('*');
  const badB = (b || []).filter(row => JSON.stringify(row).includes('1620916566390'));
  console.log('Collabs:', JSON.stringify(badB, null, 2));
}
find();
