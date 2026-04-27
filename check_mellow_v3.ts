import { supabase } from './src/integrations/supabase/client.ts';

async function check() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('*')
    .ilike('brand_name', '%Mellow%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

check();
