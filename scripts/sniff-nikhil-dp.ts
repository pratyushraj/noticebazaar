import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function decodeHtmlEntities(str: string) {
  return str.replace(/&amp;/g, '&');
}

async function main() {
  const username = 'nikh_l_martolia';
  console.log(`🚀 Sniffing raw unedited Instagram DP for @${username}...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    userAgent: getRandomUserAgent()
  });
  const page = await context.newPage();
  
  const profileUrl = `https://www.instagram.com/${username}/`;
  let liveAvatarUrl: string | null = null;
  
  try {
    console.log(`🌐 Navigating directly to profile page: ${profileUrl}...`);
    // Wait for the HTML metadata or profile picture to load
    await page.goto(profileUrl, { waitUntil: 'commit', timeout: 15000 });
    const html = await page.content();
    
    // Attempt 1: Extract from og:image meta tag
    const match = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (match && match[1]) {
      liveAvatarUrl = decodeHtmlEntities(match[1]);
      console.log(`✅ Sniffed live avatar URL from og:image metadata!`);
    } else {
      // Attempt 2: Select the profile picture element
      const profilePicEl = await page.$('img[alt*="profile picture"], img[alt*="profile photo"]');
      if (profilePicEl) {
        liveAvatarUrl = await profilePicEl.getAttribute('src');
        console.log(`✅ Sniffed live avatar URL from img attribute!`);
      }
    }
  } catch (err: any) {
    console.error(`❌ Page navigation or element selection failed:`, err.message);
  }

  if (!liveAvatarUrl) {
    console.warn('⚠️ Sniff failed or blocked. Let\'s try Picuki as a high-fidelity alternative...');
    try {
      const picukiUrl = `https://www.picuki.com/profile/${username}`;
      await page.goto(picukiUrl, { waitUntil: 'commit', timeout: 15000 });
      const picukiPicEl = await page.$('.profile-avatar img');
      if (picukiPicEl) {
        liveAvatarUrl = await picukiPicEl.getAttribute('src');
        console.log(`✅ Sniffed live avatar URL from Picuki successfully!`);
      }
    } catch (picukiErr: any) {
      console.error(`❌ Picuki sniff failed:`, picukiErr.message);
    }
  }

  let downloadedBuffer: Buffer | null = null;

  if (liveAvatarUrl) {
    console.log(`📥 Downloading live unedited avatar: ${liveAvatarUrl}...`);
    try {
      const response = await page.goto(liveAvatarUrl, { timeout: 15000 });
      if (response && response.status() === 200) {
        downloadedBuffer = await response.body();
        console.log('✅ Successfully downloaded unedited avatar buffer!');
      }
    } catch (err: any) {
      console.error('❌ Direct image download failed:', err.message);
    }
  }

  await browser.close();

  // If we successfully downloaded the raw Instagram avatar
  if (downloadedBuffer) {
    console.log('📤 Uploading original unedited avatar to creator-assets bucket...');
    const avatarStoragePath = `${username}/avatar_ultra.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(avatarStoragePath, downloadedBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    const avatarPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/creator-assets/${avatarStoragePath}`;
    console.log(`✅ Avatar CDN URL updated successfully: ${avatarPublicUrl}`);
    
    // Update profiles table
    console.log('📡 Updating profiles table in Supabase...');
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarPublicUrl,
        instagram_profile_photo: avatarPublicUrl
      })
      .eq('username', username);
      
    if (dbError) throw dbError;
    console.log('✅ Database profile avatar updated successfully!');
    
    // Backup sync
    try {
      const backupScript = path.join(process.cwd(), 'scratch', 'backup_supabase_data.mjs');
      if (fs.existsSync(backupScript)) {
        console.log(`   📡 Syncing updates to offline backups...`);
        execSync(`node ${backupScript}`, { stdio: 'inherit' });
      }
      console.log('✅ Backups updated successfully!');
    } catch (backupErr: any) {
      console.warn('⚠️ Backup sync failed (non-fatal):', backupErr.message);
    }
    
    console.log('\n🎉 UNEDITED RAW INSTAGRAM AVATAR SUCCESSFULLY RESTORED!');
  } else {
    console.error('❌ Could not download or locate any raw avatar. Profile remains unchanged.');
    process.exit(1);
  }
}

main().catch(console.error);
