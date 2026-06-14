import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('⚡ Checking columns on dental_patients...');

  const columns = ['before_photo', 'after_photo', 'before_after_photos'];
  for (const col of columns) {
    const { error } = await supabase
      .from('dental_patients')
      .select(col)
      .limit(1);
    
    if (error) {
      console.log(`❌ Column ${col} error:`, error.message);
    } else {
      console.log(`✅ Column ${col} exists!`);
    }
  }
}

main().catch(console.error);
