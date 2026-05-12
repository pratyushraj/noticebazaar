export function safeRemoveChild(parent: Node | null | undefined, child: Node | null | undefined) {
  if (!parent || !child) return;
  try {
    if (child.parentNode === parent) {
      parent.removeChild(child);
    }
  } catch {
    // Ignore stale DOM removal races during rapid unmounts.
  }
}

/**
 * Decodes HTML entities like &#x1f1ee; back to their original characters/emojis
 * Uses a regex-based approach for reliability across environments.
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return text || '';
  if (!text.includes('&#') && !text.includes('&')) return text;
  
  return text
    .replace(/&#([0-9]{1,7});/g, (match, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch (e) {
        return match;
      }
    })
    .replace(/&#x([0-9a-fA-F]{1,6});/g, (match, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch (e) {
        return match;
      }
    })
    .replace(/&[a-z0-9]+;/gi, (match) => {
      const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' '
      };
      return entities[match.toLowerCase()] || match;
    });
}
