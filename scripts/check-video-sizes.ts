import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

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
    .select('username, discovery_video_url')
    .in('username', targetUsernames);
  
  if (error) {
    console.error('Error fetching URLs:', error);
    return;
  }

  console.log('\nChecking file sizes of all 19 video assets...');
  
  for (const p of data) {
    const url = p.discovery_video_url;
    if (!url) {
      console.log(`@${p.username} | No video URL`);
      continue;
    }
    
    try {
      const response = await axios.head(url, { timeout: 5000 });
      const bytes = parseInt(response.headers['content-length'] || '0');
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      console.log(`@${p.username} | Size: ${mb} MB | URL: ${url}`);
    } catch (err: any) {
      console.log(`@${p.username} | Failed to fetch headers: ${err.message}`);
    }
  }
}

main();
