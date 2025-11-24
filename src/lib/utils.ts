import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export currency utilities
export { formatCurrency, formatIndianCurrency } from './utils/currency';

// Re-export date utilities
export { formatDate, formatDateTime, formatRelativeTime, sortByDueDate } from './utils/date';

// Re-export haptic utilities
export { triggerHaptic, HapticPatterns } from './utils/haptics';

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
    try {
      new URL(url);
    } catch {
      const errorMsg = 'Invalid contract file URL. Please check the file link.';
      onError?.(errorMsg);
      return;
    }

    // Check if the file exists and handle storage bucket errors
    // First try HEAD request (lightweight), then GET if needed to read error details
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      // Try HEAD first
      let response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      // If HEAD failed or returned 404, try GET to read error details
      if (!response || response.status === 404) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 3000);
        
        response = await fetch(url, { 
          method: 'GET',
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

      // If we got a 404 response, check for bucket errors
      if (response && !response.ok && response.status === 404) {
        try {
          // Try to read the error response (only if it's a GET response)
          if (response.body) {
            const errorText = await response.text();
            if (errorText) {
              try {
                const errorData = JSON.parse(errorText);
                if (errorData && (errorData.error === 'Bucket not found' || errorData.message === 'Bucket not found')) {
                  const errorMsg = 'Storage bucket not configured. Please contact support to set up the file storage bucket.';
                  onError?.(errorMsg);
                  return;
                }
              } catch {
                // Not JSON, continue
              }
            }
          }
        } catch {
          // Can't read error response, continue to open
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
