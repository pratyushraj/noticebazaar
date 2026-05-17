import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
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

async function main() {
  const username = 'simba_bhimavaram_bullodu';
  const filePath = join(process.cwd(), 'public/creator-assets/simba_avatar.png');
  const storagePath = `discovery-avatars/${username}-avatar.png`;

  console.log(`📤 Uploading actual avatar for @${username}...`);

  try {
    const fileBuffer = readFileSync(filePath);

    // 1. Upload to Storage
    const { data, error: uploadError } = await supabase.storage
      .from('creator-discovery')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('✅ Avatar uploaded to storage successfully.');

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-discovery')
      .getPublicUrl(storagePath);

    console.log(`✅ Public URL generated: ${publicUrl}`);

    // 3. Update Profile Table (first_name, last_name, avatar_url)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        first_name: 'Simba',
        last_name: '& Sara',
        avatar_url: publicUrl 
      })
      .eq('username', username);

    if (updateError) throw updateError;
    console.log('✅ Profile updated in database with true display name and true avatar.');

    console.log('\n✨ Customization Successful! Simba & Sara is now fully aligned with their real Instagram identity.');

  } catch (error: any) {
    console.error('❌ Customization failed with error:', error.message);
  }
}

main();
