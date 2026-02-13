// Negotiation Power Score Calculator
// Calculates a score (0-100) indicating the creator's negotiation leverage in a brand deal contract
// Higher score = Creator has more leverage
// Lower score = Brand has more leverage

export interface AnalysisData {
  keyTerms?: {
    payment?: string;
    paymentSchedule?: string;
    dealValue?: string;
    duration?: string;
    deliverables?: string;
    exclusivity?: string;
  };
  verified?: Array<{
    category: string;
    title: string;
    description?: string;
  }>;
  issues?: Array<{
    category: string;
    title: string;
    severity: 'high' | 'medium' | 'low' | 'warning';
    description?: string;
  }>;
}

/**
 * Calculate Negotiation Power Score (0-100)
 * Higher score = Creator has more leverage/power
 * Lower score = Brand has more leverage/power
 */
export function calculateNegotiationPowerScore(analysis: AnalysisData): number {
  let score = 50; // Neutral baseline

  // ✅ PAYMENT TERMS (Faster payment = more creator power)
  const paymentText = (analysis.keyTerms?.payment || analysis.keyTerms?.paymentSchedule || '').toLowerCase();
  
  if (paymentText.includes('7 days') || paymentText.includes('10 days') || paymentText.includes('14 days')) {
    score += 10; // Fast payment is creator-friendly
  } else if (paymentText.includes('30 days') || paymentText.includes('net 30')) {
    score += 5; // Standard payment
  } else if (paymentText.includes('45') || paymentText.includes('60') || paymentText.includes('90')) {
    score -= 15; // Delayed payment reduces creator power
  }

  // ✅ IP OWNERSHIP (Creator retaining IP = more power)
  const hasCreatorIP = analysis.verified?.some((v) => 
    v.category?.toLowerCase().includes('ip') || 
    v.category?.toLowerCase().includes('intellectual property') ||
    v.title?.toLowerCase().includes('creator owns') ||
    v.title?.toLowerCase().includes('creator retains')
  );
  
  const hasBrandIPIssue = analysis.issues?.some((i) => 
    i.category?.toLowerCase().includes('ip') || 
    i.category?.toLowerCase().includes('intellectual property') ||
    i.title?.toLowerCase().includes('brand owns') ||
    i.title?.toLowerCase().includes('brand retains')
  );

  if (hasCreatorIP) {
    score += 15; // Creator retaining IP is very powerful
  }
  if (hasBrandIPIssue) {
    score -= 15; // Brand taking IP reduces creator power significantly
  }

  // ✅ TERMINATION (Creator-friendly termination = more power)
  const hasCreatorTermination = analysis.verified?.some((v) => 
    v.category?.toLowerCase().includes('termination') ||
    v.title?.toLowerCase().includes('termination')
  );
  
  const hasTerminationIssue = analysis.issues?.some((i) => 
    i.category?.toLowerCase().includes('termination') ||
    (i.title?.toLowerCase().includes('termination') && i.severity === 'high')
  );

  if (hasCreatorTermination) {
    score += 10; // Favorable termination terms
  }
  if (hasTerminationIssue) {
    score -= 10; // Unfavorable termination reduces power
  }

  // ✅ EXCLUSIVITY (No exclusivity = more creator power)
  const hasExclusivityIssue = analysis.issues?.some((i) => 
    i.category?.toLowerCase().includes('exclusivity') ||
    i.title?.toLowerCase().includes('exclusive') ||
    i.title?.toLowerCase().includes('non-compete')
  );

  if (hasExclusivityIssue) {
    score -= 15; // Exclusivity clauses reduce creator's ability to work with others
  }

  // ✅ DELIVERABLE CLARITY (Clear deliverables = more power)
  const hasDeliverableIssue = analysis.issues?.some((i) => 
    i.category?.toLowerCase().includes('deliverable') ||
    i.title?.toLowerCase().includes('deliverable')
  );

  if (hasDeliverableIssue) {
    score -= 10; // Unclear deliverables create risk
  }

  // ✅ LIABILITY (Limited liability = more power)
  const hasLiabilityIssue = analysis.issues?.some((i) => 
    i.category?.toLowerCase().includes('liability') ||
    i.title?.toLowerCase().includes('liability') ||
    i.title?.toLowerCase().includes('indemnification')
  );

  if (hasLiabilityIssue) {
    score -= 10; // High liability reduces creator power
  }

  // ✅ PAYMENT AMOUNT (Higher payment = more creator power, but this is relative)
  // We don't penalize for low amounts as it's deal-specific

  // ✅ CONTRACT DURATION (Shorter = more creator power)
  const durationText = (analysis.keyTerms?.duration || '').toLowerCase();
  if (durationText.includes('month') || durationText.includes('30 days') || durationText.includes('60 days')) {
    score += 5; // Shorter contracts give more flexibility
  } else if (durationText.includes('year') || durationText.includes('12 month')) {
    score -= 5; // Longer contracts reduce flexibility
  }

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get negotiation power label and description
 */
export function getNegotiationPowerLabel(score: number): {
  label: string;
  description: string;
  emoji: string;
  color: string;
} {
  if (score > 65) {
    return {
      label: 'Creator Dominant Deal',
      description: 'You control this deal',
      emoji: '🟢',
      color: 'text-green-400'
    };
  } else if (score >= 40) {
    return {
      label: 'Balanced Negotiation',
      description: 'Fairly balanced',
      emoji: '🟡',
      color: 'text-yellow-400'
    };
  } else {
    return {
      label: 'Brand Dominates',
      description: 'Brand has the upper hand',
      emoji: '🔴',
      color: 'text-red-400'
    };
  }
}

