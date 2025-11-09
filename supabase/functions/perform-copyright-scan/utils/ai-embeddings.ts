// AI Embeddings Implementation
// Uses Gemini or OpenAI for semantic similarity, commentary detection, remix detection

import { AIEmbedding } from '../types.ts';

/**
 * Generate semantic embedding using OpenAI
 */
export async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, using mock embedding');
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating OpenAI embedding:', error);
    // Fallback to mock
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }
}

/**
 * Generate semantic embedding using Google Gemini
 */
export async function generateGeminiEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, using mock embedding');
    return Array(768).fill(0).map(() => Math.random() * 2 - 1);
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: {
            parts: [{ text }],
          },
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('Error generating Gemini embedding:', error);
    // Fallback to mock
    return Array(768).fill(0).map(() => Math.random() * 2 - 1);
  }
}

/**
 * Compare two embeddings using cosine similarity
 */
export function compareEmbeddings(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Detect if content is commentary/transformative using AI
 */
export async function detectCommentary(
  originalText: string,
  candidateText: string,
  provider: 'gemini' | 'openai' = 'openai'
): Promise<number> {
  // Score 0-1: 0 = direct copy, 1 = transformative commentary
  
  const prompt = `Analyze if the following content is transformative commentary or a direct repost:

Original: "${originalText}"
Candidate: "${candidateText}"

Respond with a score from 0.0 to 1.0 where:
- 0.0-0.3 = Direct repost/copy
- 0.4-0.6 = Partial reuse with some changes
- 0.7-1.0 = Transformative commentary/remix

Score only:`;
  
  try {
    if (provider === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) return 0.5; // Default neutral
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const scoreText = data.choices[0].message.content.trim();
        const score = parseFloat(scoreText);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      }
    } else {
      // Gemini
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) return 0.5;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const scoreText = data.candidates[0].content.parts[0].text.trim();
        const score = parseFloat(scoreText);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      }
    }
  } catch (error) {
    console.error('Error detecting commentary:', error);
  }
  
  return 0.5; // Default neutral
}

/**
 * Detect if content is a remix using AI
 */
export async function detectRemix(
  originalText: string,
  candidateText: string,
  provider: 'gemini' | 'openai' = 'openai'
): Promise<number> {
  // Score 0-1: 0 = not a remix, 1 = clear remix
  
  const prompt = `Analyze if the candidate content is a remix of the original:

Original: "${originalText}"
Candidate: "${candidateText}"

Respond with a score from 0.0 to 1.0 where:
- 0.0-0.3 = Not a remix (different content)
- 0.4-0.6 = Possibly inspired by original
- 0.7-1.0 = Clear remix/adaptation

Score only:`;
  
  try {
    if (provider === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) return 0.5;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const scoreText = data.choices[0].message.content.trim();
        const score = parseFloat(scoreText);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      }
    } else {
      // Gemini
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) return 0.5;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const scoreText = data.candidates[0].content.parts[0].text.trim();
        const score = parseFloat(scoreText);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      }
    }
  } catch (error) {
    console.error('Error detecting remix:', error);
  }
  
  return 0.5; // Default neutral
}

/**
 * Generate complete AI embedding analysis
 */
export async function generateAIEmbedding(
  originalText: string,
  candidateText: string,
  provider: 'gemini' | 'openai' = 'openai'
): Promise<AIEmbedding> {
  // Generate semantic embeddings
  const semanticOriginal = provider === 'openai'
    ? await generateOpenAIEmbedding(originalText)
    : await generateGeminiEmbedding(originalText);
  
  const semanticCandidate = provider === 'openai'
    ? await generateOpenAIEmbedding(candidateText)
    : await generateGeminiEmbedding(candidateText);
  
  const semantic = compareEmbeddings(semanticOriginal, semanticCandidate);
  
  // Detect commentary and remix
  const commentary = await detectCommentary(originalText, candidateText, provider);
  const remix = await detectRemix(originalText, candidateText, provider);
  
  return {
    semantic: semanticCandidate, // Return candidate embedding
    commentary,
    remix,
    provider,
  };
}

