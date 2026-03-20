// @ts-nocheck
// AI Counter-Proposal Generator Service
// Generates optimized counter-proposals for faster brand approval

import { callLLM } from './aiContractAnalysis.js';

export interface CounterProposalRequest {
  deal_value?: number | string;
  issues: Array<{
    title: string;
    severity: 'high' | 'medium' | 'low' | 'warning';
    category: string;
    description: string;
    recommendation?: string;
  }>;
  missing_clauses?: Array<{
    title: string;
    category: string;
    description: string;
  }>;
  creator_category?: string;
  brand_response_message?: string;
  previous_negotiation_message?: string;
  brand_name?: string;
  tone_preference?: 'soft' | 'firm' | 'aggressive';
}

export interface CounterProposalResponse {
  tone: string;
  risk_level: 'low' | 'medium' | 'high';
  approval_probability: string;
  message: string;
  key_changes: string[];
}

export async function generateAICounterProposal(
  request: CounterProposalRequest
): Promise<CounterProposalResponse> {
  const {
    deal_value,
    issues,
    missing_clauses = [],
    creator_category,
    brand_response_message,
    previous_negotiation_message,
    brand_name,
    tone_preference = 'firm'
  } = request;

  // Build issues context
  const issuesContext = issues
    .filter(issue => issue.severity === 'high' || issue.severity === 'medium' || issue.severity === 'warning')
    .map((issue, index) => {
      const severityLabel = issue.severity === 'high' ? 'HIGH PRIORITY' : 
                          issue.severity === 'medium' ? 'MEDIUM PRIORITY' : 
                          'WARNING PRIORITY';
      return `${index + 1}. [${severityLabel}] ${issue.title}
Category: ${issue.category}
Description: ${issue.description}
${issue.recommendation ? `Recommended Fix: ${issue.recommendation}` : ''}`;
    })
    .join('\n\n');

  // Build missing clauses context
  const missingClausesContext = missing_clauses
    .map((clause, index) => {
      return `${index + 1}. ${clause.title}
Category: ${clause.category}
Description: ${clause.description}`;
    })
    .join('\n\n');

  // Determine tone instructions based on preference
  const toneInstructions = {
    soft: 'Use a very collaborative, friendly, and accommodating tone. Focus on partnership and mutual benefit. Be gentle in requests.',
    firm: 'Use a professional, firm but respectful tone. Clearly state requirements while maintaining positive relationship. Balance assertiveness with collaboration.',
    aggressive: 'Use a direct, assertive tone. Clearly state non-negotiable requirements. Show strong legal positioning while remaining professional.'
  };

  // Build the AI prompt
  const prompt = `You are an expert legal negotiator specializing in creator-brand partnerships. Your task is to generate an optimized counter-proposal message that maximizes approval probability while protecting the creator's interests.

CONTEXT:
${brand_name ? `Brand Name: ${brand_name}` : 'Brand: Unknown'}
${deal_value ? `Deal Value: ₹${deal_value}` : 'Deal Value: Not specified'}
${creator_category ? `Creator Category: ${creator_category}` : ''}

${brand_response_message ? `Brand's Previous Response: "${brand_response_message}"` : ''}
${previous_negotiation_message ? `Previous Negotiation Message Sent: "${previous_negotiation_message.substring(0, 500)}..."` : ''}

ISSUES TO ADDRESS:
${issuesContext}

${missing_clauses.length > 0 ? `MISSING CLAUSES TO ADD:
${missingClausesContext}

` : ''}TASK:
Generate a counter-proposal message that:
1. Addresses all issues and missing clauses above
2. Uses ${toneInstructions[tone_preference]}
3. Maximizes brand approval probability
4. Protects creator's legal and financial interests
5. Is professional, clear, and actionable
6. Includes specific, measurable requests

STRATEGY FOR HIGHER APPROVAL:
- Frame requests as mutual benefits
- Show understanding of brand's perspective
- Offer reasonable compromises where possible
- Prioritize critical issues (payment, termination, IP)
- Use data/legal reasoning for stronger requests
- Create urgency without being pushy
- End with clear next steps

OUTPUT FORMAT (JSON only, no markdown):
{
  "tone": "<soft|firm|aggressive>",
  "risk_level": "<low|medium|high>",
  "approval_probability": "<percentage like '75%' or '82%'>",
  "message": "<Full counter-proposal message text - ready to send>",
  "key_changes": [
    "<Change 1: e.g., Reduced exclusivity to 30 days>",
    "<Change 2: e.g., Added late payment penalty>",
    "<Change 3: e.g., Locked fixed payment amount>"
  ]
}

Return ONLY valid JSON, no markdown, no explanations.`;

  try {
    const aiResponse = await callLLM(prompt);
    
    // Parse JSON response
    let parsed: CounterProposalResponse;
    try {
      // Try to extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[CounterProposal] Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate response structure
    if (!parsed.message || !parsed.key_changes || !Array.isArray(parsed.key_changes)) {
      throw new Error('Invalid response structure from AI');
    }

    // Ensure required fields have defaults
    return {
      tone: parsed.tone || tone_preference,
      risk_level: parsed.risk_level || 'medium',
      approval_probability: parsed.approval_probability || '70%',
      message: parsed.message,
      key_changes: parsed.key_changes
    };
  } catch (error: any) {
    console.error('[CounterProposal] Generation failed:', error);
    throw new Error(`Failed to generate counter-proposal: ${error.message || 'Unknown error'}`);
  }
}

