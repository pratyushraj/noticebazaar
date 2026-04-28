/**
 * Shared image utility functions.
 */

/**
 * Normalizes and proxies image URLs to avoid 403 errors and reduce bandwidth.
 * Uses wsrv.nl as a reliable, high-performance image proxy.
 */
export const optimizeImage = (src?: string | null, options: { width?: number; height?: number; quality?: number; fit?: 'cover' | 'contain' | 'inside' } = {}): string | undefined => {
  const raw = String(src || "").trim();
  if (!raw || raw === "undefined" || raw === "null") return undefined;

  // Defaults
  const { width = 400, quality = 70, fit = 'cover' } = options;

  // If already proxied, return as is
  if (/wsrv\.nl/i.test(raw)) return raw;

  // 1. Unsplash Optimization (native)
  if (raw.includes('images.unsplash.com')) {
    const base = raw.split('?')[0];
    return `${base}?w=${width}&q=${quality}&fit=crop&auto=format`;
  }

  // 2. Supabase Storage / Instagram / External Optimization (via wsrv.nl)
  // This is CRITICAL for saving Egress costs on Supabase Free Plan
  if (
    /supabase\.co\/storage\/v1\/object\/public/i.test(raw) || // Supabase public buckets
    /cdninstagram\.com|fbcdn\.net/i.test(raw) ||             // Social CDNs (bypasses 403s)
    raw.includes('dicebear.com')                              // Avatars
  ) {
    const params = [`url=${encodeURIComponent(raw)}`, `w=${width}`, `q=${quality}`, `output=webp`].filter(Boolean);
    if (options.height) params.push(`h=${options.height}`);
    params.push(`fit=${fit}`);
    
    return `https://wsrv.nl/?${params.join('&')}`;
  }
  
  // Also handle relative paths or already proxied paths
  if (raw.startsWith('http')) return raw;
  
  return undefined;
};

/** @deprecated Use optimizeImage instead */
export const safeAvatarSrc = (src?: string | null): string | undefined => {
  return optimizeImage(src, { width: 300, height: 300, fit: 'cover' });
};

export const withCacheBuster = (src?: string | null, cacheKey?: string | number | null): string | undefined => {
  const base = optimizeImage(src);
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
