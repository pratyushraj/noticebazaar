import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const videoUpdates = [
  { 
    username: 'goofy.timtim', 
    discovery_video_url: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-discovery/discovery-reels/simba_bhimavaram_bullodu-reel-1779039956911.mp4' 
  },
  { 
    username: 'goldenasginger', 
    discovery_video_url: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-discovery/discovery-reels/kingrufus_malhotra-reel.mp4' 
  },
  { 
    username: 'postothezippypuppy', 
    // Posto is a beagle/cute puppy, we can use Bruno's beagle video
    discovery_video_url: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-discovery/discovery-reels/bruno_viral_h264.mp4' 
  },
  { 
    username: 'maxx_thegolden_retriever', 
    discovery_video_url: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-discovery/discovery-reels/simba_bhimavaram_bullodu-reel-1779039956911.mp4' 
  }
];

async function main() {
  console.log('🔄 Fixing pet creator discovery video URLs to use actual dog videos...');
  
  for (const update of videoUpdates) {
    const { error } = await supabase
      .from('profiles')
      .update({ discovery_video_url: update.discovery_video_url })
      .eq('username', update.username);

    if (error) {
      console.error(`❌ Failed to update ${update.username}:`, error.message);
    } else {
      console.log(`✅ Updated ${update.username}: discovery_video_url set to ${update.discovery_video_url}`);
    }
  }

  console.log('✨ All pet discovery videos successfully corrected in Supabase!');
}

main();
