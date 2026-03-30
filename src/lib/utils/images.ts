/**
 * Optimize Unsplash image URLs with width/format/quality params.
 * Reduces payload by 60-80% without visible quality loss.
 */
export function optimizeUnsplash(url: string, width = 400): string {
  if (!url.includes('images.unsplash.com')) return url;
  // Remove existing params, add optimized ones
  const base = url.split('?')[0];
  return `${base}?w=${width}&fit=crop&auto=format&q=80`;
}
