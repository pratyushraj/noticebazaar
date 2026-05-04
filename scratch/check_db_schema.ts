
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching brand_deals:', error);
  } else {
    console.log('Columns in brand_deals:', Object.keys(data[0] || {}));
  }

  const { data: reqData, error: reqError } = await supabase
    .from('collab_requests')
    .select('*')
    .limit(1);

  if (reqError) {
    console.error('Error fetching collab_requests:', reqError);
  } else {
    console.log('Columns in collab_requests:', Object.keys(reqData[0] || {}));
  }
}

checkColumns();
