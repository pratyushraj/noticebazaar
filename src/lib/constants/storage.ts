/**
 * Supabase Storage Bucket Names
 * 
 * Update these constants to match your actual Supabase bucket names.
 * You can find your bucket names in: Supabase Dashboard → Storage → Buckets
 * 
 * To configure via environment variable, add to your .env file:
 * VITE_CREATOR_ASSETS_BUCKET=your-actual-bucket-name
 */

// Main bucket for creator assets (contracts, invoices, etc.)
// Change this to match your actual bucket name (e.g., 'creator-assets-prod', 'creator_uploads', etc.)
export const CREATOR_ASSETS_BUCKET =
  import.meta.env.VITE_CREATOR_ASSETS_BUCKET ||
  "creator-assets";

// Bucket for client documents
export const CLIENT_DOCUMENTS_BUCKET = import.meta.env.VITE_CLIENT_DOCUMENTS_BUCKET || 'client-documents';

// Bucket for copyright screenshots
export const COPYRIGHT_SCREENSHOTS_BUCKET = import.meta.env.VITE_COPYRIGHT_SCREENSHOTS_BUCKET || 'copyright-screenshots';

// Bucket for marketing assets
export const MARKETING_ASSETS_BUCKET = import.meta.env.VITE_MARKETING_ASSETS_BUCKET || 'marketing-assets';

/**
 * Extracts the bucket name from a Supabase storage URL
 * @param url - The full Supabase storage URL
 * @returns The bucket name or null if not found
 */
export function extractBucketNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    // Supabase storage URLs follow this pattern:
    // https://<project>.supabase.co/storage/v1/object/public/<bucket-name>/<path>
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\//);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extracts the file path from a Supabase storage URL
 * @param url - The full Supabase storage URL
 * @param bucketName - Optional bucket name to use for extraction
 * @returns The file path or null if not found
 */
export function extractFilePathFromUrl(url: string | null | undefined, bucketName?: string): string | null {
  if (!url) return null;
  
  try {
    const bucket = bucketName || extractBucketNameFromUrl(url);
    if (!bucket) return null;
    
    const match = url.match(new RegExp(`/${bucket}/(.+)$`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

