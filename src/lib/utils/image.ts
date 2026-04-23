/**
 * Shared image utility functions.
 */

/**
 * Normalizes and proxies image URLs to avoid 403 errors from CDNs like Instagram.
 * Uses wsrv.nl as a reliable, high-performance image proxy.
 */
export const safeAvatarSrc = (src?: string | null): string | undefined => {
  const raw = String(src || "").trim();
  if (!raw || raw === "undefined" || raw === "null") return undefined;
  
  // Instagram/FB CDN frequently blocks hotlinking (403).
  // Use wsrv.nl proxy to bypass these restrictions.
  if (/cdninstagram\.com|fbcdn\.net/i.test(raw)) {
    // We add some basic dimensions and fit=cover for better performance/quality
    return `https://wsrv.nl/?url=${encodeURIComponent(raw)}&w=300&h=300&fit=cover`;
  }
  
  // Also handle relative paths or already proxied paths
  if (raw.startsWith('http')) return raw;
  
  return undefined;
};
