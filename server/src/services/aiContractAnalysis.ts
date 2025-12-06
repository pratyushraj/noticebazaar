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
 * Analyze contract using AI (Hugging Face - free, no API key needed)
 */
export async function analyzeContractWithAI(contractText: string): Promise<AIContractAnalysis> {
  const provider = process.env.LLM_PROVIDER || 'huggingface';
  const model = process.env.LLM_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  const apiKey = process.env.LLM_API_KEY; // Optional for Hugging Face

  // Limit text to first 3000 characters to avoid token limits
  const truncatedText = contractText.substring(0, 3000);

  const prompt = `You are an expert contract analyst specializing in influencer-brand collaboration agreements. Analyze the following contract text and provide a detailed analysis in JSON format.

CONTRACT TEXT:
${truncatedText}

Analyze this contract and return ONLY a valid JSON object with this exact structure:
{
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
    "exclusivity": "<exclusivity period>"
  },
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Focus on:
- Payment terms and schedules
- Exclusivity clauses (flag if > 30 days)
- IP rights and ownership
- Termination clauses (flag unfair penalties)
- Deliverables and timelines
- Any unfair terms or red flags

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
    return analysis;
  } catch (error: any) {
    console.error('[AIContractAnalysis] AI analysis failed:', error);
    throw error;
  }
}

/**
 * Call Hugging Face API (free, no API key needed for public models)
 */
async function callHuggingFace(model: string, prompt: string, apiKey?: string): Promise<string> {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
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
  });

  if (!response.ok) {
    // Check if model is loading
    if (response.status === 503) {
      const errorData = await response.json().catch(() => ({}));
      const estimatedTime = errorData.estimated_time || 30;
      throw new Error(`Model is loading. Please wait ${estimatedTime} seconds and try again.`);
    }
    
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Hugging Face API error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  
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

  throw new Error('Unexpected response format from Hugging Face');
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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Together AI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Call Google Gemini API (requires API key)
 */
async function callGemini(model: string, prompt: string, apiKey: string): Promise<string> {
  // Use gemini-2.0-flash as default (gemini-pro is deprecated)
  const modelName = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
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

