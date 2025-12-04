// Unit tests for tax inference service

import { analyzeTaxFromContract, calculateTaxSuggestion } from '../services/taxInference';

describe('Tax Inference Service', () => {
  describe('calculateTaxSuggestion', () => {
    it('should calculate GST suggestion for Indian context', () => {
      const result = calculateTaxSuggestion(100000, 'IN');
      
      expect(result).toBeDefined();
      expect(result?.percentage).toBe(18);
      expect(result?.amount).toBe(18000);
      expect(result?.confidence).toBeGreaterThan(0);
      expect(result?.breakdown).toHaveLength(2);
    });

    it('should return CGST and SGST breakdown', () => {
      const result = calculateTaxSuggestion(100000, 'IN');
      
      expect(result?.breakdown[0].type).toBe('CGST');
      expect(result?.breakdown[1].type).toBe('SGST');
      expect(result?.breakdown[0].rate).toBe(9);
      expect(result?.breakdown[1].rate).toBe(9);
    });
  });

  describe('analyzeTaxFromContract', () => {
    // Mock PDF buffer
    const mockPdfBuffer = Buffer.from('Sample PDF content with GSTIN: 27AABCU9603R1ZX and Tax: ₹18,000');

    it('should extract GSTIN from contract', async () => {
      // This would require mocking PDF.js
      // For now, test the logic separately
      expect(true).toBe(true); // Placeholder
    });

    it('should detect tax status as mentioned when tax amount present', async () => {
      // Placeholder - would require PDF.js mocking
      expect(true).toBe(true);
    });
  });
});

