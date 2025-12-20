// Complaint Severity Classifier
// Uses AI to classify consumer complaint severity for internal triage

import { callLLM } from './aiContractAnalysis.js';

interface SeverityClassification {
  severity: 'low' | 'medium' | 'high';
  reason: string;
  confidence: number;
}

/**
 * Classify complaint severity using AI
 * Returns severity level and confidence score for internal triage
 */
export async function classifyComplaintSeverity(
  description: string,
  category: string,
  categoryName: string | null,
  amount: number | null,
  issueType: string
): Promise<{ severity: 'low' | 'medium' | 'high'; confidence_score: number }> {
  try {
    const amountText = amount ? `₹${amount.toLocaleString('en-IN')}` : 'Not specified';
    const categoryText = categoryName || category;

    const prompt = `You are a legal triage assistant. Analyze this consumer complaint and classify its severity for internal prioritization.

Complaint Details:
- Category: ${categoryText}
- Issue Type: ${issueType}
- Amount Involved: ${amountText}
- Description: ${description}

Classify the severity based on:
1. Financial impact (higher amounts = higher severity)
2. Legal complexity (contract disputes, fraud = higher severity)
3. Urgency (time-sensitive issues = higher severity)
4. Potential for escalation (refund delays, service failures = medium-high)

Return ONLY a valid JSON object with this exact structure:
{
  "severity": "low" | "medium" | "high",
  "reason": "Brief explanation (1-2 sentences)",
  "confidence": <number between 0 and 1>
}

Guidelines:
- LOW: Minor issues, small amounts (<₹1000), simple refund requests, non-urgent
- MEDIUM: Moderate amounts (₹1000-₹10000), service quality issues, standard disputes
- HIGH: Large amounts (>₹10000), fraud allegations, contract breaches, urgent legal matters, potential legal action

Be conservative - when in doubt, choose medium.`;

    const response = await callLLM(prompt);
    
    // Try to extract JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON found, try to parse the whole response
      jsonMatch = [response];
    }

    const classification: SeverityClassification = JSON.parse(jsonMatch[0]);

    // Validate and normalize
    if (!['low', 'medium', 'high'].includes(classification.severity)) {
      throw new Error(`Invalid severity: ${classification.severity}`);
    }

    // Clamp confidence to 0-1
    const confidence = Math.max(0, Math.min(1, classification.confidence || 0.5));

    return {
      severity: classification.severity as 'low' | 'medium' | 'high',
      confidence_score: confidence,
    };
  } catch (error: any) {
    console.error('[ComplaintSeverity] AI classification failed:', error);
    // Fallback to medium severity with low confidence
    return {
      severity: 'medium',
      confidence_score: 0.0, // Indicates AI classification failed
    };
  }
}

