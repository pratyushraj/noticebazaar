
import { supabase } from './src/integrations/supabase/client';

async function checkColumns() {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in profiles table:', Object.keys(data[0]));
  } else {
    console.log('No rows in profiles table.');
  }
}

checkColumns();
