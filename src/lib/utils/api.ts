/**
 * API utility functions for timeout handling and error management
 */

/**
 * Resolve API base URL: use VITE_API_URL when set, otherwise infer from host (production) or fallback to localhost.
 * Call this when making requests so production (creatorarmour.com) uses the correct API host.
 */
export function getApiBaseUrl(): string {
  // Use VITE_API_URL or VITE_API_BASE_URL if explicitly provided
  let apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

  if (!apiUrl && typeof window !== 'undefined') {
    // Check for local testing mode via localStorage or URL parameters
    // This allows developers to test with a local API via tunnel even on production domains
    const urlParams = new URLSearchParams(window.location.search);
    const useLocalApi = localStorage.getItem('useLocalApi') === 'true' || urlParams.get('localApi') === 'true';
    const tunnelUrl = urlParams.get('tunnelUrl') || localStorage.getItem('tunnelUrl');

    if (useLocalApi && tunnelUrl) {
      apiUrl = tunnelUrl.replace(/\/$/, '');
    } else if (window.location.origin) {
      const origin = window.location.origin;

      // Check if we are on a production-like environment (Vercel, custom domain, etc.)
      // For unified deployments (where frontend and API share the same domain),
      // returning an empty string allows for relative fetches like "/api/..."
      // which is more robust than hardcoding a domain that might change or have CORS issues.
      const isProduction =
        origin.includes('creatorarmour.com') ||
        origin.includes('noticebazaar.com') ||
        origin.includes('vercel.app') ||
        origin.includes('netlify.app') ||
        origin.includes('trycloudflare.com');

      const isLocalhost =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      // Check for local network IPs (192.168.x.x, 172.16-31.x.x, 10.x.x.x)
      const isLocalNetwork =
        /^http:\/\/(192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|10\.)/.test(origin);

      if (useLocalApi && !isProduction) {
        // Local debug mode should only force localhost on local/non-production hosts.
        apiUrl = 'http://localhost:3001';
      } else if (isProduction) {
        // Use relative paths for the production API
        apiUrl = '';
      } else if (isLocalhost) {
        // Standard localhost fallback
        apiUrl = 'http://localhost:3001';
      } else if (isLocalNetwork) {
        // Use the same IP but port 3001 for the API
        apiUrl = origin.replace(/:\d+$/, '') + ':3001';
      } else {
        // Fallback for tunnels or other cases
        apiUrl = 'http://localhost:3001';
      }
    }
  }

  // Fallback for non-browser environments
  if (apiUrl === undefined) apiUrl = 'http://localhost:3001';

  // Cleanup: No trailing slashes
  let cleanedUrl = (apiUrl || '').replace(/\/$/, '');

  // Production safety: never point to localhost when the app is on a public domain.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    const isPublicHost =
      host.endsWith('creatorarmour.com') ||
      host.endsWith('noticebazaar.com') ||
      host.endsWith('vercel.app') ||
      host.endsWith('netlify.app') ||
      host.endsWith('trycloudflare.com');

    if (isPublicHost && localhostPattern.test(cleanedUrl)) {
      cleanedUrl = '';
    }
  }

  // CRITICAL SAFETY: Many components in this codebase manually append '/api' to the base URL.
  // (e.g. fetch(`${getApiBaseUrl()}/api/collab-requests`))
  // If the determined base URL already ends with '/api', we must strip it once to prevent 
  // duplicate prefixing (results in /api/api/...) which causes 404s.
  if (cleanedUrl.endsWith('/api')) {
    cleanedUrl = cleanedUrl.substring(0, cleanedUrl.length - 4);
  }

  // Also handle relative path case explicitly
  if (cleanedUrl === '/api') return '';

  return cleanedUrl;
}

export const API_TIMEOUT = 30000; // 30 seconds default timeout
export const UPLOAD_TIMEOUT = 120000; // 2 minutes for file uploads
export const CONTRACT_REVIEW_TIMEOUT = 60000; // 1 minute for contract reviews

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch with timeout support
 * Automatically aborts requests that exceed the timeout duration
 */
export const fetchWithTimeout = async (
  url: string,
  options: FetchWithTimeoutOptions = {},
  timeout: number = API_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout / 1000} seconds. Please try again.`);
    }
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Check if error is a timeout error
 */
export const isTimeoutError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = String(error.message || error).toLowerCase();
  return (
    error.name === 'AbortError' ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('aborted')
  );
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = String(error.message || error).toLowerCase();
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('err_failed') ||
    errorMessage.includes('connection') ||
    !navigator.onLine
  );
};

/**
 * Check if error is a server error (5xx)
 */
export const isServerError = (error: any): boolean => {
  if (!error) return false;
  const status = error.status || error.statusCode || error.code;
  return status >= 500 && status < 600;
};

/**
 * Check if error indicates maintenance mode (503)
 */
export const isMaintenanceError = (error: any): boolean => {
  if (!error) return false;
  const status = error.status || error.statusCode || error.code;
  return status === 503;
};

/**
 * Get user-friendly error message from error object
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'An unexpected error occurred'): string => {
  if (!error) return defaultMessage;

  // Check for timeout
  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }

  // Check for network error
  if (isNetworkError(error)) {
    return 'Network error. Please check your internet connection.';
  }

  // Check for maintenance
  if (isMaintenanceError(error)) {
    return 'Service is temporarily unavailable for maintenance. Please try again later.';
  }

  // Check for server error
  if (isServerError(error)) {
    return 'Server error. Please try again in a moment.';
  }

  // Return error message if available
  if (error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
};
