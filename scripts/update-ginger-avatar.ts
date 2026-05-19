import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const profileId = 'ca37467e-f5ed-4f20-8d6c-9201a7f133ba';
  const username = 'goldenasginger';
  const localPath = '/Users/pratyushraj/Downloads/goldenasginger.jpg';
  const timestamp = Date.now();
  const storagePath = `${profileId}/profile-${timestamp}.jpg`;

  console.log(`📤 Uploading new display picture for @${username} (ID: ${profileId})...`);

  try {
    if (!existsSync(localPath)) {
      throw new Error(`Local image not found at: ${localPath}`);
    }

    const fileBuffer = readFileSync(localPath);

    // 1. Upload to creator-assets bucket
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('✅ Avatar uploaded to storage successfully.');

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-assets')
      .getPublicUrl(storagePath);

    console.log(`✅ Public URL generated: ${publicUrl}`);

    // 3. Update Profiles Table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (updateError) throw updateError;
    console.log(`✅ Profile row for @${username} updated with new avatar_url!`);

    // Verify update
    const { data: updatedProfile, error: selectError } = await supabase
      .from('profiles')
      .select('username, avatar_url, first_name, last_name')
      .eq('id', profileId)
      .single();

    if (selectError) throw selectError;
    console.log('\n🐾 Verification audit:');
    console.log(`- Username: @${updatedProfile.username}`);
    console.log(`- Name: ${updatedProfile.first_name} ${updatedProfile.last_name}`);
    console.log(`- New avatar_url: ${updatedProfile.avatar_url}`);

    console.log('\n✨ Profile Picture Update Successful!');

  } catch (error: any) {
    console.error('❌ Profile picture update failed:', error.message);
  }
}

main();
