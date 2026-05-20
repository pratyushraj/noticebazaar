import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fetchInstagramPublicData } from './src/services/instagramService.js';
import { saveExternalImageToStorage } from './src/services/imageStorageService.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PLACEHOLDER_RE = /placeholder|via\.placeholder|ui-avatars|default|1620916566390/i;

function isMissingOrPlaceholder(value) {
  const text = String(value || '').trim();
  return !text || PLACEHOLDER_RE.test(text);
}

function resolveHandle(profile) {
  const handle = String(profile.instagram_handle || profile.username || '').trim().replace(/^@+/, '').toLowerCase();
  return handle || null;
}

function extensionFromContentType(contentType) {
  const normalized = String(contentType || '').toLowerCase().split(';')[0].trim();
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/jpeg') return 'jpg';
  return null;
}

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, role, avatar_url, instagram_profile_photo, instagram_handle, business_name, last_instagram_sync')
    .eq('role', 'creator');

  if (error) throw error;

  const creators = (data || []).filter((profile) =>
    isMissingOrPlaceholder(profile.avatar_url) || isMissingOrPlaceholder(profile.instagram_profile_photo)
  );

  console.log(`Found ${creators.length} creators needing DP backfill`);

  const results = [];

  for (const profile of creators) {
    const handle = resolveHandle(profile);
    if (!handle) {
      results.push({ username: profile.username, status: 'skipped_no_handle' });
      continue;
    }

    try {
      const insta = await fetchInstagramPublicData(handle);
      if (!insta?.profile_photo) {
        results.push({ username: profile.username, status: 'no_public_photo' });
        continue;
      }

      const fileExt = extensionFromContentType(insta.profile_photo?.includes('.png') ? 'image/png' : 'image/jpeg') || 'jpg';
      const filePath = `${profile.id}/profile-${Date.now()}.${fileExt}`;
      const permanentUrl = await saveExternalImageToStorage(insta.profile_photo, filePath);

      if (!permanentUrl) {
        results.push({ username: profile.username, status: 'upload_failed' });
        continue;
      }

      const payload = {
        avatar_url: permanentUrl,
        instagram_profile_photo: permanentUrl,
        last_instagram_sync: new Date().toISOString(),
        ...(insta.full_name && !profile.business_name ? { business_name: insta.full_name } : {}),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id);

      if (updateError) {
        results.push({ username: profile.username, status: 'db_update_failed', error: updateError.message });
        continue;
      }

      results.push({ username: profile.username, status: 'updated', url: permanentUrl });
      console.log(`Updated @${profile.username || profile.id}`);
    } catch (err) {
      results.push({ username: profile.username, status: 'error', error: err?.message || String(err) });
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
