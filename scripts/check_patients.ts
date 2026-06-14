import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabase
    .from('dental_patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
  } else {
    console.log('Patients in DB:', data.map(d => ({ id: d.id, name: d.name, before: d.before_photo ? 'yes' : 'no', after: d.after_photo ? 'yes' : 'no' })));
  }
}

main().catch(console.error);
