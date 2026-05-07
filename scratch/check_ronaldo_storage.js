
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  const userId = '06baef82-4805-44c5-83bf-ac5ff2c9b4b8';
  const { data, error } = await supabase.storage
    .from('creator-assets')
    .list(`${userId}/avatars`);

  if (error) {
    console.error('Error listing storage:', error);
    return;
  }

  console.log('Files found in storage:', data);
}

checkStorage();
