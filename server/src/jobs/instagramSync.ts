import { supabase } from '../lib/supabase.js';
import { fetchInstagramPublicData } from '../services/instagramService.js';

export const syncSingleCreatorInstagram = async (
  creatorId: string,
  instagramUsername?: string | null
): Promise<{
  success: boolean;
  profile_photo?: string | null;
  followers?: number | null;
  reason?: string;
}> => {
  let username = instagramUsername?.replace(/^@+/, '').trim().toLowerCase() || null;

  if (!username) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('instagram_handle')
      .eq('id', creatorId)
      .maybeSingle();
    if (error) return { success: false, reason: 'profile_fetch_failed' };
    username = ((profile as any)?.instagram_handle || '').replace(/^@+/, '').trim().toLowerCase() || null;
  }

  if (!username) return { success: false, reason: 'instagram_not_set' };

  const data = await fetchInstagramPublicData(username);
  if (!data) return { success: false, reason: 'instagram_fetch_failed' };

  const payload: Record<string, unknown> = {
    last_instagram_sync: new Date().toISOString(),
  };
  if (typeof data.followers === 'number') payload.instagram_followers = data.followers;
  if (data.profile_photo) payload.instagram_profile_photo = data.profile_photo;

  const { error: updateError } = await supabase
    .from('profiles')
    .update(payload as any)
    .eq('id', creatorId);

  if (updateError) return { success: false, reason: 'profile_update_failed' };

  return {
    success: true,
    profile_photo: data.profile_photo,
    followers: data.followers,
  };
};

export const syncInstagramStats = async (): Promise<{ checked: number; updated: number }> => {
  const { data: creators, error } = await supabase
    .from('profiles')
    .select('id, instagram_handle')
    .eq('role', 'creator')
    .not('instagram_handle', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch creators for Instagram sync: ${error.message}`);
  }

  const rows = Array.isArray(creators) ? creators : [];
  let updated = 0;

  for (const creator of rows) {
    const handle = (creator as any)?.instagram_handle;
    const creatorId = (creator as any)?.id;
    if (!handle || !creatorId) continue;

    const data = await fetchInstagramPublicData(handle);
    if (!data) continue;

    const payload: Record<string, unknown> = {
      last_instagram_sync: new Date().toISOString(),
    };
    if (data.followers !== null) payload.instagram_followers = data.followers;
    if (data.profile_photo) payload.instagram_profile_photo = data.profile_photo;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload as any)
      .eq('id', creatorId);

    if (!updateError) updated++;
  }

  return { checked: rows.length, updated };
};
