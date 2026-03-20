// AI-powered Contract Analysis Service
// Uses free LLM (Hugging Face) to analyze contracts

interface AIContractAnalysis {
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
    brandName?: string;
  };
  recommendations: string[];
}

/**
 * Unified LLM call function - can be used by any service
 */
export async function callLLM(prompt: string): Promise<string> {
  const provider = process.env.LLM_PROVIDER || 'huggingface';
  const model = process.env.LLM_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  const apiKey = process.env.LLM_API_KEY; // Optional for Hugging Face

  if (provider === 'huggingface') {
    return await callHuggingFace(model, prompt, apiKey);
  } else if (provider === 'groq') {
    if (!apiKey) throw new Error('Groq API key required');
    return await callGroq(model, prompt, apiKey);
  } else if (provider === 'together') {
    if (!apiKey) throw new Error('Together AI API key required');
    return await callTogether(model, prompt, apiKey);
  } else if (provider === 'gemini') {
    if (!apiKey) throw new Error('Gemini API key required');
    return await callGemini(model, prompt, apiKey);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Analyze contract using AI - PURE AI-DRIVEN ANALYSIS
 * Sends FULL extracted text to AI for comprehensive analysis
 */
export async function analyzeContractWithAI(contractText: string): Promise<AIContractAnalysis & {
  documentType?: string;
  detectedContractCategory?: string;
  brandDetected?: boolean;
  riskScore?: 'LOW' | 'MEDIUM' | 'HIGH';
  parties?: {
    brandName?: string;
    influencerName?: string;
  };
  extractedTerms?: {
    paymentTerms?: string;
    deliverables?: string;
    usageRights?: string;
    exclusivity?: string;
    termination?: string;
  };
  negotiationPoints?: string[];
}> {
  const provider = process.env.LLM_PROVIDER || 'huggingface';
  const model = process.env.LLM_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  const apiKey = process.env.LLM_API_KEY; // Optional for Hugging Face

  // Send FULL text - no truncation (AI must analyze complete document)
  // Note: Some models have token limits, but we'll let the model handle it
  const fullText = contractText;

  const systemPrompt = `You are a legal contract analysis engine. You must analyze the FULL document text provided and make ALL decisions about document type, contract category, risk assessment, and extraction.

YOUR TASKS:
1. Identify document type (e.g., "Brand Deal Contract", "NDA", "MoU", "Barter Agreement", "Sponsorship Agreement", "Email Export", "Scanned Contract", etc.)
2. Detect if this is a brand-influencer collaboration (true/false)
3. Extract parties:
   - Brand name (if applicable)
   - Influencer/Creator name (if applicable)
4. Extract payment terms (amount, schedule, method, TDS/GST if mentioned)
5. Extract deliverables (content type, quantity, platforms, timelines)
6. Extract usage/IP rights (who owns content, usage duration, geographic scope)
7. Extract exclusivity terms (duration, scope, restrictions)
8. Extract termination clauses (notice period, penalties, conditions)
9. Assign Risk Score: LOW, MEDIUM, or HIGH based on:
   - Unfair payment terms
   - Excessive exclusivity (>30 days)
   - Unclear IP ownership
   - Unfair termination penalties
   - Missing critical clauses
   - Unbalanced terms favoring brand
10. Generate 5-10 negotiation improvement points (specific, actionable suggestions)

IMPORTANT:
- Analyze the ENTIRE document text provided
- Be thorough and extract ALL relevant information
- If information is missing, indicate "Not specified" or "Not found"
- Risk score should reflect overall contract fairness and creator protection
- Negotiation points should be specific and actionable

Return ONLY a valid JSON object with this exact structure:
{
  "documentType": "<identified document type>",
  "detectedContractCategory": "<category: brand_deal|nda|mou|barter|sponsorship|other>",
  "brandDetected": <boolean>,
  "riskScore": "<LOW|MEDIUM|HIGH>",
  "parties": {
    "brandName": "<brand name or 'Not specified'>",
    "influencerName": "<influencer/creator name or 'Not specified'>"
  },
  "extractedTerms": {
    "paymentTerms": "<detailed payment terms>",
    "deliverables": "<detailed deliverables>",
    "usageRights": "<IP and usage rights>",
    "exclusivity": "<exclusivity terms>",
    "termination": "<termination clauses>"
  },
  "protectionScore": <number 0-100>,
  "overallRisk": "<low|medium|high>",
  "issues": [
    {
      "severity": "<high|medium|low|warning>",
      "category": "<category name>",
      "title": "<issue title>",
      "description": "<detailed description>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "verified": [
    {
      "category": "<category name>",
      "title": "<positive aspect title>",
      "description": "<description>"
    }
  ],
  "keyTerms": {
    "dealValue": "<amount>",
    "duration": "<duration>",
    "deliverables": "<deliverables>",
    "paymentSchedule": "<payment schedule>",
    "exclusivity": "<exclusivity period>",
    "brandName": "<brand or company name>"
  },
  "negotiationPoints": ["<point 1>", "<point 2>", "<point 3>", "<point 4>", "<point 5>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

  const prompt = `${systemPrompt}

FULL CONTRACT TEXT:
${fullText}

Return ONLY the JSON object, no markdown, no explanations, no additional text.`;

  try {
    let aiResponse: string;

    if (provider === 'huggingface') {
      aiResponse = await callHuggingFace(model, prompt, apiKey);
    } else if (provider === 'groq') {
      if (!apiKey) throw new Error('Groq API key required');
      aiResponse = await callGroq(model, prompt, apiKey);
    } else if (provider === 'together') {
      if (!apiKey) throw new Error('Together AI API key required');
      aiResponse = await callTogether(model, prompt, apiKey);
    } else if (provider === 'gemini') {
      if (!apiKey) throw new Error('Gemini API key required');
      aiResponse = await callGemini(model, prompt, apiKey);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Parse AI response
    const analysis = parseAIResponse(aiResponse);
    
    // Extract additional fields from AI response if present
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...analysis,
          documentType: parsed.documentType,
          detectedContractCategory: parsed.detectedContractCategory,
          brandDetected: parsed.brandDetected,
          riskScore: parsed.riskScore,
          parties: parsed.parties,
          extractedTerms: parsed.extractedTerms,
          negotiationPoints: parsed.negotiationPoints || analysis.recommendations,
        };
      }
    } catch (e) {
      console.warn('[AIContractAnalysis] Could not extract additional fields from AI response');
    }
    
    return analysis;
  } catch (error: any) {
    console.error('[AIContractAnalysis] AI analysis failed:', error);
    throw error;
  }
}

/**
 * Call Hugging Face API (free, no API key needed for public models)
 * Uses Inference API endpoint which is more reliable for public models
 */
async function callHuggingFace(model: string, prompt: string, apiKey?: string): Promise<string> {
  // Use Inference API endpoint (more reliable for public models)
  const url = `https://api-inference.huggingface.co/models/${model}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    // Create AbortController for timeout (60 seconds for Hugging Face)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response: Response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent analysis
          return_full_text: false,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Check if model is loading
      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({})) as any;
        const estimatedTime = errorData.estimated_time || 30;
        console.warn(`[HuggingFace] Model is loading. Estimated wait: ${estimatedTime} seconds`);
        throw new Error(`Hugging Face model is loading. Please wait ${estimatedTime} seconds and try again.`);
      }
      
      // Handle 401/403 errors - might need API key or different endpoint
      if (response.status === 401 || response.status === 403) {
        console.error('[HuggingFace] Authentication error. Trying without auth or checking if model requires API key.');
        // For public models, 401 might mean the endpoint changed or model requires auth
        // Try to get more details from error response
        const errorText = await response.text().catch(() => '');
        console.error('[HuggingFace] Error response:', errorText);
        
        // If error mentions router, it's a redirect issue, not auth
        if (errorText.includes('router.huggingface.co')) {
          throw new Error('Hugging Face API endpoint has changed. Please check the model endpoint or use an API key.');
        }
        
        throw new Error(`Hugging Face API authentication error (${response.status}). This model may require an API key.`);
      }
      
      // Try to get error message from response
      let errorMessage = 'Unknown error';
      try {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
        errorMessage = error.error || error.message || response.statusText;
      console.error('[HuggingFace] API error:', response.status, error);
      } catch (parseError) {
        const errorText = await response.text().catch(() => '');
        errorMessage = errorText || response.statusText;
        console.error('[HuggingFace] API error (non-JSON):', response.status, errorText);
      }
      
      throw new Error(`Hugging Face API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json() as any;
    
    // Handle array response (Hugging Face sometimes returns array)
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }
    
    if (data.generated_text) {
      return data.generated_text;
    }
    
    if (typeof data === 'string') {
      return data;
    }

    console.error('[HuggingFace] Unexpected response format:', JSON.stringify(data).substring(0, 200));
    throw new Error('Unexpected response format from Hugging Face');
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Hugging Face API request timed out after 60 seconds. The model may be loading or overloaded.');
    }
    // Re-throw if it's already a formatted error
    if (error.message?.includes('Hugging Face')) {
      throw error;
    }
    // Wrap other errors
    throw new Error(`Hugging Face API call failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Call Groq API (free, fast, requires API key)
 */
async function callGroq(model: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert contract analyst. Return only valid JSON, no additional text or markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as any;
  return data.choices[0]?.message?.content || '';
}

/**
 * Call Together AI API (free tier, requires API key)
 */
async function callTogether(model: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages: [
        { role: 'system', content: 'You are an expert contract analyst. Return only valid JSON, no additional text or markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(`Together AI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as any;
  return data.choices[0]?.message?.content || '';
}

/**
 * Call Google Gemini API (requires API key)
 */
async function callGemini(model: string, prompt: string, apiKey: string): Promise<string> {
  // Use gemini-2.0-flash as default (gemini-pro is deprecated)
  const modelName = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const response: Response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as any;
  
  // Extract text from Gemini response
  if (data.candidates && data.candidates[0]?.content?.parts) {
    return data.candidates[0].content.parts.map((part: any) => part.text).join('');
  }
  
  throw new Error('Unexpected response format from Gemini API');
}

/**
 * Parse AI response and extract JSON
 */
function parseAIResponse(response: string): AIContractAnalysis {
  // Try to extract JSON from response (AI might wrap it in markdown or text)
  let jsonText = response.trim();
  
  // Remove markdown code blocks if present
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Try to find JSON object in the response
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonText);
    
    // Validate and normalize the response
    return {
      protectionScore: Math.max(0, Math.min(100, parsed.protectionScore || 75)),
      overallRisk: ['low', 'medium', 'high'].includes(parsed.overallRisk) ? parsed.overallRisk : 'medium',
      issues: Array.isArray(parsed.issues) ? parsed.issues.map((issue: any) => ({
        severity: ['high', 'medium', 'low', 'warning'].includes(issue.severity) ? issue.severity : 'medium',
        category: issue.category || 'General',
        title: issue.title || 'Issue',
        description: issue.description || '',
        clause: issue.clause,
        recommendation: issue.recommendation || 'Review with legal advisor',
      })) : [],
      verified: Array.isArray(parsed.verified) ? parsed.verified.map((item: any) => ({
        category: item.category || 'General',
        title: item.title || 'Verified',
        description: item.description || '',
        clause: item.clause,
      })) : [],
      keyTerms: parsed.keyTerms || {},
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
        'Review identified issues with your legal advisor',
        'Negotiate better terms before signing',
      ],
    };
  } catch (error) {
    console.error('[AIContractAnalysis] Failed to parse AI response:', error);
    console.error('[AIContractAnalysis] Response was:', response.substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
}

