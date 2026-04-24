
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  try {
    const sql = `
      ALTER TABLE public.brands
      ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_handle TEXT,
      ADD COLUMN IF NOT EXISTS content_niches TEXT[] DEFAULT '{}'::TEXT[];
    `;
    
    // We can't run raw SQL via supabase-js unless we have an RPC or use a different library.
    // However, we can try to just select the columns to see if they exist.
    // If they don't, we'll inform the user they need to run the migration.
    
    const { data, error } = await supabase.from('brands').select('instagram_handle').limit(1);
    if (error && error.message.includes('column "instagram_handle" does not exist')) {
      console.log('COLUMNS_MISSING');
    } else if (error) {
       console.error('ERROR:', error.message);
    } else {
      console.log('COLUMNS_EXIST');
    }
  } catch (err) {
    console.error('CRASH:', err);
  }
}

runMigration();
