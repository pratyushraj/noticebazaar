// @ts-nocheck
import axios from 'axios';
import { supabase } from '../lib/supabase.js';


const ALLOWED_IMAGE_DOMAINS = [
  'instagram.com',
  'www.instagram.com',
  'i.instagram.com',
  'graph.instagram.com',
  'scontent.cdninstagram.com',
  'platform-lookaside.fbsbx.com'
];

/**
 * Validates URL to prevent SSRF and ensures it's from allowed domains
 */
function validateAndParseUrl(urlString: string): { hostname: string; protocol: string; valid: boolean } {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      return { hostname: '', protocol: '', valid: false };
    }

    // Check against allowed domains
    const isAllowed = ALLOWED_IMAGE_DOMAINS.some(domain => 
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );
    
    if (!isAllowed) {
      console.warn(`[ImageStorageService] Blocked SSRF attempt to domain: ${url.hostname}`);
      return { hostname: '', protocol: '', valid: false };
    }

    return { hostname: url.hostname, protocol: url.protocol, valid: true };
  } catch (err) {
    return { hostname: '', protocol: '', valid: false };
  }
}

/**
 * Downloads an external image from a URL and uploads it to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function saveExternalImageToStorage(url: string, path: string): Promise<string | null> {
    try {
        // Validate URL
        const urlValidation = validateAndParseUrl(url);
        if (!urlValidation.valid) {
          console.warn(`[ImageStorageService] Invalid or blocked URL: ${url}`);
          return null;
        }

        // Download with enhanced security
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'image/webp,image/*,*/*;q=0.8'
            },
            maxContentLength: 15 * 1024 * 1024, // 15MB limit
            maxBodyLength: 15 * 1024 * 1024,
        });

        clearTimeout(timeoutId);

        // Validate content-type
        const contentType = response.headers['content-type']?.toLowerCase() || '';
        if (!contentType.startsWith('image/')) {
          console.warn(`[ImageStorageService] Non-image content blocked: ${contentType}`);
          return null;
        }

        // Verify image can be decoded (basic check via magic bytes)
        const buffer = Buffer.from(response.data, 'binary');
        const magicBytes = buffer.slice(0, 8).toString('hex').toUpperCase();
        const validImageMagicBytes = [
          'FFD8FF', // JPEG
          '89504E47', // PNG
          '47494638', // GIF
          '52494646', // WebP (RIFF)
          '57454250', // WebP (WEBP)
        ];
        
        const isRecognizedImage = validImageMagicBytes.some(magic => magicBytes.startsWith(magic));
        
        if (!isRecognizedImage) {
          console.warn('[ImageStorageService] File does not match image magic bytes');
          return null;
        }

        // Upload to Supabase with restricted content type
        const safeContentType = contentType.split(';')[0].trim();
        const { data, error } = await supabase.storage
            .from('creator-assets')
            .upload(path, buffer, {
                contentType: safeContentType,
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('[ImageStorageService] Upload failed:', error);
            return null;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('creator-assets')
            .getPublicUrl(path);

        return publicUrl;
    } catch (err: any) {
        console.error('[ImageStorageService] Failed to save external image:', err?.message || err);
        return null;
    }
}