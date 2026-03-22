import { describe, it, expect } from 'vitest';
import {
  getRiskScoreInfo,
  getRiskVerdictLabel,
  sanitizeWhatsAppMessage,
  formatNegotiationMessage,
  getProtectionStatus,
  getProgressGradient,
  formatDate,
  formatCurrency,
  formatFileSize,
  truncateText,
} from './formatters';

describe('getRiskScoreInfo', () => {
  it('should return high risk info for score >= 80', () => {
    const result = getRiskScoreInfo(80);
    expect(result.label).toBe('High Risk');
    expect(result.color).toBe('text-red-500');
    expect(result.bgColor).toBe('bg-red-500/20');
  });

  it('should return high risk info for score 100', () => {
    const result = getRiskScoreInfo(100);
    expect(result.label).toBe('High Risk');
  });

  it('should return moderate risk info for score >= 60 and < 80', () => {
    const result = getRiskScoreInfo(65);
    expect(result.label).toBe('Moderate Risk');
    expect(result.color).toBe('text-orange-500');
  });

  it('should return some concerns for score >= 40 and < 60', () => {
    const result = getRiskScoreInfo(50);
    expect(result.label).toBe('Some Concerns');
    expect(result.color).toBe('text-yellow-500');
  });

  it('should return low risk info for score < 40', () => {
    const result = getRiskScoreInfo(30);
    expect(result.label).toBe('Low Risk');
    expect(result.color).toBe('text-green-500');
  });

  it('should return low risk for score 0', () => {
    const result = getRiskScoreInfo(0);
    expect(result.label).toBe('Low Risk');
  });
});

describe('getRiskVerdictLabel', () => {
  it('should return high risk label', () => {
    expect(getRiskVerdictLabel('high')).toBe('High Risk - Significant concerns detected');
  });

  it('should return medium risk label', () => {
    expect(getRiskVerdictLabel('medium')).toBe('Medium Risk - Some issues need attention');
  });

  it('should return low risk label', () => {
    expect(getRiskVerdictLabel('low')).toBe('Low Risk - Minor or no concerns');
  });

  it('should return critical risk label', () => {
    expect(getRiskVerdictLabel('critical')).toBe('Critical Risk - Do not sign without legal review');
  });

  it('should handle case-insensitive input', () => {
    expect(getRiskVerdictLabel('HIGH')).toBe('High Risk - Significant concerns detected');
  });

  it('should return default label for unknown risk', () => {
    expect(getRiskVerdictLabel('unknown')).toBe('Risk Assessment Pending');
  });

  it('should handle empty string', () => {
    expect(getRiskVerdictLabel('')).toBe('Risk Assessment Pending');
  });
});

describe('sanitizeWhatsAppMessage', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeWhatsAppMessage('')).toBe('');
  });

  it('should remove non-printable characters', () => {
    const input = 'Hello\x00World';
    expect(sanitizeWhatsAppMessage(input)).toBe('Hello World');
  });

  it('should normalize whitespace', () => {
    const input = 'Hello   World';
    expect(sanitizeWhatsAppMessage(input)).toBe('Hello World');
  });

  it('should limit consecutive newlines to 2', () => {
    const input = 'Hello\n\n\n\nWorld';
    expect(sanitizeWhatsAppMessage(input)).toBe('Hello\n\nWorld');
  });

  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    expect(sanitizeWhatsAppMessage(input)).toBe('Hello World');
  });

  it('should preserve valid text', () => {
    const input = 'Hello, this is a valid message!';
    expect(sanitizeWhatsAppMessage(input)).toBe(input);
  });
});

describe('formatNegotiationMessage', () => {
  it('should return empty string for empty input', () => {
    expect(formatNegotiationMessage('')).toBe('');
  });

  it('should add signature if not present', () => {
    const result = formatNegotiationMessage('I would like to discuss payment terms.');
    expect(result).toContain('Best regards');
  });

  it('should not add signature if already present', () => {
    const input = 'Payment terms discussion.\n\nBest regards';
    const result = formatNegotiationMessage(input);
    expect(result.match(/Best regards/g)?.length).toBe(1);
  });

  it('should normalize line breaks', () => {
    const input = 'Hello\r\nWorld';
    const result = formatNegotiationMessage(input);
    expect(result).toBe('Hello\nWorld\n\nLooking forward to your response.\n\nBest regards');
  });

  it('should preserve Thanks signature', () => {
    const input = 'Message here.\n\nThanks!';
    const result = formatNegotiationMessage(input);
    expect(result).not.toContain('Best regards');
  });
});

describe('getProtectionStatus', () => {
  it('should return Protected for progress >= 90', () => {
    const result = getProtectionStatus(90);
    expect(result.status).toBe('Protected');
    expect(result.color).toBe('text-green-500');
  });

  it('should return Mostly Protected for progress >= 70', () => {
    const result = getProtectionStatus(75);
    expect(result.status).toBe('Mostly Protected');
    expect(result.color).toBe('text-blue-500');
  });

  it('should return Partially Protected for progress >= 50', () => {
    const result = getProtectionStatus(60);
    expect(result.status).toBe('Partially Protected');
    expect(result.color).toBe('text-yellow-500');
  });

  it('should return Needs Attention for progress < 50', () => {
    const result = getProtectionStatus(30);
    expect(result.status).toBe('Needs Attention');
    expect(result.color).toBe('text-red-500');
  });

  it('should return Needs Attention for progress 0', () => {
    const result = getProtectionStatus(0);
    expect(result.status).toBe('Needs Attention');
  });
});

describe('getProgressGradient', () => {
  it('should return green gradient for progress >= 80', () => {
    const result = getProgressGradient(80);
    expect(result.from).toBe('from-green-500');
    expect(result.to).toBe('to-emerald-500');
  });

  it('should return blue gradient for progress >= 60', () => {
    const result = getProgressGradient(70);
    expect(result.from).toBe('from-blue-500');
    expect(result.to).toBe('to-cyan-500');
  });

  it('should return yellow gradient for progress >= 40', () => {
    const result = getProgressGradient(50);
    expect(result.from).toBe('from-yellow-500');
    expect(result.to).toBe('to-orange-500');
  });

  it('should return red gradient for progress < 40', () => {
    const result = getProgressGradient(30);
    expect(result.from).toBe('from-red-500');
    expect(result.to).toBe('to-orange-500');
  });
});

describe('formatDate', () => {
  it('should return N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('should return N/A for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('should format ISO date string', () => {
    const result = formatDate('2024-03-15');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('should format Date object', () => {
    const date = new Date(2024, 2, 15);
    const result = formatDate(date);
    expect(result).toMatch(/Mar/);
  });

  it('should return Invalid Date for invalid string', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });
});

describe('formatCurrency', () => {
  it('should return ₹0 for null', () => {
    expect(formatCurrency(null)).toBe('₹0');
  });

  it('should return ₹0 for undefined', () => {
    expect(formatCurrency(undefined)).toBe('₹0');
  });

  it('should format numeric amount', () => {
    const result = formatCurrency(100000);
    expect(result).toContain('₹');
    expect(result).toContain('1,00,000');
  });

  it('should format string amount', () => {
    const result = formatCurrency('₹50,000');
    expect(result).toContain('₹');
    expect(result).toContain('50,000');
  });

  it('should return ₹0 for invalid string', () => {
    expect(formatCurrency('invalid')).toBe('₹0');
  });

  it('should format large amounts with lakhs/crores pattern', () => {
    const result = formatCurrency(10000000); // 1 crore
    expect(result).toContain('₹');
    expect(result).toContain('1,00,00,000');
  });
});

describe('formatFileSize', () => {
  it('should return 0 Bytes for 0', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('should format MB', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('should format GB', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should format with decimal places', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('truncateText', () => {
  it('should return empty string for empty input', () => {
    expect(truncateText('')).toBe('');
  });

  it('should return original text if under max length', () => {
    const text = 'Short text';
    expect(truncateText(text)).toBe(text);
  });

  it('should truncate text and add ellipsis', () => {
    const text = 'This is a very long text that needs to be truncated to fit within the specified limit';
    const result = truncateText(text, 50);
    expect(result.length).toBe(50);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should use default max length of 100', () => {
    const text = 'a'.repeat(150);
    const result = truncateText(text);
    expect(result.length).toBe(100);
  });

  it('should handle null input', () => {
    expect(truncateText(null as unknown as string)).toBe('');
  });
});
