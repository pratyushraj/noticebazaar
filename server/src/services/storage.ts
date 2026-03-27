// @ts-nocheck
// Storage service for signed URL generation (Supabase Storage)

import { supabase } from '../lib/supabase.js';

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

/**
 * Upload a file to storage and return the storage path (not public URL)
 * This enables signed URL generation on-demand for better security
 */
export async function uploadFileSecure(
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<{ path: string; bucket: string }> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType,
      upsert: false
    });

  if (error) throw new Error(`Failed to upload file: ${error.message}`);

  return {
    path,
    bucket: BUCKET_NAME
  };
}

/**
 * Extract storage path from a public URL (for migration purposes)
 * Example: https://xxx.supabase.co/storage/v1/object/public/creator-assets/contracts/user/file.docx
 * Returns: contracts/user/file.docx
 */
export function extractPathFromPublicUrl(publicUrl: string): string | null {
  if (!publicUrl) return null;

  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

