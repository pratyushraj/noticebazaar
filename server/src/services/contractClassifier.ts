// AI-powered Document Type Classifier
// HARD BLOCK: Uses AI (Gemini) ONLY - no rule-based fallback

import { callLLM } from "./aiContractAnalysis.js";

export type DocumentType = "brand_deal_contract" | "not_brand_deal";

export interface DocumentTypeResult {
  type: DocumentType;
  confidence: number; // 0–1
  reasoning?: string;
}

/**
 * Classifies document type using AI - HARD BLOCK with NO FALLBACK
 */
export async function classifyDocumentTypeWithAI(text: string): Promise<DocumentTypeResult> {
  if (!text || text.length < 500) {
    return { type: "not_brand_deal", confidence: 0.2, reasoning: "Text too short" };
  }

  const prompt = `
You are a strict document classifier.

Decide if the following document is a BRAND DEAL CONTRACT between a brand and a creator/influencer.

ACCEPT ONLY:
- Influencer-brand collaboration agreements (including test contracts, sample contracts)
- Sponsorship contracts
- Content creation + deliverables + payment agreements
- Documents titled "INFLUENCER AGREEMENT", "CREATOR AGREEMENT", "SPONSORSHIP AGREEMENT"
- Documents with both "Creator" and "Brand" as defined parties
- Documents mentioning deliverables (videos, posts, reels, content)

IMPORTANT: Do NOT reject documents labeled as "test", "sample", "for testing only", or "high risk". These may be valid test contracts.

REJECT:
- Legal notices
- Zoomcar / rental documents
- Insurance claims
- Invoices
- Court documents
- Government forms
- Employment contracts

Return ONLY valid JSON:
{
  "type": "brand_deal_contract" | "not_brand_deal",
  "confidence": 0.0-1.0,
  "reasoning": "short explanation"
}

DOCUMENT:
"""${text.slice(0, 6000)}"""
`;

  try {
    console.log('[ContractClassifier] Calling LLM for classification...');
    const aiResponse = await callLLM(prompt);
    console.log('[ContractClassifier] LLM response received, length:', aiResponse?.length || 0);
    
    // Parse JSON from response (handle markdown code blocks)
    let jsonText = aiResponse.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    } else {
      console.error('[ContractClassifier] No JSON object found in response:', jsonText.substring(0, 200));
      return { type: "not_brand_deal", confidence: 0.3, reasoning: "No JSON found in AI response" };
    }
    
    const parsed = JSON.parse(jsonText);
    console.log('[ContractClassifier] Parsed JSON:', JSON.stringify(parsed));

    if (!parsed.type || typeof parsed.confidence !== "number") {
      console.warn('[ContractClassifier] Invalid AI output structure:', parsed);
      return { type: "not_brand_deal", confidence: 0.3, reasoning: "Invalid AI output" };
    }

    // Use AI result directly - no rule-based fallback
    if (parsed.confidence < 0.7) {
      console.log('[ContractClassifier] AI confidence low (< 0.7), rejecting. Confidence:', parsed.confidence);
      return { type: "not_brand_deal", confidence: parsed.confidence, reasoning: parsed.reasoning };
    }

    console.log('[ContractClassifier] ✅ Classification successful:', parsed.type, 'confidence:', parsed.confidence);
    return parsed;
  } catch (e: any) {
    console.error('[ContractClassifier] AI classification failed:', e);
    console.error('[ContractClassifier] Error name:', e?.name);
    console.error('[ContractClassifier] Error message:', e?.message);
    console.error('[ContractClassifier] Error stack:', e?.stack);
    // AI failed - reject (no fallback to rules)
    return { type: "not_brand_deal", confidence: 0.3, reasoning: `AI classification failed: ${e?.message || 'Unknown error'}` };
  }
}
