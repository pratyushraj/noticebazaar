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

  // If the URL is already proxied, do not wrap it again.
  if (/wsrv\.nl/i.test(raw)) {
    return raw;
  }
  
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

export const withCacheBuster = (src?: string | null, cacheKey?: string | number | null): string | undefined => {
  const base = safeAvatarSrc(src);
  const key = String(cacheKey || '').trim();
  if (!base || !key) return base;

  try {
    const url = new URL(base);
    url.searchParams.set('v', key);
    return url.toString();
  } catch {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}v=${encodeURIComponent(key)}`;
  }
};
