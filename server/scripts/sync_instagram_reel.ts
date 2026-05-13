import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * SYNC INSTAGRAM REEL TO NATIVE MP4
 * 
 * Usage: npx ts-node sync_instagram_reel.ts <instagram_reel_url> <creator_handle>
 * Example: npx ts-node sync_instagram_reel.ts https://www.instagram.com/reel/DOs9iIID295/ souptik_manna
 */

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncReel() {
    const reelUrl = process.argv[2];
    const handle = process.argv[3];

    if (!reelUrl || !handle) {
        console.error('❌ Usage: npx ts-node sync_instagram_reel.ts <reel_url> <handle>');
        process.exit(1);
    }

    const tempDir = path.resolve(__dirname, '../temp_reels');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const tempFilePath = path.join(tempDir, `${handle}_reel.mp4`);
    
    console.log(`🚀 Step 1: Downloading reel from ${reelUrl}...`);
    try {
        // Limit size to avoid Supabase bucket restrictions (e.g. 15-20MB)
        execSync(`yt-dlp -f "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]/best" --max-filesize 15M -o "${tempFilePath}" "${reelUrl}"`, { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ yt-dlp failed. Make sure yt-dlp is installed on the system.');
        process.exit(1);
    }

    if (!fs.existsSync(tempFilePath)) {
        console.error('❌ Downloaded file not found.');
        process.exit(1);
    }

    console.log(`\n☁️ Step 2: Uploading to Supabase (creator-discovery bucket)...`);
    const fileBuffer = fs.readFileSync(tempFilePath);
    const storagePath = `discovery-reels/${handle}_${Date.now()}.mp4`;

    const { data, error: uploadError } = await supabase.storage
        .from('creator-discovery')
        .upload(storagePath, fileBuffer, {
            contentType: 'video/mp4',
            upsert: true
        });

    if (uploadError) {
        console.error('❌ Upload failed:', uploadError.message);
        process.exit(1);
    }

    const { data: { publicUrl } } = supabase.storage
        .from('creator-discovery')
        .getPublicUrl(storagePath);

    console.log(`✅ Uploaded successfully! Public URL: ${publicUrl}`);

    console.log(`\n📝 Step 3: Updating creator profile (${handle})...`);
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ discovery_video_url: publicUrl })
        .eq('instagram_handle', handle);

    if (dbError) {
        console.error('❌ Database update failed:', dbError.message);
    } else {
        console.log(`🎉 SUCCESS! ${handle}'s discovery reel is now a high-fidelity native MP4.`);
    }

    // Cleanup
    try {
        fs.unlinkSync(tempFilePath);
        console.log(`\n🧹 Cleaned up temporary file: ${tempFilePath}`);
    } catch (e) {}
}

syncReel();
