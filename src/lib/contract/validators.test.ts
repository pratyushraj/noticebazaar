import { describe, it, expect } from 'vitest';
import {
  validateCreatorContactInfo,
  validateContractFile,
  validateKeyTerms,
  validateNegotiationRequest,
  validateWhatsAppMessage,
  validateBrandContactInfo,
  isReadyForAnalysis,
  validateAnalysisResults,
} from './validators';
import type { KeyTerms } from './types';

describe('validateCreatorContactInfo', () => {
  it('should fail for empty name', () => {
    const result = validateCreatorContactInfo('', 'test@example.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('name');
  });

  it('should fail for short name', () => {
    const result = validateCreatorContactInfo('A', 'test@example.com');
    expect(result.isValid).toBe(false);
  });

  it('should fail for empty email', () => {
    const result = validateCreatorContactInfo('John Doe', '');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('Email');
  });

  it('should fail for invalid email', () => {
    const result = validateCreatorContactInfo('John Doe', 'invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('valid email');
  });

  it('should fail for invalid phone', () => {
    const result = validateCreatorContactInfo('John Doe', 'test@example.com', '123');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('phone');
  });

  it('should pass for valid name and email', () => {
    const result = validateCreatorContactInfo('John Doe', 'john@example.com');
    expect(result.isValid).toBe(true);
  });

  it('should pass for valid name, email, and phone', () => {
    const result = validateCreatorContactInfo('John Doe', 'john@example.com', '+91 9876543210');
    expect(result.isValid).toBe(true);
  });

  it('should accept phone with dashes', () => {
    const result = validateCreatorContactInfo('John', 'john@example.com', '+1-555-123-4567');
    expect(result.isValid).toBe(true);
  });
});

describe('validateContractFile', () => {
  it('should fail for null file', () => {
    const result = validateContractFile(null as unknown as { name: string; size: number; type: string });
    expect(result.isValid).toBe(false);
  });

  it('should fail for empty name', () => {
    const result = validateContractFile({ name: '', size: 1000, type: 'application/pdf' });
    expect(result.isValid).toBe(false);
  });

  it('should fail for file too large', () => {
    const result = validateContractFile({ name: 'test.pdf', size: 15 * 1024 * 1024, type: 'application/pdf' });
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('exceeds');
  });

  it('should fail for unsupported file type', () => {
    const result = validateContractFile({ name: 'test.exe', size: 1000, type: 'application/octet-stream' });
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('not supported');
  });

  it('should pass for valid PDF', () => {
    const result = validateContractFile({ name: 'contract.pdf', size: 1000, type: 'application/pdf' });
    expect(result.isValid).toBe(true);
  });

  it('should pass for valid DOCX', () => {
    const result = validateContractFile({
      name: 'contract.docx',
      size: 1000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    expect(result.isValid).toBe(true);
  });

  it('should pass for image files', () => {
    const result = validateContractFile({ name: 'scan.jpg', size: 1000, type: 'image/jpeg' });
    expect(result.isValid).toBe(true);
  });

  it('should accept file by extension even with unknown MIME type', () => {
    const result = validateContractFile({ name: 'contract.pdf', size: 1000, type: '' });
    expect(result.isValid).toBe(true);
  });
});

describe('validateKeyTerms', () => {
  it('should fail for null input', () => {
    const result = validateKeyTerms(null);
    expect(result.isValid).toBe(false);
    expect(result.missingTerms).toContain('All terms');
  });

  it('should fail for undefined input', () => {
    const result = validateKeyTerms(undefined);
    expect(result.isValid).toBe(false);
  });

  it('should fail for missing critical terms', () => {
    const keyTerms: KeyTerms = {};
    const result = validateKeyTerms(keyTerms);
    expect(result.isValid).toBe(false);
    expect(result.missingTerms).toContain('dealValue');
    expect(result.missingTerms).toContain('paymentTerms');
    expect(result.missingTerms).toContain('deliverables');
  });

  it('should pass when critical terms are present', () => {
    const keyTerms: KeyTerms = {
      dealValue: '₹1,00,000',
      paymentTerms: 'Net 30',
      deliverables: '2 Reels'
    };
    const result = validateKeyTerms(keyTerms);
    expect(result.isValid).toBe(true);
  });

  it('should warn about exclusivity clause', () => {
    const keyTerms: KeyTerms = {
      dealValue: '₹1,00,000',
      paymentTerms: 'Net 30',
      deliverables: '2 Reels',
      exclusivity: 'Exclusive partnership'
    };
    const result = validateKeyTerms(keyTerms);
    expect(result.warnings.some(w => w.toLowerCase().includes('exclusivity'))).toBe(true);
  });

  it('should warn about perpetual usage rights', () => {
    const keyTerms: KeyTerms = {
      dealValue: '₹1,00,000',
      paymentTerms: 'Net 30',
      deliverables: '2 Reels',
      usageRights: 'Perpetual license'
    };
    const result = validateKeyTerms(keyTerms);
    expect(result.warnings.some(w => w.toLowerCase().includes('perpetual'))).toBe(true);
  });

  it('should identify missing recommended terms', () => {
    const keyTerms: KeyTerms = {
      dealValue: '₹1,00,000',
      paymentTerms: 'Net 30',
      deliverables: '2 Reels'
    };
    const result = validateKeyTerms(keyTerms);
    expect(result.missingTerms).toContain('usageRights');
    expect(result.missingTerms).toContain('exclusivity');
    expect(result.missingTerms).toContain('termination');
  });
});

describe('validateNegotiationRequest', () => {
  it('should fail for empty changes', () => {
    const result = validateNegotiationRequest([], 'I need better terms');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('change');
  });

  it('should fail for short reason', () => {
    const result = validateNegotiationRequest(['Payment'], 'Too short');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('10 characters');
  });

  it('should fail for too long reason', () => {
    const longReason = 'a'.repeat(1001);
    const result = validateNegotiationRequest(['Payment'], longReason);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('1000 characters');
  });

  it('should pass for valid request', () => {
    const result = validateNegotiationRequest(['Payment', 'Exclusivity'], 'I would like to negotiate better payment terms and reduce exclusivity scope.');
    expect(result.isValid).toBe(true);
  });
});

describe('validateWhatsAppMessage', () => {
  it('should fail for empty message', () => {
    const result = validateWhatsAppMessage('');
    expect(result.isValid).toBe(false);
  });

  it('should fail for whitespace-only message', () => {
    const result = validateWhatsAppMessage('   ');
    expect(result.isValid).toBe(false);
  });

  it('should fail for message exceeding limit', () => {
    const longMessage = 'a'.repeat(5000);
    const result = validateWhatsAppMessage(longMessage);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('exceeds');
  });

  it('should fail for invalid characters', () => {
    const result = validateWhatsAppMessage('Hello\x00World');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('invalid characters');
  });

  it('should pass for valid message', () => {
    const result = validateWhatsAppMessage('Hello, I would like to discuss the contract terms.');
    expect(result.isValid).toBe(true);
  });

  it('should respect custom max length', () => {
    const result = validateWhatsAppMessage('a'.repeat(600), 500);
    expect(result.isValid).toBe(false);
  });
});

describe('validateBrandContactInfo', () => {
  it('should fail for empty brand name', () => {
    const result = validateBrandContactInfo('', 'brand@example.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('brand');
  });

  it('should fail for short brand name', () => {
    const result = validateBrandContactInfo('A', 'brand@example.com');
    expect(result.isValid).toBe(false);
  });

  it('should fail for empty brand email', () => {
    const result = validateBrandContactInfo('Brand Co', '');
    expect(result.isValid).toBe(false);
  });

  it('should fail for invalid brand email', () => {
    const result = validateBrandContactInfo('Brand Co', 'invalid');
    expect(result.isValid).toBe(false);
  });

  it('should pass for valid brand info', () => {
    const result = validateBrandContactInfo('Brand Co', 'contact@brand.com');
    expect(result.isValid).toBe(true);
  });

  it('should pass with valid phone', () => {
    const result = validateBrandContactInfo('Brand Co', 'contact@brand.com', '+91 9876543210');
    expect(result.isValid).toBe(true);
  });
});

describe('isReadyForAnalysis', () => {
  it('should fail if file not uploaded', () => {
    const result = isReadyForAnalysis(false, true, true);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('upload');
  });

  it('should fail if creator info invalid', () => {
    const result = isReadyForAnalysis(true, false, true);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('contact information');
  });

  it('should fail if brand info invalid', () => {
    const result = isReadyForAnalysis(true, true, false);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('brand');
  });

  it('should pass if all conditions met', () => {
    const result = isReadyForAnalysis(true, true, true);
    expect(result.isValid).toBe(true);
  });
});

describe('validateAnalysisResults', () => {
  it('should fail for null input', () => {
    const result = validateAnalysisResults(null);
    expect(result.isValid).toBe(false);
    expect(result.hasRiskScore).toBe(false);
    expect(result.hasIssues).toBe(false);
    expect(result.hasKeyTerms).toBe(false);
  });

  it('should fail for non-object input', () => {
    const result = validateAnalysisResults('not an object');
    expect(result.isValid).toBe(false);
  });

  it('should detect valid risk score', () => {
    const result = validateAnalysisResults({ riskScore: 75 });
    expect(result.isValid).toBe(true);
    expect(result.hasRiskScore).toBe(true);
    expect(result.summary).toContain('75');
  });

  it('should reject invalid risk score', () => {
    const result = validateAnalysisResults({ riskScore: -10 });
    expect(result.hasRiskScore).toBe(false);
  });

  it('should reject risk score > 100', () => {
    const result = validateAnalysisResults({ riskScore: 150 });
    expect(result.hasRiskScore).toBe(false);
  });

  it('should detect issues', () => {
    const result = validateAnalysisResults({ issues: [{ title: 'Issue 1' }] });
    expect(result.isValid).toBe(true);
    expect(result.hasIssues).toBe(true);
    expect(result.summary).toContain('1 issues');
  });

  it('should detect key terms', () => {
    const result = validateAnalysisResults({ keyTerms: { dealValue: '₹1,00,000' } });
    expect(result.isValid).toBe(true);
    expect(result.hasKeyTerms).toBe(true);
  });

  it('should provide complete summary', () => {
    const result = validateAnalysisResults({
      riskScore: 50,
      issues: [{ title: 'Issue 1' }, { title: 'Issue 2' }],
      keyTerms: { dealValue: '₹1,00,000' }
    });
    expect(result.summary).toContain('Risk score: 50');
    expect(result.summary).toContain('2 issues');
    expect(result.summary).toContain('Key terms');
  });
});
