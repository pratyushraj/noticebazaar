/**
 * Tax extraction and analysis utilities
 * Extracts GST, TDS, and tax-related information from contract text
 */

export interface TaxInfo {
  gstFound: boolean;
  gstRate: number | null;
  gstIncluded: boolean | null; // true = inclusive, false = exclusive, null = not specified
  tdsFound: boolean;
  tdsRate: number | null;
  taxClarity: 'clear' | 'missing' | 'unclear';
  afterDeduction: boolean; // "after deduction" wording found
  riskScore: number; // Risk score impact (-25 to +10)
}

/**
 * Extract tax information from contract text
 */
export function extractTaxInfo(contractText: string): TaxInfo {
  const text = contractText || '';
  const lowerText = text.toLowerCase();

  let gstFound = false;
  let gstRate: number | null = null;
  let gstIncluded: boolean | null = null;
  let tdsFound = false;
  let tdsRate: number | null = null;
  let afterDeduction = false;

  // GST Keywords and patterns
  const gstPatterns = [
    /\bgst\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
    /goods\s+and\s+services\s+tax\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
    /(\d+(?:\.\d+)?)\s*%\s*(?:gst|goods\s+and\s+services\s+tax)/gi,
    /\bcgst\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
    /\bsgst\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
    /\bigst\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
  ];

  // TDS Keywords and patterns
  const tdsPatterns = [
    /\btds\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
    /tax\s+deducted\s+at\s+source\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
    /(\d+(?:\.\d+)?)\s*%\s*(?:tds|tax\s+deducted\s+at\s+source)/gi,
    /section\s+194[jc]\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
    /withholding\s+tax\s*(?:@|of|is|:)?\s*(\d+(?:\.\d+)?)\s*%/gi,
  ];

  // Check for GST
  for (const pattern of gstPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      gstFound = true;
      // Extract the first valid rate
      for (const match of matches) {
        const rate = parseFloat(match[1] || match[0].match(/\d+(?:\.\d+)?/)?.[0] || '');
        if (rate && rate > 0 && rate <= 100) {
          gstRate = rate;
          break;
        }
      }
    }
  }

  // Check for TDS
  for (const pattern of tdsPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      tdsFound = true;
      // Extract the first valid rate
      for (const match of matches) {
        const rate = parseFloat(match[1] || match[0].match(/\d+(?:\.\d+)?/)?.[0] || '');
        if (rate && rate > 0 && rate <= 100) {
          tdsRate = rate;
          break;
        }
      }
    }
  }

  // Check for GST inclusive/exclusive wording
  if (gstFound) {
    if (/\binclusive\s+(?:of\s+)?gst|gst\s+inclusive|including\s+gst/gi.test(text)) {
      gstIncluded = true;
    } else if (/\bexclusive\s+(?:of\s+)?gst|gst\s+exclusive|excluding\s+gst|gst\s+extra/gi.test(text)) {
      gstIncluded = false;
    }
  }

  // Check for "after deduction" wording
  if (/\bafter\s+deduction|deducted\s+from|deduction\s+of|net\s+of\s+tax/gi.test(text)) {
    afterDeduction = true;
  }

  // Determine tax clarity
  let taxClarity: 'clear' | 'missing' | 'unclear' = 'missing';
  if (gstFound && gstRate && tdsFound && tdsRate) {
    taxClarity = 'clear';
  } else if ((gstFound && gstRate) || (tdsFound && tdsRate)) {
    taxClarity = 'clear'; // At least one is clear
  } else if (gstFound || tdsFound || afterDeduction) {
    taxClarity = 'unclear'; // Mentioned but rates missing
  }

  // Calculate risk score impact
  let riskScore = 0;
  if (taxClarity === 'missing') {
    riskScore = 10; // No tax info
  } else if (afterDeduction && !tdsRate) {
    riskScore = 25; // "After deduction" but no TDS rate
  } else if (taxClarity === 'unclear') {
    riskScore = 15; // Tax mentioned but unclear
  } else if (taxClarity === 'clear' && gstRate && tdsRate) {
    riskScore = -10; // Both GST and TDS well defined (reduces risk)
  }

  return {
    gstFound,
    gstRate,
    gstIncluded,
    tdsFound,
    tdsRate,
    taxClarity,
    afterDeduction,
    riskScore,
  };
}

/**
 * Calculate final amount after GST and TDS
 */
export function calculateFinalAmount(
  baseAmount: number,
  gstRate: number | null,
  gstIncluded: boolean | null,
  tdsRate: number | null
): {
  finalAmount: number;
  gstAmount: number;
  tdsAmount: number;
  breakdown: string;
} {
  let amount = baseAmount;
  let gstAmount = 0;
  let tdsAmount = 0;

  // Calculate GST
  if (gstRate) {
    if (gstIncluded === true) {
      // GST is included in the base amount
      gstAmount = (amount * gstRate) / (100 + gstRate);
      amount = amount - gstAmount; // Net amount without GST
    } else if (gstIncluded === false) {
      // GST is extra on top
      gstAmount = (amount * gstRate) / 100;
      amount = amount + gstAmount; // Amount with GST added
    } else {
      // GST status unknown, assume exclusive
      gstAmount = (amount * gstRate) / 100;
      amount = amount + gstAmount;
    }
  }

  // Calculate TDS (always deducted from final amount)
  if (tdsRate) {
    tdsAmount = (amount * tdsRate) / 100;
    amount = amount - tdsAmount;
  }

  const breakdown = [
    `Base: ₹${baseAmount.toLocaleString('en-IN')}`,
    gstRate ? `GST ${gstRate}%: ₹${gstAmount.toLocaleString('en-IN')}` : null,
    tdsRate ? `TDS ${tdsRate}%: ₹${tdsAmount.toLocaleString('en-IN')}` : null,
    `Final: ₹${amount.toLocaleString('en-IN')}`,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    finalAmount: amount,
    gstAmount,
    tdsAmount,
    breakdown,
  };
}

/**
 * Generate tax display message based on tax info
 */
export function getTaxDisplayMessage(taxInfo: TaxInfo): {
  message: string;
  riskLevel: 'low' | 'medium' | 'high';
} {
  const { gstFound, gstRate, gstIncluded, tdsFound, tdsRate, afterDeduction, taxClarity } = taxInfo;

  // Case D: Both GST and TDS found with rates
  if (gstRate && tdsRate) {
    const gstText = gstIncluded === true ? 'GST Included' : `${gstRate}% GST`;
    return {
      message: `${gstText} • ${tdsRate}% TDS`,
      riskLevel: 'low',
    };
  }

  // Case E: GST included wording found
  if (gstIncluded === true && tdsRate) {
    return {
      message: `GST Included • ${tdsRate}% TDS`,
      riskLevel: 'low',
    };
  }

  // Case: Only GST found with rate
  if (gstRate && !tdsFound) {
    const gstText = gstIncluded === true ? 'GST Included' : `${gstRate}% GST`;
    return {
      message: gstText,
      riskLevel: 'medium',
    };
  }

  // Case: Only TDS found with rate
  if (tdsRate && !gstFound) {
    return {
      message: `${tdsRate}% TDS`,
      riskLevel: 'medium',
    };
  }

  // Case B: "After deduction" but no TDS rate
  if (afterDeduction && !tdsRate) {
    return {
      message: 'TDS May Apply — % Not Specified',
      riskLevel: 'high',
    };
  }

  // Case C: Invoice required but tax missing
  if (taxClarity === 'unclear' && (gstFound || tdsFound)) {
    if (gstFound && !gstRate) {
      return {
        message: 'GST Applicable — Rate Missing',
        riskLevel: 'medium',
      };
    }
    if (tdsFound && !tdsRate) {
      return {
        message: 'TDS May Apply — % Not Specified',
        riskLevel: 'high',
      };
    }
  }

  // Case A: No tax info at all
  return {
    message: 'Not Mentioned — Confirm with brand',
    riskLevel: 'medium',
  };
}

