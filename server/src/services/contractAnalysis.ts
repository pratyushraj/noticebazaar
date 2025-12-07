// Contract Analysis Service
// Analyzes PDF contracts and extracts key terms, issues, and risk assessment
// Uses AI (free LLM) with fallback to rule-based analysis

// Import pdfjs-dist for Node.js environment
// For pdfjs-dist v3.x in Node.js with ES modules, try different import paths
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { analyzeContractWithAI } from './aiContractAnalysis.js';
import { classifyDocumentTypeWithAI } from './contractClassifier.js';
import { calculateNegotiationPowerScore } from './negotiationPowerScore.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  };
  recommendations: string[];
}

/**
 * Validates if the document is a brand deal contract
 * RELAXED VALIDATION: Only rejects hard patterns, accepts if 2+ positive signals
 * Returns validation result with score and reason
 * 
 * EXPORTED for use in contractClassifier as fallback
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

export async function analyzeContract(pdfBuffer: Buffer): Promise<AnalysisResult> {
  // Set up PDF.js worker with proper error handling
  // In Node.js, pdfjs-dist can work without a worker, so we disable it
  // In browser, we need the worker from CDN
  try {
    // Check if GlobalWorkerOptions exists
    if (pdfjsLib.GlobalWorkerOptions) {
      // Node.js environment - disable worker (not needed, and can cause issues)
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Disable worker for Node.js - pdfjs-dist works fine without it
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        console.log('[ContractAnalysis] Node.js environment - worker disabled (not needed)');
      } else {
        // Browser environment - use CDN worker
        const pdfjsVersion = pdfjsLib.version || '3.11.174';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;
        console.log('[ContractAnalysis] Browser environment - using CDN worker');
      }
    } else {
      console.warn('[ContractAnalysis] GlobalWorkerOptions not available - this is normal for some pdfjs-dist versions');
    }
  } catch (error: any) {
    console.warn('[ContractAnalysis] Error setting PDF.js worker (non-critical):', error.message);
    // Continue - pdfjs-dist should still work
  }

  // Convert Buffer to Uint8Array (required by pdfjs-dist)
  const uint8Array = new Uint8Array(pdfBuffer);

  // Validate PDF buffer is not empty
  if (uint8Array.length === 0) {
    throw new Error('PDF buffer is empty');
  }

  // Load PDF with better error handling
  let pdf;
  try {
    // Try multiple ways to access getDocument (pdfjs-dist v3.x can export differently)
    let getDocument = (pdfjsLib as any).getDocument;
    
    // If not found, try default export or other structures
    if (!getDocument || typeof getDocument !== 'function') {
      getDocument = (pdfjsLib as any).default?.getDocument;
    }
    
    // Try accessing from nested structure
    if (!getDocument || typeof getDocument !== 'function') {
      const lib: any = pdfjsLib;
      if (lib.getDocument) getDocument = lib.getDocument;
      else if (lib.default?.getDocument) getDocument = lib.default.getDocument;
    }
    
    if (!getDocument || typeof getDocument !== 'function') {
      console.error('[ContractAnalysis] pdfjsLib keys:', Object.keys(pdfjsLib));
      console.error('[ContractAnalysis] pdfjsLib structure:', Object.keys(pdfjsLib).slice(0, 10));
      throw new Error('pdfjsLib.getDocument is not a function. pdfjs-dist version: ' + ((pdfjsLib as any).version || 'unknown') + '. Try checking import path.');
    }
    
    console.log('[ContractAnalysis] Using getDocument function for PDF loading');
    const loadingTask = getDocument({ 
      data: uint8Array,
      verbosity: 0, // Reduce console output
      stopAtErrors: false, // Continue even if there are errors
      maxImageSize: 1024 * 1024 * 10 // 10MB max image size
    });
    pdf = await loadingTask.promise;
  } catch (error: any) {
    console.error('[ContractAnalysis] PDF loading error:', error);
    if (error.name === 'InvalidPDFException' || error.message?.includes('Invalid PDF')) {
      throw new Error('Invalid PDF structure. Please ensure the file is a valid PDF document.');
    }
    throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
  }
  
  // Extract text from all pages
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => (item as TextItem).str)
      .join(' ');
    fullText += pageText + '\n';
  }

  // 🚨 VALIDATION: AI-based classification ONLY (Gemini)
  // ✅ ACCEPT if AI says it's a brand deal
  // ❌ REJECT if AI rejects it
  console.log('[ContractAnalysis] Performing AI-based document classification (Gemini only)...');
  const classification = await classifyDocumentTypeWithAI(fullText);

  console.log('[ContractAnalysis] AI result:', classification.type, '(confidence:', classification.confidence, ')');

  // ✅ ACCEPT only if AI classifies as brand deal
  if (classification.type !== "brand_deal_contract") {
    console.log('[ContractAnalysis] ❌ AI REJECTED');
    const err: any = new Error(
      "⚠️ This document is NOT a brand deal contract. Only influencer–brand collaboration agreements are supported."
    );
    err.name = "ValidationError";
    err.validationError = true;
    err.details = { classification };
    throw err;
  }

  console.log('[ContractAnalysis] ✅ AI classification passed (confidence:', classification.confidence, ')');

  // Analyze contract text (AI-powered with fallback to rule-based)
  const analysis = await analyzeContractText(fullText);

  // Calculate Negotiation Power Score
  const negotiationPowerScore = calculateNegotiationPowerScore(analysis);
  analysis.negotiationPowerScore = negotiationPowerScore;
  console.log('[ContractAnalysis] Negotiation Power Score calculated:', negotiationPowerScore);

  return analysis;
}

/**
 * Analyze contract text using AI (if enabled) or fallback to rule-based
 */
async function analyzeContractText(text: string): Promise<AnalysisResult> {
  // Check if AI analysis is enabled
  const useAI = process.env.USE_AI_CONTRACT_ANALYSIS === 'true' || 
                process.env.LLM_PROVIDER !== undefined;
  
  if (useAI) {
    try {
      console.log('[ContractAnalysis] Using AI-powered analysis...');
      const aiAnalysis = await analyzeContractWithAI(text);
      console.log('[ContractAnalysis] AI analysis completed successfully');
      
      // Calculate Negotiation Power Score for AI analysis
      const result = aiAnalysis as AnalysisResult;
      result.negotiationPowerScore = calculateNegotiationPowerScore(result);
      console.log('[ContractAnalysis] Negotiation Power Score calculated:', result.negotiationPowerScore);
      
      return result;
    } catch (error: any) {
      console.warn('[ContractAnalysis] AI analysis failed, falling back to rule-based:', error.message);
      // Fall through to rule-based analysis
    }
  }

  // Fallback to rule-based analysis
  console.log('[ContractAnalysis] Using rule-based analysis...');
  const ruleBasedResult = analyzeContractTextRuleBased(text);
  
  // Calculate Negotiation Power Score for rule-based analysis
  ruleBasedResult.negotiationPowerScore = calculateNegotiationPowerScore(ruleBasedResult);
  console.log('[ContractAnalysis] Negotiation Power Score calculated:', ruleBasedResult.negotiationPowerScore);
  
  return ruleBasedResult;
}

/**
 * Rule-based contract analysis (fallback)
 */
function analyzeContractTextRuleBased(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  const issues: AnalysisResult['issues'] = [];
  const verified: AnalysisResult['verified'] = [];
  let protectionScore = 100;
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Extract key terms
  const dealValue = extractDealValue(text);
  const duration = extractDuration(text);
  const deliverables = extractDeliverables(text);
  const paymentSchedule = extractPaymentSchedule(text);
  const exclusivity = extractExclusivity(text);

  // Check for high-risk clauses
  if (exclusivity && parseInt(exclusivity) > 30) {
    issues.push({
      severity: 'warning',
      category: 'Exclusivity',
      title: 'Extended Exclusivity Period',
      description: `Contract requires ${exclusivity}-day exclusivity with competing brands. Industry standard is 30 days.`,
      recommendation: 'Negotiate to reduce exclusivity period to 30 days or request additional compensation.'
    });
    protectionScore -= 10;
    riskLevel = 'medium';
  }

  // Check for unfair termination clauses
  if (lowerText.includes('termination') && (lowerText.includes('penalty') || lowerText.includes('forfeit'))) {
    issues.push({
      severity: 'high',
      category: 'Termination',
      title: 'Unfair Termination Penalties',
      description: 'Contract includes penalties or forfeiture clauses on termination.',
      recommendation: 'Request removal of termination penalties or negotiate fair terms.'
    });
    protectionScore -= 20;
    riskLevel = 'high';
  }

  // Check for IP ownership issues
  if (lowerText.includes('intellectual property') && lowerText.includes('brand') && !lowerText.includes('creator retains')) {
    issues.push({
      severity: 'high',
      category: 'IP Rights',
      title: 'IP Ownership Concerns',
      description: 'Contract may grant excessive IP rights to the brand.',
      recommendation: 'Ensure you retain ownership of content after campaign completion.'
    });
    protectionScore -= 15;
    riskLevel = riskLevel === 'low' ? 'medium' : 'high';
  }

  // Verified positive clauses
  if (lowerText.includes('payment') && (lowerText.includes('milestone') || lowerText.includes('schedule'))) {
    verified.push({
      category: 'Payment Terms',
      title: 'Clear Payment Schedule',
      description: 'Payment milestones are clearly defined with specific amounts and dates.'
    });
  }

  if (lowerText.includes('termination') && lowerText.includes('notice') && !lowerText.includes('penalty')) {
    verified.push({
      category: 'Termination Rights',
      title: 'Fair Termination Clause',
      description: 'Both parties can terminate with notice. No unfair penalties.'
    });
  }

  if (lowerText.includes('intellectual property') && lowerText.includes('creator')) {
    verified.push({
      category: 'IP Rights',
      title: 'Creator Retains IP',
      description: 'You retain ownership of content after campaign completion.'
    });
  }

  // Calculate final risk level
  if (protectionScore < 60) {
    riskLevel = 'high';
  } else if (protectionScore < 80) {
    riskLevel = 'medium';
  }

  const result: AnalysisResult = {
    protectionScore: Math.max(0, Math.min(100, protectionScore)),
    overallRisk: riskLevel,
    issues,
    verified,
    keyTerms: {
      dealValue,
      duration,
      deliverables,
      paymentSchedule,
      exclusivity,
      payment: paymentSchedule // Alias for negotiation power score calculation
    },
    recommendations: [
      'Review identified issues with your legal advisor',
      'Negotiate better terms before signing',
      'Request clarification on ambiguous clauses'
    ]
  };

  // Calculate Negotiation Power Score
  result.negotiationPowerScore = calculateNegotiationPowerScore(result);

  return result;
}

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

