// Clause Generation Service using Gemini AI
// Generates legally safe, creator-friendly clause replacements

import { callLLM } from './aiContractAnalysis';

export interface ClauseGenerationRequest {
  originalClause: string;
  issueContext?: string;
  issueCategory?: string;
}

export interface ClauseGenerationResponse {
  safeClause: string;
  explanation?: string;
}

/**
 * Generate a safe, creator-friendly replacement clause using Gemini AI
 */
export async function generateSafeClause(
  request: ClauseGenerationRequest
): Promise<ClauseGenerationResponse> {
  const { originalClause, issueContext, issueCategory } = request;

  if (!originalClause || originalClause.trim().length === 0) {
    throw new Error('Original clause is required');
  }

  const prompt = `You are an expert legal advisor specializing in influencer-brand collaboration agreements under Indian law.

TASK: Rewrite the following clause in a legally safe, creator-friendly manner that protects the creator's rights while maintaining fairness for both parties.

ORIGINAL CLAUSE:
${originalClause}

${issueContext ? `ISSUE CONTEXT: ${issueContext}` : ''}
${issueCategory ? `CATEGORY: ${issueCategory}` : ''}

REQUIREMENTS:
1. Maintain the original intent but make it fair and balanced
2. Protect creator's intellectual property rights
3. Ensure reasonable payment terms
4. Avoid unfair exclusivity or liability clauses
5. Comply with Indian contract law
6. Use clear, unambiguous language

Return ONLY a JSON object with this structure:
{
  "safeClause": "<the rewritten safe clause>",
  "explanation": "<brief explanation of changes made>"
}

Do not include any markdown, code blocks, or additional text. Return only the JSON object.`;

  try {
    const aiResponse = await callLLM(prompt);
    
    // Parse AI response
    let jsonText = aiResponse.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonText);

    if (!parsed.safeClause) {
      throw new Error('AI did not generate a safe clause');
    }

    return {
      safeClause: parsed.safeClause.trim(),
      explanation: parsed.explanation?.trim() || undefined
    };
  } catch (error: any) {
    console.error('[ClauseGenerator] Failed to generate safe clause:', error);
    throw new Error(`Failed to generate safe clause: ${error.message}`);
  }
}

