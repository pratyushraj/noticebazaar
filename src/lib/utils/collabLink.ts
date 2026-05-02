export const normalizeCollabHandle = (value: string | null | undefined): string => {
  return String(value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();
};

export const buildCollabLink = (handle: string | null | undefined, origin = window.location.origin): string => {
  const normalized = normalizeCollabHandle(handle);
  return normalized ? `${origin}/${normalized}` : '';
};

