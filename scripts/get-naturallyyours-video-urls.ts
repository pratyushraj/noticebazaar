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
  const usernames = [
    'prachisculinarycanvas', 
    'krishnavi_healthy_bites', 
    'littleexplorermommy', 
    'cookku_with_chikku', 
    '_cookingwithvineet', 
    'monika.urs', 
    'homechef_duggu', 
    'temptingtreat'
  ];

  const { data, error } = await supabase
    .from('profiles')
    .select('username, discovery_video_url')
    .in('username', usernames);
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Creator video URLs:');
  data.forEach((p: any) => {
    console.log(`@${p.username} | discovery_video_url: ${p.discovery_video_url}`);
  });
}

main();
