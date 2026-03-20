import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Import and re-export currency utilities (explicit imports to avoid circular deps)
import * as currencyUtils from './utils/currency';
export const formatCurrency = currencyUtils.formatCurrency;
export const formatIndianCurrency = currencyUtils.formatIndianCurrency;

// Import and re-export date utilities (explicit imports to avoid circular deps)
import * as dateUtils from './utils/date';
export const formatDate = dateUtils.formatDate;
export const formatDateTime = dateUtils.formatDateTime;
export const formatRelativeTime = dateUtils.formatRelativeTime;
export const sortByDueDate = dateUtils.sortByDueDate;

// Import and re-export haptic utilities (explicit imports to avoid circular deps)
import * as hapticUtils from './utils/haptics';
export const triggerHaptic = hapticUtils.triggerHaptic;
export const HapticPatterns = hapticUtils.HapticPatterns;

// Import storage constants
import { CREATOR_ASSETS_BUCKET, extractBucketNameFromUrl } from './constants/storage';

/**
 * Safely opens a contract file URL with error handling
 * @param url - The contract file URL to open
 * @param onError - Optional callback for error handling
 */
export async function openContractFile(url: string | null | undefined, onError?: (error: string) => void): Promise<void> {
  if (!url) {
    const errorMsg = 'Contract file not available';
    onError?.(errorMsg);
    return;
  }

  try {
    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      const errorMsg = 'Invalid contract file URL. Please check the file link.';
      onError?.(errorMsg);
      return;
    }

    // Log the URL for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('Attempting to open contract file:', url);
      console.log('URL path:', parsedUrl.pathname);
      console.log('Full URL:', parsedUrl.href);
    }

    // Check if URL points to Supabase Storage
    const isSupabaseStorage = parsedUrl.hostname.includes('supabase.co') && parsedUrl.pathname.includes('/storage/v1/object/public/');
    
    if (!isSupabaseStorage) {
      // If it's not a Supabase storage URL, just try to open it directly
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        const errorMsg = 'Failed to open contract file. Please check if pop-ups are blocked and try again.';
        onError?.(errorMsg);
        return;
      }
      return;
    }

    // Verify bucket name matches expected bucket
    const urlBucketName = extractBucketNameFromUrl(url);
    if (urlBucketName && urlBucketName !== CREATOR_ASSETS_BUCKET) {
      if (import.meta.env.DEV) {
        console.warn(`Bucket name mismatch: URL has "${urlBucketName}" but expected "${CREATOR_ASSETS_BUCKET}"`);
      }
      // Still try to open it - might be a valid bucket name
    }

    // Check if the file exists and handle storage bucket errors
    // First try HEAD request (lightweight), then GET if needed to read error details
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      // Try HEAD first with CORS mode
      let response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      // If HEAD failed or returned 404/400, try GET to read error details
      if (!response || response.status === 404 || response.status === 400) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 3000);
        
        response = await fetch(url, { 
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          signal: getController.signal,
        }).catch((fetchError) => {
          clearTimeout(getTimeoutId);
          if (fetchError.name === 'AbortError') {
            return null; // Timeout
          }
          return null;
        });

        clearTimeout(getTimeoutId);
      }

      // Handle error responses (400, 404, etc.)
      if (response && !response.ok) {
        // Try to read error details
        if (response.status === 400 || response.status === 404) {
          try {
            // Try to read the error response (only if it's a GET response)
            if (response.body) {
              const errorText = await response.text();
              if (errorText) {
                try {
                  const errorData = JSON.parse(errorText);
                  
                  // Check for bucket-related errors
                  if (errorData && (errorData.error === 'Bucket not found' || errorData.message === 'Bucket not found')) {
                    // Extract bucket name from URL for better error message
                    const bucketMatch = parsedUrl.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\//);
                    const bucketName = bucketMatch ? bucketMatch[1] : 'unknown';
                    const errorMsg = `Storage bucket "${bucketName}" not found or not accessible. Please verify the bucket exists and is configured correctly in Supabase Storage.`;
                    if (import.meta.env.DEV) {
                      console.error('Bucket error details:', { bucketName, url, errorData });
                    }
                    onError?.(errorMsg);
                    return;
                  }
                  
                  // Handle 400 Bad Request errors with more context
                  if (response.status === 400) {
                    const errorMsg = errorData.message || errorData.error || `Invalid file URL or file path. The contract file may have been moved or deleted. (URL: ${parsedUrl.pathname})`;
                    if (import.meta.env.DEV) {
                      console.error('400 error details:', { url, pathname: parsedUrl.pathname, errorData });
                    }
                    onError?.(errorMsg);
                    return;
                  }
                  
                  // Handle 404 Not Found
                  if (response.status === 404) {
                    const errorMsg = `Contract file not found at the specified path. The file may have been deleted or moved. (Path: ${parsedUrl.pathname})`;
                    if (import.meta.env.DEV) {
                      console.error('404 error details:', { url, pathname: parsedUrl.pathname, errorData });
                    }
                    onError?.(errorMsg);
                    return;
                  }
                } catch {
                  // Not JSON, provide generic error
                  if (response.status === 400) {
                    const errorMsg = `Invalid file URL. The contract file path may be incorrect or the file may have been moved. (Path: ${parsedUrl.pathname})`;
                    if (import.meta.env.DEV) {
                      console.error('400 error (non-JSON):', { url, pathname: parsedUrl.pathname, status: response.status });
                    }
                    onError?.(errorMsg);
                    return;
                  }
                }
              } else {
                // Empty response body
                if (response.status === 400) {
                  const errorMsg = `Bad request (400). The contract file URL may be malformed or the file path is incorrect. (Path: ${parsedUrl.pathname})`;
                  if (import.meta.env.DEV) {
                    console.error('400 error (empty body):', { url, pathname: parsedUrl.pathname });
                  }
                  onError?.(errorMsg);
                  return;
                }
              }
            }
          } catch (readError) {
            // Can't read error response, provide generic error
            if (response.status === 400) {
              const errorMsg = `Bad request (400). Unable to access the contract file. Please check the file URL. (Path: ${parsedUrl.pathname})`;
              if (import.meta.env.DEV) {
                console.error('400 error (read failed):', { url, pathname: parsedUrl.pathname, readError });
              }
              onError?.(errorMsg);
              return;
            }
          }
        }
      }
    } catch (fetchError) {
      // Fetch failed - might be CORS or network issue
      // We'll still try to open the file directly
    }

    // Open the file - if it doesn't exist or there's an issue, the browser will handle it
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const errorMsg = 'Failed to open contract file. Please check if pop-ups are blocked and try again.';
      onError?.(errorMsg);
      return;
    }
  } catch (error) {
    const errorMsg = error instanceof Error 
      ? `Failed to open contract file: ${error.message}`
      : 'Failed to open contract file. Please check your connection and try again.';
    onError?.(errorMsg);
  }
}
