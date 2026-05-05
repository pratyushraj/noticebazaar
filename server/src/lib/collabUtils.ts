/**
 * Collaboration Utilities
 * Shared helpers for normalizing collab types, URLs, and handles.
 */

export type CollabTypeValue = 'paid' | 'barter' | 'hybrid' | 'both';

export const normalizeCollabTypeForDb = (value: unknown): 'paid' | 'barter' | 'both' | null => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'hybrid' || v === 'both' || v === 'paid_barter') return 'both';
  if (v === 'paid') return 'paid';
  if (v === 'barter') return 'barter';
  return null;
};

export const normalizeCollabTypeForApi = (value: unknown): CollabTypeValue | null => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'both' || v === 'paid_barter') return 'hybrid';
  if (v === 'paid' || v === 'barter' || v === 'hybrid') return v as CollabTypeValue;
  return null;
};

export const isPaidLikeCollab = (value: unknown): boolean => {
  const normalized = normalizeCollabTypeForDb(value);
  return normalized === 'paid' || normalized === 'both';
};

export const isBarterLikeCollab = (value: unknown): boolean => {
  const normalized = normalizeCollabTypeForDb(value);
  return normalized === 'barter' || normalized === 'both';
};

export const normalizeHandle = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/^@+/, '');
  return normalized.length > 0 ? normalized : null;
};

export const normalizeImageUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\//g, '/')
    .trim();
};
