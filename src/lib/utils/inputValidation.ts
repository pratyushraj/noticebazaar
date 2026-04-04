/**
 * Comprehensive input validation and sanitization utilities
 * Provides security against XSS, injection attacks, and malformed data
 */

import DOMPurify from 'isomorphic-dompurify';

// Instagram handle validation patterns
const INSTAGRAM_HANDLE_PATTERN = /^[a-zA-Z0-9_.]{1,30}$/;
const INSTAGRAM_URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]{1,30}\/?$/;

// Email validation (RFC 5322 compliant)
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone number patterns (Indian format)
const PHONE_PATTERNS = [
  /^(\+91[\-\s]?)?[6-9]\d{9}$/,  // Indian mobile
  /^(\+91[\-\s]?)?[0-5]\d{9}$/,  // Indian landline
  /^\+?1[\d\s\-\(\)]{10,}$/,      // US/Canada
  /^\+?44[\d\s\-\(\)]{10,}$/,     // UK
];

// URL validation
const URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// GSTIN validation (Indian GST format)
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

// PAN validation (Indian PAN format)
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Aadhaar validation (Indian Aadhaar format)
const AADHAAR_PATTERN = /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/;

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize plain text input
 */
export const sanitizeText = (text: string, options: { maxLength?: number; allowNewlines?: boolean } = {}): string => {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text.trim();

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Handle newlines
  if (!options.allowNewlines) {
    sanitized = sanitized.replace(/[\r\n\t]/g, ' ');
  }

  // Apply length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
};

/**
 * Validate and sanitize Instagram handle
 */
export const validateInstagramHandle = (handle: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!handle || typeof handle !== 'string') {
    return { isValid: false, sanitized: '', error: 'Instagram handle is required' };
  }

  // Remove @ symbol and trim
  let cleanHandle = handle.replace(/^@+/, '').trim().toLowerCase();

  // Check length
  if (cleanHandle.length < 1 || cleanHandle.length > 30) {
    return { isValid: false, sanitized: cleanHandle, error: 'Instagram handle must be 1-30 characters' };
  }

  // Check pattern
  if (!INSTAGRAM_HANDLE_PATTERN.test(cleanHandle)) {
    return { isValid: false, sanitized: cleanHandle, error: 'Instagram handle contains invalid characters' };
  }

  return { isValid: true, sanitized: cleanHandle };
};

/**
 * Validate Instagram URL
 */
export const validateInstagramUrl = (url: string): { isValid: boolean; handle?: string; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Instagram URL is required' };
  }

  const trimmedUrl = url.trim();

  if (!URL_PATTERN.test(trimmedUrl)) {
    return { isValid: false, error: 'Invalid URL format' };
  }

  if (!INSTAGRAM_URL_PATTERN.test(trimmedUrl)) {
    return { isValid: false, error: 'Not a valid Instagram URL' };
  }

  // Extract handle from URL
  const match = trimmedUrl.match(/instagram\.com\/([a-zA-Z0-9_.]{1,30})/);
  const handle = match ? match[1] : undefined;

  return { isValid: true, handle };
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, sanitized: '', error: 'Email is required' };
  }

  const sanitized = email.trim().toLowerCase();

  if (sanitized.length > 254) {
    return { isValid: false, sanitized, error: 'Email is too long' };
  }

  if (!EMAIL_PATTERN.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Invalid email format' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, sanitized: '', error: 'Phone number is required' };
  }

  // Remove all non-digit characters except + for country code
  const sanitized = phone.replace(/[^\d+]/g, '');

  // Check against patterns
  const isValid = PHONE_PATTERNS.some(pattern => pattern.test(sanitized));

  if (!isValid) {
    return { isValid: false, sanitized, error: 'Invalid phone number format' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validate URL
 */
export const validateUrl = (url: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, sanitized: '', error: 'URL is required' };
  }

  const sanitized = url.trim();

  if (sanitized.length > 2048) {
    return { isValid: false, sanitized, error: 'URL is too long' };
  }

  // Add protocol if missing
  let normalizedUrl = sanitized;
  if (!/^https?:\/\//i.test(sanitized)) {
    normalizedUrl = 'https://' + sanitized;
  }

  if (!URL_PATTERN.test(normalizedUrl)) {
    return { isValid: false, sanitized: normalizedUrl, error: 'Invalid URL format' };
  }

  return { isValid: true, sanitized: normalizedUrl };
};

/**
 * Validate GSTIN (Indian GST Number)
 */
export const validateGSTIN = (gstin: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!gstin || typeof gstin !== 'string') {
    return { isValid: false, sanitized: '', error: 'GSTIN is required' };
  }

  const sanitized = gstin.trim().toUpperCase();

  if (!GSTIN_PATTERN.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Invalid GSTIN format' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validate PAN (Indian Permanent Account Number)
 */
export const validatePAN = (pan: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!pan || typeof pan !== 'string') {
    return { isValid: false, sanitized: '', error: 'PAN is required' };
  }

  const sanitized = pan.trim().toUpperCase();

  if (!PAN_PATTERN.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Invalid PAN format' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validate Aadhaar number
 */
export const validateAadhaar = (aadhaar: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!aadhaar || typeof aadhaar !== 'string') {
    return { isValid: false, sanitized: '', error: 'Aadhaar number is required' };
  }

  const sanitized = aadhaar.replace(/[\s\-]/g, '');

  if (!AADHAAR_PATTERN.test(aadhaar)) {
    return { isValid: false, sanitized, error: 'Invalid Aadhaar format (should be 12 digits)' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validate monetary amount
 */
export const validateAmount = (amount: string | number, options: { min?: number; max?: number; currency?: 'INR' | 'USD' } = {}): { isValid: boolean; value: number; error?: string } => {
  const { min = 0, max = 10000000, currency = 'INR' } = options;

  let numValue: number;

  if (typeof amount === 'string') {
    // Remove currency symbols and commas
    const cleanAmount = amount.replace(/[₹$€£¥,\s]/g, '');
    numValue = parseFloat(cleanAmount);

    if (isNaN(numValue)) {
      return { isValid: false, value: 0, error: 'Invalid amount format' };
    }
  } else if (typeof amount === 'number') {
    numValue = amount;
  } else {
    return { isValid: false, value: 0, error: 'Amount must be a number or string' };
  }

  if (numValue < min) {
    return { isValid: false, value: numValue, error: `Amount must be at least ${currency} ${min.toLocaleString()}` };
  }

  if (numValue > max) {
    return { isValid: false, value: numValue, error: `Amount cannot exceed ${currency} ${max.toLocaleString()}` };
  }

  return { isValid: true, value: numValue };
};

/**
 * Validate text length and content
 */
export const validateText = (text: string, options: { minLength?: number; maxLength?: number; required?: boolean; allowHtml?: boolean } = {}): { isValid: boolean; sanitized: string; error?: string } => {
  const { minLength = 0, maxLength = 10000, required = false, allowHtml = false } = options;

  if (required && (!text || typeof text !== 'string' || text.trim().length === 0)) {
    return { isValid: false, sanitized: '', error: 'This field is required' };
  }

  if (!text || typeof text !== 'string') {
    return { isValid: !required, sanitized: '', error: required ? 'This field is required' : undefined };
  }

  let sanitized = allowHtml ? sanitizeHtml(text) : sanitizeText(text, { allowNewlines: true, maxLength });

  if (sanitized.length < minLength) {
    return { isValid: false, sanitized, error: `Text must be at least ${minLength} characters` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, sanitized: sanitized.substring(0, maxLength), error: `Text cannot exceed ${maxLength} characters` };
  }

  return { isValid: true, sanitized };
};

/**
 * Comprehensive form validation helper
 */
export const validateFormField = (fieldName: string, value: any, rules: any): { isValid: boolean; value: any; error?: string } => {
  try {
    switch (fieldName) {
      case 'instagramHandle':
        return validateInstagramHandle(value);

      case 'email':
        return validateEmail(value);

      case 'phone':
        return validatePhoneNumber(value);

      case 'url':
      case 'website':
        return validateUrl(value);

      case 'gstin':
        return validateGSTIN(value);

      case 'pan':
        return validatePAN(value);

      case 'aadhaar':
        return validateAadhaar(value);

      case 'amount':
      case 'budget':
      case 'price':
        return validateAmount(value, rules);

      case 'text':
      case 'description':
      case 'message':
        return validateText(value, rules);

      default:
        // Generic text validation
        return validateText(value, rules);
    }
  } catch (error) {
    return { isValid: false, value, error: 'Validation failed' };
  }
};

/**
 * Rate limiting helper for form submissions
 */
export const createRateLimiter = (maxAttempts: number = 5, windowMs: number = 60000) => {
  const attempts: number[] = [];

  return {
    isAllowed: (): boolean => {
      const now = Date.now();
      // Remove old attempts outside the window
      while (attempts.length > 0 && attempts[0] < now - windowMs) {
        attempts.shift();
      }

      return attempts.length < maxAttempts;
    },

    recordAttempt: (): void => {
      attempts.push(Date.now());
    },

    getRemainingAttempts: (): number => {
      const now = Date.now();
      while (attempts.length > 0 && attempts[0] < now - windowMs) {
        attempts.shift();
      }

      return Math.max(0, maxAttempts - attempts.length);
    },

    getResetTime: (): number => {
      if (attempts.length === 0) return 0;
      return attempts[0] + windowMs;
    }
  };
};

/**
 * CSRF protection helper
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Content Security Policy helper
 */
export const generateCSP = (options: {
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  frameSrc?: string[];
} = {}): string => {
  const {
    scriptSrc = ["'self'"],
    styleSrc = ["'self'", "'unsafe-inline'"],
    imgSrc = ["'self'", 'data:', 'https:'],
    connectSrc = ["'self'"],
    frameSrc = ["'none'"]
  } = options;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`
  ].join('; ');
};