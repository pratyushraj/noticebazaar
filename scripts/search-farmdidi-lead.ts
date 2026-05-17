import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('brand_leads')
    .select('*')
    .ilike('brand_name', '%farmdidi%');
  
  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }
  
  console.log(`Found ${data.length} brand leads matching FarmDidi.`);
  data.forEach((lead: any) => {
    console.log(`ID: ${lead.id} | Name: ${lead.brand_name} | Email: ${lead.email} | Status: ${lead.status}`);
  });
}

main();
