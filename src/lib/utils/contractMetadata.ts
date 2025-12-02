/**
 * Contract metadata utilities
 * Fetches file metadata from Supabase Storage
 */

import { supabase } from '@/integrations/supabase/client';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';

export interface ContractMetadata {
  filename: string;
  filetype: 'pdf' | 'docx' | 'png' | 'jpg' | 'jpeg' | 'unknown';
  size: number; // in bytes
  uploaded_at: string;
  content_type?: string;
}

/**
 * Extract file path from Supabase Storage URL
 */
function extractFilePath(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1].split('?')[0] : null;
  } catch {
    return null;
  }
}

/**
 * Detect file type from URL or content type
 */
function detectFileType(url: string, contentType?: string): ContractMetadata['filetype'] {
  const urlLower = url.toLowerCase();
  
  if (contentType) {
    if (contentType.includes('pdf')) return 'pdf';
    if (contentType.includes('word') || contentType.includes('document')) return 'docx';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  }
  
  if (urlLower.includes('.pdf')) return 'pdf';
  if (urlLower.includes('.docx') || urlLower.includes('.doc')) return 'docx';
  if (urlLower.includes('.png')) return 'png';
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'jpg';
  
  return 'unknown';
}

/**
 * Extract filename from URL
 */
function extractFilename(url: string): string {
  try {
    const path = extractFilePath(url);
    if (path) {
      return path.split('/').pop() || 'contract';
    }
    return 'contract';
  } catch {
    return 'contract';
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get contract metadata from Supabase Storage
 */
export async function getContractMetadata(
  contractUrl: string | null | undefined
): Promise<ContractMetadata | null> {
  if (!contractUrl) return null;

  try {
    const filePath = extractFilePath(contractUrl);
    if (!filePath) {
      // Fallback: return basic metadata from URL
      return {
        filename: extractFilename(contractUrl),
        filetype: detectFileType(contractUrl),
        size: 0,
        uploaded_at: new Date().toISOString(),
      };
    }

    // Get file metadata from Supabase Storage
    const { data: files, error } = await supabase.storage
      .from(CREATOR_ASSETS_BUCKET)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        limit: 1,
        search: filePath.split('/').pop() || '',
      });

    if (error || !files || files.length === 0) {
      // Fallback metadata
      return {
        filename: extractFilename(contractUrl),
        filetype: detectFileType(contractUrl),
        size: 0,
        uploaded_at: new Date().toISOString(),
      };
    }

    const file = files[0];
    const contentType = file.metadata?.mimetype || file.metadata?.contentType;

    return {
      filename: file.name || extractFilename(contractUrl),
      filetype: detectFileType(contractUrl, contentType),
      size: file.metadata?.size || 0,
      uploaded_at: file.created_at || file.updated_at || new Date().toISOString(),
      content_type: contentType,
    };
  } catch (error) {
    console.warn('Failed to fetch contract metadata:', error);
    // Return fallback metadata
    return {
      filename: extractFilename(contractUrl),
      filetype: detectFileType(contractUrl),
      size: 0,
      uploaded_at: new Date().toISOString(),
    };
  }
}

