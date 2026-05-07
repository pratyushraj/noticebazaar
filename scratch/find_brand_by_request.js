
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from server directory
dotenv.config({ path: path.join(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requestId = 'c602bd5d-0de4-4538-8bc3-d39f88380bb0';

async function checkTables() {
  const tables = ['unclaimed_collab_requests', 'collab_request_leads', 'collab_requests', 'brand_deals'];
  
  for (const table of tables) {
    console.log(`Checking table: ${table}...`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', requestId)
      .maybeSingle();
    
    if (error) {
      console.error(`Error checking ${table}:`, error.message);
      continue;
    }
    
    if (data) {
      console.log(`Found in ${table}:`);
      console.log(JSON.stringify(data, null, 2));
      return;
    }
  }
  
  console.log('Request ID not found in any checked table.');
}

checkTables();
