import axios from 'axios';
import { supabase } from '../lib/supabase.js';
import { CREATOR_ASSETS_BUCKET } from '../lib/constants/storage.js';

/**
 * Downloads an external image from a URL and uploads it to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function saveExternalImageToStorage(url: string, path: string): Promise<string | null> {
    try {
        if (!url || !url.startsWith('http')) return null;

        // 1. Download the image
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        const buffer = Buffer.from(response.data, 'binary');

        // 2. Upload to Supabase
        const { data, error } = await supabase.storage
            .from('creator-assets')
            .upload(path, buffer, {
                contentType,
                upsert: true
            });

        if (error) {
            console.error('[ImageStorageService] Upload failed:', error);
            return null;
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('creator-assets')
            .getPublicUrl(path);

        return publicUrl;
    } catch (err: any) {
        console.error('[ImageStorageService] Failed to save external image:', err?.message || err);
        return null;
    }
}
