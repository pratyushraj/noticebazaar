/**
 * Shared validation helpers for creatorarmour.
 * Keep rules simple — Indian creator context, clear error messages.
 */

// ─── Email ──────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateEmail(email: string | null | undefined): string | null {
  if (!email || !email.trim()) return null; // optional field — use validateRequiredEmail for mandatory
  return isValidEmail(email) ? null : 'Please enter a valid email address (e.g. name@example.com)';
}

export function validateRequiredEmail(email: string | null | undefined): string | null {
  if (!email || !email.trim()) return 'Email is required';
  return isValidEmail(email) ? null : 'Please enter a valid email address (e.g. name@example.com)';
}

// ─── Phone (Indian mobile) ──────────────────────────────────────────────────
// Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX (10 digits)
const PHONE_RE = /^(\+91|91|0)?[6-9]\d{9}$/;

export function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(phone.replace(/[\s\-()]/g, ''));
}

export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone || !phone.trim()) return null; // optional
  return isValidPhone(phone) ? null : 'Please enter a valid Indian mobile number (10 digits starting with 6-9)';
}

// ─── Deal Amount ────────────────────────────────────────────────────────────
const MIN_DEAL_AMOUNT = 1;
const MAX_DEAL_AMOUNT = 10_00_00_000; // ₹10 crore — generous ceiling

export function validateDealAmount(amount: number | null | undefined): string | null {
  if (amount === null || amount === undefined || amount === ('' as any)) return 'Deal amount is required';
  const num = Number(amount);
  if (!Number.isFinite(num)) return 'Deal amount must be a number';
  if (num < MIN_DEAL_AMOUNT) return 'Deal amount must be at least ₹1';
  if (num > MAX_DEAL_AMOUNT) return 'Deal amount cannot exceed ₹10 crore';
  if (num !== Math.floor(num * 100) / 100) return 'Deal amount can have at most 2 decimal places';
  return null;
}

// ─── Required fields ────────────────────────────────────────────────────────
export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMaxLength(value: string | null | undefined, max: number, fieldName: string): string | null {
  if (!value) return null;
  return value.length <= max ? null : `${fieldName} must be ${max} characters or less`;
}

// ─── File Upload ────────────────────────────────────────────────────────────
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  documents: ['application/pdf'],
  contracts: ['application/pdf'],
  invoices: ['application/pdf'],
} as const;

export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,    // 5 MB
  document: 10 * 1024 * 1024, // 10 MB
  contract: 10 * 1024 * 1024,
  invoice: 10 * 1024 * 1024,
} as const;

export function validateFile(
  file: File | null | undefined,
  opts: {
    required?: boolean;
    allowedTypes?: readonly string[];
    maxSize?: number;
    label?: string;
  } = {}
): string | null {
  const { required = false, allowedTypes, maxSize, label = 'File' } = opts;

  if (!file) {
    return required ? `${label} is required` : null;
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    const extensions = allowedTypes
      .map(t => {
        if (t === 'application/pdf') return 'PDF';
        if (t.startsWith('image/')) return t.replace('image/', '').toUpperCase();
        return t;
      })
      .join(', ');
    return `${label} must be one of: ${extensions}`;
  }

  if (maxSize && file.size > maxSize) {
    const mb = (maxSize / (1024 * 1024)).toFixed(0);
    return `${label} must be ${mb} MB or smaller`;
  }

  return null;
}

// ─── Composite: validate a new brand deal ───────────────────────────────────
export interface DealValidationInput {
  brand_name?: string | null;
  deal_amount?: number | null;
  brand_email?: string | null;
  brand_phone?: string | null;
  contract_file?: File | null;
  invoice_file?: File | null;
  due_date?: string | null;
  payment_expected_date?: string | null;
}

export function validateNewDeal(input: DealValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const brandNameErr = validateRequired(input.brand_name, 'Brand name');
  if (brandNameErr) errors.brand_name = brandNameErr;

  const amountErr = validateDealAmount(input.deal_amount);
  if (amountErr) errors.deal_amount = amountErr;

  const emailErr = validateEmail(input.brand_email);
  if (emailErr) errors.brand_email = emailErr;

  const phoneErr = validatePhone(input.brand_phone);
  if (phoneErr) errors.brand_phone = phoneErr;

  if (input.contract_file) {
    const fileErr = validateFile(input.contract_file, {
      allowedTypes: [...ALLOWED_FILE_TYPES.contracts],
      maxSize: MAX_FILE_SIZES.contract,
      label: 'Contract file',
    });
    if (fileErr) errors.contract_file = fileErr;
  }

  if (input.invoice_file) {
    const fileErr = validateFile(input.invoice_file, {
      allowedTypes: [...ALLOWED_FILE_TYPES.invoices],
      maxSize: MAX_FILE_SIZES.invoice,
      label: 'Invoice file',
    });
    if (fileErr) errors.invoice_file = fileErr;
  }

  // Due date should not be in the past (allow today)
  if (input.due_date) {
    const dueDate = new Date(input.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      errors.due_date = 'Due date cannot be in the past';
    }
  }

  return errors;
}
