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
  const targetUsernames = [
    'prachisculinarycanvas', 
    'krishnavi_healthy_bites', 
    'littleexplorermommy', 
    'cookku_with_chikku', 
    '_cookingwithvineet', 
    'monika.urs', 
    'homechef_duggu', 
    'temptingtreat',
    '_small_home_kitchen',
    'blogsbysnehaaa',
    'chroniclesofffoods',
    'myspace_vlogs',
    'we_are_chefing',
    'shinyyy.05',
    'thegurgaonfoodie',
    'jaya_the_explorer',
    'aasthakumari7662',
    'd_dollypatel',
    'rounak_agarwal'
  ];

  const { data, error } = await supabase
    .from('profiles')
    .select('username, first_name, last_name, discovery_video_url')
    .in('username', targetUsernames);
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nAll 19 Food Creators discovery_video_url status:');
  targetUsernames.forEach(username => {
    const p = data.find(c => c.username === username);
    if (p) {
      console.log(`@${username} | Name: ${p.first_name} | discovery_video_url: ${p.discovery_video_url}`);
    } else {
      console.log(`@${username} | NOT FOUND IN PROFILES`);
    }
  });
}

main();
