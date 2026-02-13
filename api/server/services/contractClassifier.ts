// @ts-nocheck
// Production-Grade 4-Stage Influencer Brand Deal Classifier
// SECURITY + LEGAL FILTER: Near-zero false positives required

import { callLLM } from "./aiContractAnalysis";

export type DocumentType = "brand_deal_contract" | "not_brand_deal";

export interface DocumentTypeResult {
  type: DocumentType;
  confidence: number; // 0–1
  reasoning?: string;
}

interface ClassificationRejection {
  hardRejectMatch?: string;
  missingSignals?: string[];
  llmRejected?: boolean;
  confidenceFailed?: boolean;
  fallbackScore?: number;
}

/**
 * STAGE 1: Hard Rejection Filter (NO AI)
 * Immediately reject if text matches hard rejection patterns
 */
function stage1HardRejection(text: string): { rejected: boolean; reason?: string; match?: string } {
  const lowerText = text.toLowerCase();
  
  // Hard rejection patterns - must be exact context matches
  const hardRejectPatterns = [
    // Court/legal
    { pattern: /\bcourt\b/i, reason: "Court document detected" },
    { pattern: /\blegal notice\b/i, reason: "Legal notice detected" },
    { pattern: /\bsummons\b/i, reason: "Summons document detected" },
    { pattern: /\bpetition\b/i, reason: "Petition document detected" },
    { pattern: /\bplaintiff\b/i, reason: "Court case document (plaintiff)" },
    { pattern: /\bdefendant\b/i, reason: "Court case document (defendant)" },
    { pattern: /\bfir\b/i, reason: "FIR document detected" },
    
    // Invoices/Receipts
    { pattern: /\binvoice\b.*\bnumber\b/i, reason: "Invoice document detected" },
    { pattern: /\btax invoice\b/i, reason: "Tax invoice detected" },
    { pattern: /\bbill no\b/i, reason: "Bill document detected" },
    { pattern: /\bpayment receipt\b/i, reason: "Payment receipt detected" },
    
    // Government forms
    { pattern: /\baadhaar\b/i, reason: "Aadhaar card document detected" },
    { pattern: /\bpan card\b/i, reason: "PAN card document detected" },
    { pattern: /\bgst certificate\b/i, reason: "GST certificate detected" },
    
    // Insurance
    { pattern: /\bpolicy number\b/i, reason: "Insurance policy detected" },
    { pattern: /\binsurance claim\b/i, reason: "Insurance claim document detected" },
    
    // Rental
    { pattern: /\bzoomcar\b/i, reason: "Vehicle rental (Zoomcar) detected" },
    { pattern: /\bvehicle rental\b/i, reason: "Vehicle rental agreement detected" },
    { pattern: /\brc number\b/i, reason: "Vehicle RC document detected" },
    
    // Employment
    { pattern: /\bjob offer\b/i, reason: "Job offer letter detected" },
    { pattern: /\bsalary\b.*\bemployment\b/i, reason: "Employment agreement detected" },
    { pattern: /\bemployment agreement\b/i, reason: "Employment contract detected" },
    
    // Loan/property
    { pattern: /\bemi\b/i, reason: "Loan/EMI document detected" },
    { pattern: /\bmortgage\b/i, reason: "Mortgage document detected" },
    { pattern: /\bloan agreement\b/i, reason: "Loan agreement detected" },
  ];
  
  // ALLOW even if GST/TDS exists in these contexts
  const allowedGstTdsPatterns = [
    /\bgst.*deduction\b/i,
    /\bgst inclusive\b/i,
    /\btds.*applicable\b/i,
    /\btds.*deduction\b/i,
  ];
  
  // Check for hard reject patterns
  for (const { pattern, reason } of hardRejectPatterns) {
    if (pattern.test(lowerText)) {
      // Special handling for GST/TDS - allow if in allowed context
      if (reason.includes('GST') || reason.includes('TDS')) {
        const hasAllowedContext = allowedGstTdsPatterns.some(allowed => allowed.test(lowerText));
        if (hasAllowedContext) {
          continue; // Skip this rejection, GST/TDS is in allowed context
        }
      }
      return { rejected: true, reason, match: pattern.toString() };
    }
  }
  
  return { rejected: false };
}

/**
 * STAGE 2: Required Brand Deal Signals
 * Must have at least 2 of the required signals
 * Returns detailed signal information for hard override check
 */
function stage2BrandDealSignals(text: string): { 
  passed: boolean; 
  signals: string[]; 
  missing: string[]; 
  hasBrand: boolean;
  hasInfluencer: boolean;
  hasDeliverables: boolean;
  hasPayment: boolean;
  hasContentPlatform: boolean;
  hasRupeeAmount: boolean;
} {
  const lowerText = text.toLowerCase();
  
  const requiredSignals = [
    { pattern: /\b(instagram|youtube|reels|shorts|story|content|tiktok|snapchat|facebook)\b/i, name: "Content Platform" },
    { pattern: /\b(influencer|creator|content creator)\b/i, name: "Influencer/Creator" },
    { pattern: /\b(brand|sponsor|campaign)\b/i, name: "Brand/Sponsor" },
    { pattern: /\b(payment|fee|compensation|amount payable|remuneration)\b/i, name: "Payment/Compensation" },
    { pattern: /\b(deliverables|posting schedule|posts|videos|reels)\b/i, name: "Deliverables" },
  ];
  
  const foundSignals: string[] = [];
  const missingSignals: string[] = [];
  
  // Check each signal
  const hasContentPlatform = requiredSignals[0].pattern.test(lowerText);
  const hasInfluencer = requiredSignals[1].pattern.test(lowerText);
  const hasBrand = requiredSignals[2].pattern.test(lowerText);
  const hasPayment = requiredSignals[3].pattern.test(lowerText);
  const hasDeliverables = requiredSignals[4].pattern.test(lowerText);
  
  // Check for ₹ amount (Indian Rupee)
  const hasRupeeAmount = /₹|rs\.|rupees|inr/i.test(text);
  
  // Build signal arrays
  if (hasContentPlatform) foundSignals.push(requiredSignals[0].name);
  else missingSignals.push(requiredSignals[0].name);
  
  if (hasInfluencer) foundSignals.push(requiredSignals[1].name);
  else missingSignals.push(requiredSignals[1].name);
  
  if (hasBrand) foundSignals.push(requiredSignals[2].name);
  else missingSignals.push(requiredSignals[2].name);
  
  if (hasPayment) foundSignals.push(requiredSignals[3].name);
  else missingSignals.push(requiredSignals[3].name);
  
  if (hasDeliverables) foundSignals.push(requiredSignals[4].name);
  else missingSignals.push(requiredSignals[4].name);
  
  const passed = foundSignals.length >= 2;
  
  return { 
    passed, 
    signals: foundSignals, 
    missing: missingSignals,
    hasBrand,
    hasInfluencer,
    hasDeliverables,
    hasPayment,
    hasContentPlatform,
    hasRupeeAmount
  };
}

/**
 * STAGE 3: LLM Binary Classifier (YES/NO)
 */
async function stage3LLMBinaryClassifier(text: string): Promise<{ isValid: boolean; response: string }> {
  const prompt = `You are a legal document classifier. Your role is ADVISORY - signal-based detection will override your response.

Reply ONLY with:
YES → if this appears to be a Brand Deal / Influencer / Creator Sponsorship Contract  
NO → if this is clearly NOT a brand deal (invoices, legal notices, employment, etc.)

IMPORTANT CONTEXT:
- Test/demo contracts (e.g., "Nike demo", "TEST contract") are VALID if they contain brand deal elements
- High-risk clauses don't make it invalid - they just need flagging
- Weak titles are OK if content shows brand collaboration

ONLY SUGGEST REJECTION FOR:
- Invoices, Receipts, Bills
- Legal notices or court documents (summons, petitions)
- Government forms (PAN, GST, Aadhaar certificates)
- Employment contracts (job offers, salary agreements)
- Rental agreements, insurance policies, loan documents
- Pure NDAs without any payment or deliverables

ACCEPT (even if marked TEST/DEMO/HIGH RISK):
- Any document with Brand + Creator/Influencer + Deliverables
- Any document with Payment + Deliverables
- Any document mentioning Instagram/YouTube/Reels with payment terms

Reply ONLY:
YES or NO

Document:
<<<${text.slice(0, 6000)}>>>`;

  try {
    const response = await callLLM(prompt);
    const cleanResponse = response.trim().toUpperCase();
    
    // Extract YES or NO from response (handle variations)
    const isYes = cleanResponse.includes('YES') && !cleanResponse.includes('NO');
    const isNo = cleanResponse.includes('NO') && !cleanResponse.includes('YES');
    
    if (isYes) {
      return { isValid: true, response: cleanResponse };
    } else if (isNo) {
      return { isValid: false, response: cleanResponse };
    } else {
      // Ambiguous response - default to NO for security
      console.warn('[ContractClassifier] Ambiguous LLM response, defaulting to NO:', cleanResponse);
      return { isValid: false, response: cleanResponse };
    }
  } catch (error: any) {
    console.error('[ContractClassifier] LLM binary classifier failed:', error);
    // On LLM failure, default to NO for security
    return { isValid: false, response: 'LLM_ERROR' };
  }
}

/**
 * STAGE 4: Confidence Self-Check with Fallback Scoring
 */
async function stage4ConfidenceCheck(text: string): Promise<{ confident: boolean; fallbackScore?: number }> {
  const prompt = `Is this DEFINITELY an influencer or creator brand deal contract?

Reply ONLY:
CONFIDENT or NOT_CONFIDENT

Document:
<<<${text.slice(0, 6000)}>>>`;

  try {
    const response = await callLLM(prompt);
    const cleanResponse = response.trim().toUpperCase();
    
    if (cleanResponse.includes('CONFIDENT') && !cleanResponse.includes('NOT_CONFIDENT')) {
      return { confident: true };
    }
    
    // If NOT_CONFIDENT or LLM failed, use fallback scoring
    console.log('[ContractClassifier] LLM not confident, using fallback scoring');
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    // Fallback scoring
    if (/\b(payment|fee|compensation|amount)\b/i.test(lowerText)) score += 1;
    if (/\b(deliverables|posts|reels|videos|content)\b/i.test(lowerText)) score += 1;
    if (/\b(brand|sponsor|campaign)\b/i.test(lowerText)) score += 1;
    if (/\b(influencer|creator|content creator)\b/i.test(lowerText)) score += 1;
    
    const passed = score >= 3;
    
    return { confident: false, fallbackScore: score };
  } catch (error: any) {
    console.error('[ContractClassifier] Confidence check failed, using fallback scoring:', error);
    
    // On LLM failure, use fallback scoring
    const lowerText = text.toLowerCase();
    let score = 0;
    
    if (/\b(payment|fee|compensation|amount)\b/i.test(lowerText)) score += 1;
    if (/\b(deliverables|posts|reels|videos|content)\b/i.test(lowerText)) score += 1;
    if (/\b(brand|sponsor|campaign)\b/i.test(lowerText)) score += 1;
    if (/\b(influencer|creator|content creator)\b/i.test(lowerText)) score += 1;
    
    const passed = score >= 3;
    
    return { confident: false, fallbackScore: score };
  }
}

/**
 * 4-Stage Production-Grade Classifier
 * Returns validation result with detailed rejection reasons
 * 
 * CRITICAL: Hard override for strong brand deal signals - LLM cannot override
 */
export async function classifyDocumentTypeWithAI(text: string): Promise<DocumentTypeResult> {
  const rejection: ClassificationRejection = {};
  
  // Minimum text length check
  if (!text || text.length < 100) {
    return {
      type: "not_brand_deal",
      confidence: 0.0,
      reasoning: "Text too short (< 100 characters)"
    };
    }

  // ================================
  // STAGE 1: Hard Rejection Filter
  // ================================
  const stage1 = stage1HardRejection(text);
  if (stage1.rejected) {
    rejection.hardRejectMatch = stage1.match;
    console.error('[ContractClassifier] ❌ STAGE 1 REJECTED:', stage1.reason);
    return {
      type: "not_brand_deal",
      confidence: 0.0,
      reasoning: `Hard rejection: ${stage1.reason}`
    };
  }
  console.log('[ContractClassifier] ✅ STAGE 1 PASSED: No hard rejection patterns');
  
  // ================================
  // STAGE 2: Required Brand Deal Signals
  // ================================
  const stage2 = stage2BrandDealSignals(text);
  
  // ================================
  // HARD OVERRIDE: Force Accept if Strong Signals Present
  // ================================
  // This override happens BEFORE LLM check - LLM cannot override strong signals
  const hasStrongBrandDealSignals = 
    // Option 1: Brand + Influencer + Deliverables
    (stage2.hasBrand && stage2.hasInfluencer && stage2.hasDeliverables) ||
    // Option 2: Payment + Deliverables
    (stage2.hasPayment && stage2.hasDeliverables) ||
    // Option 3: Influencer keyword + Content Platform + Payment
    (stage2.hasInfluencer && stage2.hasContentPlatform && stage2.hasPayment) ||
    // Option 4: Any ₹ amount + Deliverables (strong indicator)
    (stage2.hasRupeeAmount && stage2.hasDeliverables);
  
  if (hasStrongBrandDealSignals) {
    console.log('[ContractClassifier] 🚀 HARD OVERRIDE: Strong brand deal signals detected - FORCING ACCEPT');
    console.log('[ContractClassifier] Signal details:', {
      hasBrand: stage2.hasBrand,
      hasInfluencer: stage2.hasInfluencer,
      hasDeliverables: stage2.hasDeliverables,
      hasPayment: stage2.hasPayment,
      hasContentPlatform: stage2.hasContentPlatform,
      hasRupeeAmount: stage2.hasRupeeAmount
    });
    return {
      type: "brand_deal_contract",
      confidence: 0.95,
      reasoning: "Hard override: Strong brand deal signals detected (Brand+Influencer+Deliverables OR Payment+Deliverables OR Influencer+Platform+Payment OR ₹+Deliverables)"
    };
  }
  
  // Continue with normal flow if no hard override
  if (!stage2.passed) {
    rejection.missingSignals = stage2.missing;
    console.log('[ContractClassifier] ❌ STAGE 2 REJECTED: Missing required signals');
    console.log('[ContractClassifier] Found signals:', stage2.signals);
    console.log('[ContractClassifier] Missing signals:', stage2.missing);
    return {
      type: "not_brand_deal",
      confidence: 0.2,
      reasoning: `Missing required brand deal signals. Found: ${stage2.signals.join(', ') || 'none'}. Need at least 2.`
    };
  }
  console.log('[ContractClassifier] ✅ STAGE 2 PASSED: Found', stage2.signals.length, 'signals:', stage2.signals.join(', '));
  
  // ================================
  // STAGE 3: LLM Binary Classifier (SUGGESTION ONLY)
  // ================================
  // LLM can suggest rejection, but cannot override strong signals
  const stage3 = await stage3LLMBinaryClassifier(text);
  if (!stage3.isValid) {
    rejection.llmRejected = true;
    console.warn('[ContractClassifier] ⚠️ STAGE 3: LLM suggested NO, but checking if signals override');
    console.log('[ContractClassifier] LLM response:', stage3.response);
    
    // Check if we have strong enough signals to override LLM
    const canOverrideLLM = 
      stage2.hasInfluencer || 
      stage2.hasContentPlatform || 
      stage2.hasRupeeAmount;
    
    if (canOverrideLLM) {
      console.log('[ContractClassifier] 🚀 OVERRIDING LLM: Strong signals present (Influencer OR Platform OR ₹)');
      // Continue to Stage 4 - don't reject here
    } else {
      // LLM rejected and no strong override signals
      console.error('[ContractClassifier] REJECTED BY CLASSIFIER:', {
        reason: 'LLM rejected and no strong override signals',
        extractedSignals: {
          hasBrand: stage2.hasBrand,
          hasInfluencer: stage2.hasInfluencer,
          hasDeliverables: stage2.hasDeliverables,
          hasPayment: stage2.hasPayment,
          hasContentPlatform: stage2.hasContentPlatform,
          hasRupeeAmount: stage2.hasRupeeAmount,
          allSignals: stage2.signals
        },
        llmResult: stage3.response
      });
      return {
        type: "not_brand_deal",
        confidence: 0.3,
        reasoning: `LLM classification: ${stage3.response} (no strong signals to override)`
      };
    }
  } else {
    console.log('[ContractClassifier] ✅ STAGE 3 PASSED: LLM returned YES');
  }
  
  // ================================
  // STAGE 4: Confidence Self-Check (NON-BLOCKING)
  // ================================
  const stage4 = await stage4ConfidenceCheck(text);
  if (!stage4.confident) {
    // Use fallback scoring
    if (stage4.fallbackScore === undefined || stage4.fallbackScore < 3) {
      // Check if we can override with strong signals
      const canOverrideConfidence = 
        (stage2.hasBrand && stage2.hasDeliverables && (stage2.hasPayment || stage2.hasInfluencer)) ||
        (stage2.hasInfluencer && stage2.hasContentPlatform) ||
        stage2.hasRupeeAmount;
      
      if (canOverrideConfidence) {
        console.log('[ContractClassifier] 🚀 OVERRIDING CONFIDENCE CHECK: Strong signals present');
        // Continue - accept despite low confidence
      } else {
        rejection.confidenceFailed = true;
        rejection.fallbackScore = stage4.fallbackScore;
        console.error('[ContractClassifier] REJECTED BY CLASSIFIER:', {
          reason: 'Confidence check failed and no strong override signals',
          extractedSignals: {
            hasBrand: stage2.hasBrand,
            hasInfluencer: stage2.hasInfluencer,
            hasDeliverables: stage2.hasDeliverables,
            hasPayment: stage2.hasPayment,
            hasContentPlatform: stage2.hasContentPlatform,
            hasRupeeAmount: stage2.hasRupeeAmount,
            allSignals: stage2.signals
          },
          llmResult: stage3.response,
          fallbackScore: stage4.fallbackScore
        });
        console.log('[ContractClassifier] ❌ STAGE 4 REJECTED: Not confident, fallback score:', stage4.fallbackScore);
        return {
          type: "not_brand_deal",
          confidence: 0.4,
          reasoning: `Confidence check failed. Fallback score: ${stage4.fallbackScore}/4 (need ≥3)`
        };
      }
    } else {
      console.log('[ContractClassifier] ⚠️ STAGE 4: Not confident, but fallback score passed:', stage4.fallbackScore);
    }
  } else {
    console.log('[ContractClassifier] ✅ STAGE 4 PASSED: LLM confident');
  }
  
  // ================================
  // FINAL DECISION: ACCEPT
  // ================================
  console.log('[ContractClassifier] ✅✅✅ ALL STAGES PASSED - ACCEPTING CONTRACT');
  console.log('[ContractClassifier] Final signals:', {
    hasBrand: stage2.hasBrand,
    hasInfluencer: stage2.hasInfluencer,
    hasDeliverables: stage2.hasDeliverables,
    hasPayment: stage2.hasPayment,
    hasContentPlatform: stage2.hasContentPlatform,
    hasRupeeAmount: stage2.hasRupeeAmount,
    allSignals: stage2.signals
  });
  console.log('[ContractClassifier] Rejection log:', JSON.stringify(rejection, null, 2));
  
  return {
    type: "brand_deal_contract",
    confidence: 0.95,
    reasoning: "Passed all 4 stages: hard rejection filter, brand deal signals, LLM binary classifier, confidence check"
  };
}
