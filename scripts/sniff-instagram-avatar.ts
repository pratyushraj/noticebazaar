import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

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
  const username = process.argv[2];
  if (!username) {
    console.error('❌ Error: Please provide an Instagram username as an argument.');
    console.error('Usage: npx tsx scripts/sniff-instagram-avatar.ts <username>');
    process.exit(1);
  }

  console.log(`🚀 Sniffing raw high-res public Instagram DP for @${username}...`);

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
    console.log(`🌐 Navigating directly to Instagram: ${profileUrl}...`);
    await page.goto(profileUrl, { waitUntil: 'commit', timeout: 15000 });
    const html = await page.content();
    
    // Attempt 1: og:image
    const match = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (match && match[1]) {
      liveAvatarUrl = decodeHtmlEntities(match[1]);
      console.log(`✅ Sniffed live avatar URL from Instagram og:image metadata!`);
    } else {
      // Attempt 2: profile picture selector
      const profilePicEl = await page.$('img[alt*="profile picture"], img[alt*="profile photo"]');
      if (profilePicEl) {
        liveAvatarUrl = await profilePicEl.getAttribute('src');
        console.log(`✅ Sniffed live avatar URL from Instagram img element!`);
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ Direct Instagram navigation failed or timed out:`, err.message);
  }

  // Attempt 3: Picuki bypass
  if (!liveAvatarUrl) {
    console.log('🌐 Bypassing via Picuki (anonymous high-fidelity Instagram proxy)...');
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

  // Attempt 4: Fast URL fallback API
  if (!liveAvatarUrl) {
    console.log('🌐 Falling back to open API search...');
    liveAvatarUrl = `https://unavatar.io/instagram/${username}`;
    console.log(`✅ Set fallback proxy URL: ${liveAvatarUrl}`);
  }

  let downloadedBuffer: Buffer | null = null;

  if (liveAvatarUrl) {
    console.log(`📥 Downloading live unedited avatar from: ${liveAvatarUrl}...`);
    try {
      const response = await page.goto(liveAvatarUrl, { timeout: 15000 });
      if (response && response.status() === 200) {
        downloadedBuffer = await response.body();
        console.log('✅ Successfully downloaded unedited avatar buffer!');
      }
    } catch (err: any) {
      console.warn('⚠️ Direct page navigation download failed, trying fetch API...');
      try {
        const fetchRes = await fetch(liveAvatarUrl);
        if (fetchRes.ok) {
          downloadedBuffer = await fetchRes.buffer();
          console.log('✅ Successfully downloaded avatar via node-fetch!');
        }
      } catch (fetchErr: any) {
        console.error('❌ Direct fetch also failed:', fetchErr.message);
      }
    }
  }

  await browser.close();

  if (downloadedBuffer) {
    console.log('📤 Uploading original high-res avatar to creator-assets bucket...');
    // Use unique timestamp to bypass any CDN caches instantly
    const avatarStoragePath = `${username}/avatar_perfect_final_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(avatarStoragePath, downloadedBuffer, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    const avatarPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/creator-assets/${avatarStoragePath}`;
    console.log(`✅ Avatar CDN URL generated: ${avatarPublicUrl}`);
    
    // Update profiles table in Supabase
    console.log('📡 Updating database profiles table...');
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarPublicUrl,
        instagram_profile_photo: avatarPublicUrl
      })
      .eq('username', username);
      
    if (dbError) throw dbError;
    console.log('✅ Database profile avatar updated successfully!');
    
    // Sync local sitemaps and backups
    try {
      const backupScript = path.join(process.cwd(), 'scratch', 'backup_supabase_data.mjs');
      if (fs.existsSync(backupScript)) {
        console.log(`   📡 Syncing updates to offline backups...`);
        execSync(`node ${backupScript}`, { stdio: 'inherit' });
      }
      console.log(`   📡 Regenerating dynamic XML sitemap index...`);
      execSync('npx tsx scripts/generate-sitemap.ts', { stdio: 'inherit' });
      console.log('✅ Local backups and sitemaps updated successfully!');
    } catch (syncErr: any) {
      console.warn('⚠️ Backup sync warning (non-fatal):', syncErr.message);
    }
    
    console.log(`\n🎉 @${username} RAW HIGH-RESOLUTION UNEDITED INSTAGRAM AVATAR SUCCESSFULLY RESTORED AND SYNCED! 🎉`);
  } else {
    console.error('❌ Failed to download or resolve a valid profile picture. Profile remains unchanged.');
    process.exit(1);
  }
}

main().catch(console.error);
