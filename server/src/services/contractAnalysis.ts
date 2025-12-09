// Contract Analysis Service
// Analyzes contracts (PDF, DOC, DOCX) and extracts key terms, issues, and risk assessment
// Uses configured LLM provider (Groq, Hugging Face, etc.)

import { analyzeContractWithAI } from './aiContractAnalysis.js';
import { classifyDocumentTypeWithAI } from './contractClassifier.js';
import { calculateNegotiationPowerScore } from './negotiationPowerScore.js';
import { extractTextFromDocument, detectDocumentType } from './documentTextExtractor.js';

export interface AnalysisResult {
  protectionScore: number;
  negotiationPowerScore?: number; // Added negotiation power score
  overallRisk: 'low' | 'medium' | 'high';
  issues: Array<{
    severity: 'high' | 'medium' | 'low' | 'warning';
    category: string;
    title: string;
    description: string;
    clause?: string;
    recommendation: string;
  }>;
  verified: Array<{
    category: string;
    title: string;
    description: string;
    clause?: string;
  }>;
  keyTerms: {
    dealValue?: string;
    duration?: string;
    deliverables?: string;
    paymentSchedule?: string;
    exclusivity?: string;
    payment?: string; // Added for negotiation power score calculation
    brandName?: string;
  };
  recommendations: string[];
}

/**
 * Validates if the document is a brand deal contract
 * RELAXED VALIDATION: Only rejects hard patterns, accepts if 2+ positive signals
 * Returns validation result with score and reason
 * 
 * NOTE: This function is exported but not used in the main flow (AI classification is used instead)
 */
export function isValidBrandDealContract(text: string): { valid: boolean; score: number; reason?: string } {
  const t = text.toLowerCase();

  // 🚨 HARD REJECTION ONLY FOR THESE SPECIFIC PATTERNS
  // Make patterns more specific to avoid false positives
  const rejectionPatterns = [
    { pattern: "legal notice", exact: false },
    { pattern: "zoomcar", exact: false },
    { pattern: "booking id", exact: false },
    { pattern: "vehicle rental", exact: false },
    { pattern: "vehicle damage", exact: false },
    { pattern: "repair estimate", exact: false },
    { pattern: "insurance claim", exact: false },
    { pattern: "insurance policy", exact: false },
    { pattern: "court order", exact: false },
    { pattern: "plaintiff", exact: false },
    { pattern: "defendant", exact: false },
    { pattern: "invoice number", exact: false },
    { pattern: "receipt number", exact: false },
    { pattern: "gst certificate", exact: false },
    { pattern: "gst registration", exact: false },
    { pattern: "aadhaar card", exact: false },
    { pattern: "pan card", exact: false },
    { pattern: "tax form", exact: false },
    { pattern: "government form", exact: false },
  ];

  for (const { pattern, exact } of rejectionPatterns) {
    if (exact ? t === pattern : t.includes(pattern)) {
      console.log('[BackendValidation] ❌ HARD REJECTION PATTERN:', pattern);
      return { valid: false, score: 0, reason: "Hard rejection pattern: " + pattern };
    }
  }

  console.log('[BackendValidation] ✓ No hard rejection patterns found');

  // ✅ STRONG BRAND DEAL SIGNALS (ANY 2 GROUPS IS ENOUGH)
  const positiveSignals = {
    roles: ["brand", "creator", "influencer"],
    content: ["post", "video", "reel", "story", "content", "deliverable"],
    deal: ["campaign", "collaboration", "sponsorship", "promotion"],
    money: ["payment", "fee", "compensation", "consideration", "amount"],
    rights: ["usage", "license", "intellectual property", "ip"],
    exclusivity: ["exclusive", "exclusivity", "non compete"]
  };

  let matches = 0;
  const matchedGroups: string[] = [];

  Object.entries(positiveSignals).forEach(([groupName, words]) => {
    if (words.some(word => t.includes(word))) {
      matches += 1;
      matchedGroups.push(groupName);
    }
  });

  console.log('[BackendValidation] Positive signal matches:', matches, 'Groups:', matchedGroups);

  // ✅ RELAXED PASS CONDITION: ANY 2 GROUPS = VALID
  if (matches >= 2) {
    console.log('[BackendValidation] ✅ BRAND DEAL DETECTED (', matches, 'signal groups matched)');
    return { valid: true, score: Math.min(100, matches * 15), reason: "Brand deal detected: " + matchedGroups.join(", ") };
  }

  console.log('[BackendValidation] ❌ Not enough brand deal signals (', matches, 'groups, need 2+)');
  return { valid: false, score: matches, reason: "Not enough brand deal signals (found " + matches + ", need 2+)" };
}

export async function analyzeContract(documentBuffer: Buffer, documentUrl?: string): Promise<AnalysisResult> {
  // Detect document type
  const docType = detectDocumentType(documentBuffer, documentUrl);
  console.log('[ContractAnalysis] Document type detected:', docType);
  
  // Extract text from document (supports PDF, DOCX, DOC)
  let fullText: string;
  try {
    fullText = await extractTextFromDocument(documentBuffer, documentUrl);
    console.log('[ContractAnalysis] Text extracted, length:', fullText.length);
  } catch (error: any) {
    console.error('[ContractAnalysis] Text extraction error:', error);
    
    // Provide helpful error messages based on document type
    if (docType === 'doc') {
      throw new Error(
        'DOC files (old Microsoft Word format) are not fully supported. ' +
        'Please convert your document to DOCX or PDF format and try again.'
      );
    }
    
    if (error.message?.includes('Invalid PDF') || error.message?.includes('PDF structure')) {
      throw new Error('Invalid document structure. Please ensure the file is a valid PDF, DOCX, or DOC document.');
    }
    
    throw new Error(`Failed to extract text from document: ${error.message || 'Unknown error'}`);
  }
  
  if (!fullText || fullText.trim().length < 100) {
    throw new Error('Document contains insufficient text for analysis. Please ensure the document has readable text content.');
  }

  // 🚨 VALIDATION: AI-based classification ONLY (using configured LLM provider)
  // ✅ ACCEPT if AI says it's a brand deal
  // ❌ REJECT if AI rejects it
  const provider = process.env.LLM_PROVIDER || 'huggingface';
  console.log(`[ContractAnalysis] Performing AI-based document classification (${provider} only)...`);
  const classification = await classifyDocumentTypeWithAI(fullText);

  console.log('[ContractAnalysis] AI result:', classification.type, '(confidence:', classification.confidence, ')');

  // ✅ ACCEPT only if AI classifies as brand deal
  if (classification.type !== "brand_deal_contract") {
    console.log('[ContractAnalysis] ❌ AI REJECTED');
    console.log('[ContractAnalysis] Classification details:', JSON.stringify(classification, null, 2));
    const err: any = new Error(
      `⚠️ This document is NOT a brand deal contract. Only influencer–brand collaboration agreements are supported. ${classification.reasoning ? `Reason: ${classification.reasoning}` : ''}`
    );
    err.name = "ValidationError";
    err.validationError = true;
    err.details = { classification };
    throw err;
  }

  console.log('[ContractAnalysis] ✅ AI classification passed (confidence:', classification.confidence, ')');

  // Analyze contract text using Hugging Face AI ONLY - NO RULE-BASED FALLBACK
  const analysis = await analyzeContractText(fullText);

  // Calculate Negotiation Power Score
  const negotiationPowerScore = calculateNegotiationPowerScore(analysis);
  analysis.negotiationPowerScore = negotiationPowerScore;
  console.log('[ContractAnalysis] Negotiation Power Score calculated:', negotiationPowerScore);

  return analysis;
}

/**
 * Analyze contract text using AI (any configured provider) - NO RULE-BASED FALLBACK
 */
async function analyzeContractText(text: string): Promise<AnalysisResult> {
  const provider = process.env.LLM_PROVIDER || 'huggingface';
  const model = process.env.LLM_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  
  console.log(`[ContractAnalysis] Using ${provider} AI-powered analysis with model: ${model}`);

    try {
      const aiAnalysis = await analyzeContractWithAI(text);
    console.log(`[ContractAnalysis] ${provider} AI analysis completed successfully`);
      
      // Calculate Negotiation Power Score for AI analysis
      const result = aiAnalysis as AnalysisResult;
      result.negotiationPowerScore = calculateNegotiationPowerScore(result);
      console.log('[ContractAnalysis] Negotiation Power Score calculated:', result.negotiationPowerScore);
      
      return result;
    } catch (error: any) {
    console.error(`[ContractAnalysis] ${provider} AI analysis failed:`, error);
    // NO FALLBACK - throw error instead of falling back to rules
    throw new Error(`${provider} AI analysis failed: ${error.message || 'Unknown error'}. No rule-based fallback available.`);
  }
}

/**
 * Rule-based contract analysis (DISABLED - Hugging Face AI only)
 * This function is kept for reference but is no longer used.
 */
// function analyzeContractTextRuleBased(text: string): AnalysisResult {
//   const lowerText = text.toLowerCase();
//   const issues: AnalysisResult['issues'] = [];
//   const verified: AnalysisResult['verified'] = [];
//   let protectionScore = 100;
//   let riskLevel: 'low' | 'medium' | 'high' = 'low';

//   // Extract key terms
//   const dealValue = extractDealValue(text);
//   const duration = extractDuration(text);
//   const deliverables = extractDeliverables(text);
//   const paymentSchedule = extractPaymentSchedule(text);
//   const exclusivity = extractExclusivity(text);

//   // Check for high-risk clauses
//   if (exclusivity && parseInt(exclusivity) > 30) {
//     issues.push({
//       severity: 'warning',
//       category: 'Exclusivity',
//       title: 'Extended Exclusivity Period',
//       description: `Contract requires ${exclusivity}-day exclusivity with competing brands. Industry standard is 30 days.`,
//       recommendation: 'Negotiate to reduce exclusivity period to 30 days or request additional compensation.'
//     });
//     protectionScore -= 10;
//     riskLevel = 'medium';
//   }

//   // Check for unfair termination clauses
//   if (lowerText.includes('termination') && (lowerText.includes('penalty') || lowerText.includes('forfeit'))) {
//     issues.push({
//       severity: 'high',
//       category: 'Termination',
//       title: 'Unfair Termination Penalties',
//       description: 'Contract includes penalties or forfeiture clauses on termination.',
//       recommendation: 'Request removal of termination penalties or negotiate fair terms.'
//     });
//     protectionScore -= 20;
//     riskLevel = 'high';
//   }

//   // Check for IP ownership issues
//   if (lowerText.includes('intellectual property') && lowerText.includes('brand') && !lowerText.includes('creator retains')) {
//     issues.push({
//       severity: 'high',
//       category: 'IP Rights',
//       title: 'IP Ownership Concerns',
//       description: 'Contract may grant excessive IP rights to the brand.',
//       recommendation: 'Ensure you retain ownership of content after campaign completion.'
//     });
//     protectionScore -= 15;
//     riskLevel = riskLevel === 'low' ? 'medium' : 'high';
//   }

//   // Verified positive clauses
//   if (lowerText.includes('payment') && (lowerText.includes('milestone') || lowerText.includes('schedule'))) {
//     verified.push({
//       category: 'Payment Terms',
//       title: 'Clear Payment Schedule',
//       description: 'Payment milestones are clearly defined with specific amounts and dates.'
//     });
//   }

//   if (lowerText.includes('termination') && lowerText.includes('notice') && !lowerText.includes('penalty')) {
//     verified.push({
//       category: 'Termination Rights',
//       title: 'Fair Termination Clause',
//       description: 'Both parties can terminate with notice. No unfair penalties.'
//     });
//   }

//   if (lowerText.includes('intellectual property') && lowerText.includes('creator')) {
//     verified.push({
//       category: 'IP Rights',
//       title: 'Creator Retains IP',
//       description: 'You retain ownership of content after campaign completion.'
//     });
//   }

//   // Calculate final risk level
//   if (protectionScore < 60) {
//     riskLevel = 'high';
//   } else if (protectionScore < 80) {
//     riskLevel = 'medium';
//   }

//   const result: AnalysisResult = {
//     protectionScore: Math.max(0, Math.min(100, protectionScore)),
//     overallRisk: riskLevel,
//     issues,
//     verified,
//     keyTerms: {
//       dealValue,
//       duration,
//       deliverables,
//       paymentSchedule,
//       exclusivity,
//       payment: paymentSchedule // Alias for negotiation power score calculation
//     },
//     recommendations: [
//       'Review identified issues with your legal advisor',
//       'Negotiate better terms before signing',
//       'Request clarification on ambiguous clauses'
//     ]
//   };

//   // Calculate Negotiation Power Score
//   result.negotiationPowerScore = calculateNegotiationPowerScore(result);

//   return result;
// }

function extractDealValue(text: string): string | undefined {
  const match = text.match(/₹[\s]*([\d,]+)|(\$[\s]*[\d,]+)|([\d,]+[\s]*(?:rupees|rs|inr))/i);
  return match ? match[0] : undefined;
}

function extractDuration(text: string): string | undefined {
  const match = text.match(/(\d+)[\s]*(?:month|week|day)s?/i);
  return match ? `${match[1]} ${match[2] || 'months'}` : undefined;
}

function extractDeliverables(text: string): string | undefined {
  const match = text.match(/(\d+)[\s]*(?:video|post|reel|story|content)/i);
  return match ? match[0] : 'As per contract';
}

function extractPaymentSchedule(text: string): string | undefined {
  if (text.match(/milestone|installment/i)) return 'Milestone-based';
  if (text.match(/advance|upfront/i)) return 'Advance + Post Delivery';
  if (text.match(/monthly|retainer/i)) return 'Monthly Retainer';
  return 'Standard';
}

function extractExclusivity(text: string): string | undefined {
  const match = text.match(/(\d+)[\s]*(?:day|week|month)[\s]*exclusivity/i);
  return match ? match[1] : undefined;
}

