/**
 * API utility functions for timeout handling and error management
 */

/**
 * Resolve API base URL: use VITE_API_URL when set, otherwise infer from host (production) or fallback to 127.0.0.1.
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
    let useLocalApi = false;
    let tunnelUrl: string | null = null;
    try {
      useLocalApi = localStorage.getItem('useLocalApi') === 'true' || urlParams.get('localApi') === 'true';
      tunnelUrl = urlParams.get('tunnelUrl') || localStorage.getItem('tunnelUrl');
    } catch { /* private browsing / storage disabled */ }

    const isActuallyLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (useLocalApi && tunnelUrl && isActuallyLocal) {
      apiUrl = tunnelUrl.replace(/\/$/, '');
    } else if (window.location.origin) {
      const origin = window.location.origin;

      // Check if we are on a production-like environment (Vercel, custom domain, etc.)
      // For unified deployments (where frontend and API share the same domain),
      // returning an empty string allows for relative fetches like "/api/..."
      // which is more robust than hardcoding a domain that might change or have CORS issues.
      const isProduction =
        origin.includes('creatorarmour.com') ||
        origin.includes('creatorarmour.com') ||
        origin.includes('vercel.app') ||
        origin.includes('netlify.app') ||
        origin.includes('trycloudflare.com');

      const isLocalhost =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      // Check for local network IPs (192.168.x.x, 172.16-31.x.x, 10.x.x.x)
      const isLocalNetwork =
        /^http:\/\/(192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|10\.)/.test(origin);

        // Ensure we don't force localhost on public domains even if localStorage was tampered with.
      if (isProduction) {
        // Production: use the Render backend
        apiUrl = 'https://creatorarmour-api.onrender.com';
      } else if (isLocalhost) {
        // Localhost default: prefer local API for developer experience.
        // To force production API, set localStorage.useProdApi = 'true' (or ?prodApi=true).
        let useProdApi = false;
        try { useProdApi = localStorage.getItem('useProdApi') === 'true'; } catch { /* ignore */ }
        useProdApi = useProdApi || urlParams.get('prodApi') === 'true';
        apiUrl = useProdApi ? 'https://ruled-qty-brad-examination.trycloudflare.com' : 'http://127.0.0.1:3001';
      } else if (isLocalNetwork) {
        // Use the same IP but port 3001 for the API
        apiUrl = origin.replace(/:\d+$/, '') + ':3001';
      } else {
        // Fallback for tunnels or other cases
        apiUrl = 'http://127.0.0.1:3001';
      }
    }
  }

  // Fallback for non-browser environments
  if (apiUrl === undefined) apiUrl = 'http://127.0.0.1:3001';

  // Cleanup: No trailing slashes
  let cleanedUrl = (apiUrl || '').replace(/\/$/, '');

  // Local dev safety: On this machine, localhost:3001 can resolve/flap differently from 127.0.0.1:3001.
  // We prefer 127.0.0.1 for stability, but ONLY if we are not already on a 'localhost' hostname
  // to avoid cross-origin IPv4/IPv6 mismatch issues.
  if (typeof window !== 'undefined' && localhostPattern.test(cleanedUrl)) {
    try {
      const parsed = new URL(cleanedUrl);
      if (parsed.hostname === 'localhost' && window.location.hostname !== 'localhost') {
        parsed.hostname = '127.0.0.1';
        cleanedUrl = parsed.toString().replace(/\/$/, '');
      }
    } catch {
      // Ignore invalid URL parsing and keep the original cleanedUrl.
    }
  }

  // Production safety: never point to localhost or same-origin frontend routes
  // when the app is on a public domain. The production frontend and backend are
  // deployed separately, so same-origin `/api/...` may not exist for all routes.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    const isPublicHost =
      host.endsWith('creatorarmour.com') ||
      host.endsWith('creatorarmour.com') ||
      host.endsWith('vercel.app') ||
      host.endsWith('netlify.app') ||
      host.endsWith('trycloudflare.com');

    if (isPublicHost) {
      const origin = window.location.origin.replace(/\/$/, '');
      const pointsToFrontendOrigin =
        cleanedUrl === '' ||
        cleanedUrl === '/' ||
        cleanedUrl === '/api' ||
        cleanedUrl === origin;

      if (localhostPattern.test(cleanedUrl) || pointsToFrontendOrigin) {
        // Never allow localhost or same-origin API on public frontend hosts.
        // Route directly to production API domain.
        cleanedUrl = 'https://creatorarmour-api.onrender.com';
      }
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

/** Common error shape for type-safe error handling */
interface ErrorLike {
  message?: string;
  name?: string;
  status?: number;
  statusCode?: number;
  code?: string | number;
}

function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null;
}

function getErrorMessage_(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isErrorLike(error) && typeof error.message === 'string') return error.message;
  return String(error);
}

/**
 * Check if error is a timeout error
 */
export const isTimeoutError = (error: unknown): boolean => {
  if (!error) return false;
  const errorMessage = getErrorMessage_(error).toLowerCase();
  const name = isErrorLike(error) ? error.name : '';
  return (
    name === 'AbortError' ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('aborted')
  );
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  const errorMessage = getErrorMessage_(error).toLowerCase();
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
export const isServerError = (error: unknown): boolean => {
  if (!error || !isErrorLike(error)) return false;
  const status = error.status || error.statusCode || (typeof error.code === 'number' ? error.code : undefined);
  return typeof status === 'number' && status >= 500 && status < 600;
};

/**
 * Check if error indicates maintenance mode (503)
 */
export const isMaintenanceError = (error: unknown): boolean => {
  if (!error || !isErrorLike(error)) return false;
  const status = error.status || error.statusCode || (typeof error.code === 'number' ? error.code : undefined);
  return status === 503;
};

/**
 * Get user-friendly error message from error object
 */
export const getErrorMessage = (error: unknown, defaultMessage: string = 'An unexpected error occurred'): string => {
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
  const msg = getErrorMessage_(error);
  if (msg && msg !== '[object Object]') {
    return msg;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
};
