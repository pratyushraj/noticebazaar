/**
 * UPI ID validation utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Follows NPCI UPI specification for handle format.
 * https://www.npci.org.in/PDF/npci/upi/UPI-Linking-Specs-ver-1.6.pdf
 *
 * UPI ID format: <localPart>@<psp_handle>
 * - localPart: 3–256 chars, alphanumeric + dots + hyphens + underscores
 * - psp_handle: 2–64 chars, alphanumeric + dots + hyphens (no underscore)
 * - Case-insensitive (we normalise to lowercase on save)
 */

// Known Indian PSP handles as of 2025. Used for helpful error messages.
const KNOWN_PSPS = new Set([
  'okaxis', 'okhdfcbank', 'okicici', 'oksbi', 'ybl', 'upi',
  'paytm', 'apl', 'axl', 'fbl', 'hdfcbank', 'icici', 'sbi',
  'aubank', 'idfcbank', 'rbl', 'kotak', 'indus', 'dbs',
  'cub', 'kvb', 'pnb', 'scb', 'barodampay', 'centralbank',
  'cmsidfc', 'mahb', 'dcb', 'federal', 'jkb', 'syndibank',
  'timecosmos', 'pingpay', 'ikwik', 'fam', 'rajgovhdfcbank',
  // wallet-style
  'waaxis', 'wahdfcbank', 'waicici', 'wasbi', 'superpe',
  'postbank', 'mahagram', 'juspay',
]);

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{3,256}@[a-zA-Z0-9.\-]{2,64}$/;

export interface UpiValidationResult {
  valid: boolean;
  normalised: string;       // lowercased trimmed value if valid, else raw
  error: string | null;     // human-readable error, null if valid
  warning: string | null;   // non-blocking caution (unknown PSP, etc.)
  localPart: string | null;
  psp: string | null;
  isKnownPsp: boolean;
}

/**
 * Validates and normalises a UPI ID string.
 * Returns a result object — never throws.
 */
export function validateUpiId(raw: string): UpiValidationResult {
  const trimmed = String(raw || '').trim();
  const lower = trimmed.toLowerCase();

  const blank: UpiValidationResult = {
    valid: false,
    normalised: lower,
    error: null,
    warning: null,
    localPart: null,
    psp: null,
    isKnownPsp: false,
  };

  if (!trimmed) {
    return { ...blank, error: 'UPI ID is required' };
  }

  // Must contain exactly one @
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) {
    return { ...blank, error: 'UPI ID must contain "@" (e.g. yourname@okaxis)' };
  }
  if (atCount > 1) {
    return { ...blank, error: 'UPI ID must contain only one "@"' };
  }

  if (!UPI_REGEX.test(trimmed)) {
    // Give specific guidance
    const [local, psp] = trimmed.split('@');
    if (local.length < 3) {
      return { ...blank, error: 'The part before "@" must be at least 3 characters' };
    }
    if (psp.length < 2) {
      return { ...blank, error: 'The bank handle after "@" must be at least 2 characters' };
    }
    if (/[^a-zA-Z0-9.\-_@]/.test(trimmed)) {
      return { ...blank, error: 'UPI ID contains invalid characters. Only letters, numbers, dots, hyphens, and underscores are allowed.' };
    }
    return { ...blank, error: 'Invalid UPI ID format. Expected: yourname@bankhandle' };
  }

  const [local, psp] = lower.split('@');
  const isKnownPsp = KNOWN_PSPS.has(psp);

  return {
    valid: true,
    normalised: lower,
    error: null,
    warning: isKnownPsp ? null : `"@${psp}" is not a commonly used bank handle. Double-check this is correct.`,
    localPart: local,
    psp,
    isKnownPsp,
  };
}

/**
 * Quick boolean check — useful for form guards.
 */
export function isValidUpiId(raw: string): boolean {
  return validateUpiId(raw).valid;
}

/**
 * Returns a UPI payment deeplink (upi:// scheme).
 * Opening this on a mobile device will launch the user's UPI app and
 * confirm the handle resolves (app will show name registered to that VPA).
 *
 * Amount is set to 0 so no accidental transfer occurs.
 */
export function buildUpiVerificationDeeplink(upiId: string): string {
  const encoded = encodeURIComponent(upiId.toLowerCase().trim());
  return `upi://pay?pa=${encoded}&pn=Creator Armour+UPI+Check&am=0&cu=INR&tn=Verify+UPI`;
}

/**
 * Returns a Google Pay deep-link for verification (alternative to native UPI).
 */
export function buildGpayVerificationUrl(upiId: string): string {
  const encoded = encodeURIComponent(upiId.toLowerCase().trim());
  return `tez://upi/pay?pa=${encoded}&pn=Creator Armour+UPI+Check&am=0&cu=INR`;
}
