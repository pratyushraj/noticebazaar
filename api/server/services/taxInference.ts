// @ts-nocheck
// Tax Inference Service
// Extracts tax information from contracts/invoices and provides suggestions

import * as pdfjsLib from 'pdfjs-dist';

export interface TaxAnalysis {
  taxStatus: 'mentioned' | 'not_mentioned' | 'ambiguous';
  taxAmount?: number;
  taxPercentage?: number;
  gstin?: string;
  tdsAmount?: number;
  tdsPercentage?: number;
  suggestedTax?: {
    amount: number;
    percentage: number;
    confidence: number;
    breakdown: Array<{ type: string; amount: number; rate: number }>;
  };
  uxHint: string;
  requiresConfirmation: boolean;
}

export async function analyzeTaxFromContract(
  pdfBuffer: Buffer,
  dealAmount: number
): Promise<TaxAnalysis> {
  // Extract text from PDF
  // Set up PDF.js worker with proper error handling
  if (pdfjsLib.GlobalWorkerOptions) {
    try {
      // For Node.js, try to disable worker or use local file
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      } else {
        const pdfjsVersion = pdfjsLib.version || '3.11.174';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
      }
    } catch (error: any) {
      console.warn('[TaxInference] Error setting PDF.js worker:', error.message);
    }
  }
  
  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return analyzeTaxText(fullText, dealAmount);
}

function analyzeTaxText(text: string, dealAmount: number): TaxAnalysis {
  const lowerText = text.toLowerCase();
  
  // Extract GSTIN
  const gstinMatch = text.match(/GSTIN[:\s]*([0-9A-Z]{15})/i);
  const gstin = gstinMatch ? gstinMatch[1] : undefined;

  // Look for explicit tax mentions
  const taxMatches = [
    ...text.matchAll(/(?:tax|gst|cgst|sgst|igst)[:\s]*₹?\s*([\d,]+)/gi),
    ...text.matchAll(/(?:tax|gst)[:\s]*(\d+(?:\.\d+)?)\s*%/gi)
  ];

  // Look for TDS mentions
  const tdsMatches = [
    ...text.matchAll(/tds[:\s]*₹?\s*([\d,]+)/gi),
    ...text.matchAll(/tds[:\s]*(\d+(?:\.\d+)?)\s*%/gi)
  ];

  // Extract tax amounts
  let taxAmount: number | undefined;
  let taxPercentage: number | undefined;
  let tdsAmount: number | undefined;
  let tdsPercentage: number | undefined;

  if (taxMatches.length > 0) {
    const lastMatch = taxMatches[taxMatches.length - 1];
    const value = parseFloat(lastMatch[1].replace(/,/g, ''));
    if (lastMatch[0].includes('%')) {
      taxPercentage = value;
      taxAmount = (dealAmount * value) / 100;
    } else {
      taxAmount = value;
      taxPercentage = (value / dealAmount) * 100;
    }
  }

  if (tdsMatches.length > 0) {
    const lastMatch = tdsMatches[tdsMatches.length - 1];
    const value = parseFloat(lastMatch[1].replace(/,/g, ''));
    if (lastMatch[0].includes('%')) {
      tdsPercentage = value;
      tdsAmount = (dealAmount * value) / 100;
    } else {
      tdsAmount = value;
      tdsPercentage = (value / dealAmount) * 100;
    }
  }

  // Determine tax status
  let taxStatus: TaxAnalysis['taxStatus'] = 'not_mentioned';
  let suggestedTax: TaxAnalysis['suggestedTax'] | undefined;
  let uxHint = '';
  let requiresConfirmation = false;

  if (taxAmount || taxPercentage) {
    taxStatus = 'mentioned';
    uxHint = `Tax: ₹${taxAmount?.toLocaleString('en-IN') || 'N/A'} (${taxPercentage?.toFixed(2) || 'N/A'}%)`;
  } else if (gstin) {
    // GSTIN present but no tax amount - try to infer
    taxStatus = 'ambiguous';
    requiresConfirmation = true;
    
    // Suggest standard GST rates (18% for services, 5% for goods)
    const suggestedRate = lowerText.includes('service') ? 18 : 5;
    const suggestedAmount = (dealAmount * suggestedRate) / 100;
    
    suggestedTax = {
      amount: suggestedAmount,
      percentage: suggestedRate,
      confidence: 0.6,
      breakdown: [
        { type: 'CGST', amount: suggestedAmount / 2, rate: suggestedRate / 2 },
        { type: 'SGST', amount: suggestedAmount / 2, rate: suggestedRate / 2 }
      ]
    };
    
    uxHint = `Tax: Not Mentioned — Suggested ${suggestedRate}% GST (₹${suggestedAmount.toLocaleString('en-IN')})`;
  } else {
    taxStatus = 'not_mentioned';
    requiresConfirmation = true;
    uxHint = 'Tax: Not Mentioned — Confirm with brand';
  }

  return {
    taxStatus,
    taxAmount,
    taxPercentage,
    gstin,
    tdsAmount,
    tdsPercentage,
    suggestedTax,
    uxHint,
    requiresConfirmation
  };
}

export function calculateTaxSuggestion(
  amount: number,
  countryContext: 'IN' = 'IN'
): TaxAnalysis['suggestedTax'] {
  // Default GST suggestion for India
  const gstRate = 18; // Standard GST rate for services
  const gstAmount = (amount * gstRate) / 100;

  return {
    amount: gstAmount,
    percentage: gstRate,
    confidence: 0.7,
    breakdown: [
      { type: 'CGST', amount: gstAmount / 2, rate: 9 },
      { type: 'SGST', amount: gstAmount / 2, rate: 9 }
    ]
  };
}

