// Storage service for signed URL generation (Supabase Storage)

import { supabase } from '../index.js';

const BUCKET_NAME = process.env.STORAGE_BUCKET || 'creator-assets';

export async function generateSignedUploadUrl(
  path: string,
  contentType: string
): Promise<{ signedUrl: string; path: string }> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path, {
      upsert: false
    });

  if (error) throw new Error(`Failed to generate upload URL: ${error.message}`);

  return {
    signedUrl: data.signedUrl,
    path
  };
}

export async function generateSignedDownloadUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(`Failed to generate download URL: ${error.message}`);

  return data.signedUrl;
}

