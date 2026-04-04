// Utilities for non-technical creators: clean inputs and generate ready-to-send messages.

export function normalizeInstagramHandle(input: string): string {
  const raw = String(input || '').trim();
  if (!raw) return '';

  // Accept pasted links like https://instagram.com/<handle> or https://www.instagram.com/<handle>/...
  const urlMatch = raw.match(/instagram\.com\/([^/?#]+)/i);
  const candidate = (urlMatch?.[1] ? urlMatch[1] : raw)
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();

  // Instagram usernames: letters, numbers, periods, underscores (1-30 chars).
  // We keep it permissive but strip invalid characters.
  return candidate.replace(/[^a-z0-9._]/g, '').slice(0, 30);
}

export function normalizePublicLink(input: string): string {
  const raw = String(input || '').trim();
  if (!raw) return '';

  // If user pastes without protocol (e.g. "instagram.com/xyz"), add https://
  if (!/^https?:\/\//i.test(raw) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(raw)) {
    return `https://${raw}`;
  }
  return raw;
}

export function buildCreatorDmMessage(opts: {
  creatorName?: string;
  collabUrl: string;
}): string {
  const collabUrl = normalizePublicLink(opts.collabUrl);
  const creatorName = (opts.creatorName || '').trim();

  // Casual, copy-paste friendly, works in WhatsApp + Instagram DM.
  return [
    'Hey! Here\'s my collab page with rates & details 👇',
    collabUrl,
  ].join('\n');
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

