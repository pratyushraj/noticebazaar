// Contract Analysis Service
// Analyzes PDF contracts and extracts key terms, issues, and risk assessment

import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

interface AnalysisResult {
  protectionScore: number;
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
  };
  recommendations: string[];
}

export async function analyzeContract(pdfBuffer: Buffer): Promise<AnalysisResult> {
  // Initialize PDF.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  // Load PDF
  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  
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

  // Analyze contract text
  const analysis = analyzeContractText(fullText);

  return analysis;
}

function analyzeContractText(text: string): AnalysisResult {
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

  return {
    protectionScore: Math.max(0, Math.min(100, protectionScore)),
    overallRisk: riskLevel,
    issues,
    verified,
    keyTerms: {
      dealValue,
      duration,
      deliverables,
      paymentSchedule,
      exclusivity
    },
    recommendations: [
      'Review identified issues with your legal advisor',
      'Negotiate better terms before signing',
      'Request clarification on ambiguous clauses'
    ]
  };
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

