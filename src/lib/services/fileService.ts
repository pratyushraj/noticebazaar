/**
 * Centralized File Service
 * 
 * Handles all file upload/download operations with:
 * - Max file size protection
 * - Supported type validation
 * - Graceful fallback for DOCX
 * - Download errors with retry
 * - Mobile safe download paths
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// ============================================
// CONSTANTS
// ============================================

export const FILE_SIZE_LIMITS = {
  contract: 50 * 1024 * 1024, // 50MB
  invoice: 10 * 1024 * 1024, // 10MB
  expense: 10 * 1024 * 1024, // 10MB
  document: 20 * 1024 * 1024, // 20MB
  default: 50 * 1024 * 1024, // 50MB
} as const;

export const ALLOWED_FILE_TYPES = {
  contract: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
  invoice: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
  expense: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
} as const;

export const FILE_EXTENSIONS = {
  pdf: ['.pdf'],
  doc: ['.doc'],
  docx: ['.docx'],
  image: ['.png', '.jpg', '.jpeg'],
} as const;

// ============================================
// TYPES
// ============================================

export type FileCategory = 'contract' | 'invoice' | 'expense' | 'document';

export interface UploadOptions {
  category: FileCategory;
  userId: string;
  fileName?: string;
  folder?: string;
  bucket?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export interface DownloadOptions {
  url: string;
  filename?: string;
  retryCount?: number;
}

// ============================================
// VALIDATION
// ============================================

export function validateFileSize(file: File, category: FileCategory): { valid: boolean; error?: string } {
  const maxSize = FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.default;
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please compress or use a smaller file.`,
    };
  }
  
  return { valid: true };
}

export function validateFileType(file: File, category: FileCategory): { valid: boolean; error?: string } {
  const allowedTypes = ALLOWED_FILE_TYPES[category] || ALLOWED_FILE_TYPES.document;
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // Check MIME type
  if (fileType && allowedTypes.includes(fileType)) {
    return { valid: true };
  }
  
  // Fallback: Check file extension
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  const allowedExtensions = [
    ...FILE_EXTENSIONS.pdf,
    ...FILE_EXTENSIONS.doc,
    ...FILE_EXTENSIONS.docx,
    ...FILE_EXTENSIONS.image,
  ];
  
  if (allowedExtensions.includes(extension)) {
    return { valid: true };
  }
  
  // Special case: DOCX files sometimes have wrong MIME type
  if (extension === '.docx' && category === 'contract') {
    return { valid: true }; // Allow DOCX with warning
  }
  
  return {
    valid: false,
    error: `File type not supported. Allowed types: PDF, DOC, DOCX, PNG, JPG`,
  };
}

export function validateFile(file: File, category: FileCategory): { valid: boolean; error?: string } {
  // Validate size
  const sizeCheck = validateFileSize(file, category);
  if (!sizeCheck.valid) {
    return sizeCheck;
  }
  
  // Validate type
  const typeCheck = validateFileType(file, category);
  if (!typeCheck.valid) {
    return typeCheck;
  }
  
  return { valid: true };
}

// ============================================
// UPLOAD
// ============================================

export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const { category, userId, fileName, folder, bucket = 'creator-assets', onProgress } = options;
  
  // Validate file
  const validation = validateFile(file, category);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }
  
  // Generate file path
  const sanitizeName = (name: string) => 
    name.trim().replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const baseFileName = fileName || sanitizeName(file.name.replace(/\.[^/.]+$/, ''));
  const fileFolder = folder || `${category}s`;
  const filePath = `${userId}/${fileFolder}/${baseFileName}-${Date.now()}.${fileExtension}`;
  
  // Upload file
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (uploadError) {
    logger.error('File upload failed', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}. Please check your connection and try again.`);
  }
  
  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  if (!publicUrlData?.publicUrl) {
    // Cleanup: Remove uploaded file if we can't get URL
    await supabase.storage.from(bucket).remove([filePath]);
    throw new Error('Failed to get file URL. Please try again.');
  }
  
  return {
    url: publicUrlData.publicUrl,
    path: filePath,
    size: file.size,
    type: file.type,
  };
}

// ============================================
// DOWNLOAD
// ============================================

export function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const clean = pathname.split('/').filter(Boolean).pop();
    return clean || 'file.pdf';
  } catch {
    return 'file.pdf';
  }
}

export function isPdfUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.pdf') || pathname.includes('.pdf');
  } catch {
    return false;
  }
}

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

export async function downloadFile(
  options: DownloadOptions
): Promise<void> {
  const { url, filename, retryCount = 0 } = options;
  const maxRetries = 3;
  
  try {
    // For Supabase public storage URLs, use direct download
    const isSupabasePublic = url.includes('supabase.co') && url.includes('/storage/v1/object/public/');
    
    if (isSupabasePublic) {
      // Direct download for public Supabase storage
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || getFilenameFromUrl(url);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      return;
    }
    
    // For other URLs, use fetch
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || getFilenameFromUrl(url);
    
    // Mobile: Open in new tab if download fails
    if (isMobileDevice()) {
      link.target = '_blank';
    }
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
    
  } catch (error: any) {
    logger.error('File download failed', error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      toast.error('Download failed. Retrying...', {
        action: {
          label: 'Retry',
          onClick: () => downloadFile({ ...options, retryCount: retryCount + 1 }),
        },
      });
      
      // Auto-retry after 1 second
      setTimeout(() => {
        downloadFile({ ...options, retryCount: retryCount + 1 });
      }, 1000);
      
      return;
    }
    
    // Final error
    const errorMessage = error?.message || 'Failed to download file';
    toast.error(errorMessage, {
      action: {
        label: 'Retry',
        onClick: () => downloadFile({ ...options, retryCount: 0 }),
      },
      duration: 5000,
    });
    
    throw error;
  }
}

// ============================================
// DOCX FALLBACK
// ============================================

/**
 * Handles DOCX files that can't be previewed
 * Provides download option and conversion suggestion
 */
export function handleDocxFile(url: string, fileName: string): void {
  toast.info('DOCX files cannot be previewed. Download to view.', {
    action: {
      label: 'Download',
      onClick: () => downloadFile({ url, filename: fileName }),
    },
    duration: 5000,
  });
}

// ============================================
// DELETE
// ============================================

export async function deleteFile(
  filePath: string,
  bucket: string = 'creator-assets'
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
  if (error) {
    logger.error('File deletion failed', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// ============================================
// UTILITIES
// ============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function getFileCategoryFromPath(path: string): FileCategory {
  if (path.includes('contract')) return 'contract';
  if (path.includes('invoice')) return 'invoice';
  if (path.includes('expense')) return 'expense';
  return 'document';
}

