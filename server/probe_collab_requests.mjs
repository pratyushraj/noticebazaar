import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error: e1 } = await supabase.from('collab_requests').select('brand_logo_url').limit(1);
  console.log('Has brand_logo_url:', !e1);
  const { error: e2 } = await supabase.from('collab_requests').select('offer_expires_at').limit(1);
  console.log('Has offer_expires_at:', !e2);
}

check();
