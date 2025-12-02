import { useState } from 'react';
import { logger } from '@/lib/utils/logger';

// Free Online LLM Providers
type LLMProvider = 'ollama' | 'huggingface' | 'groq' | 'together' | 'openai';

// Configuration - defaults to Groq (free, fast, requires free API key)
// Hugging Face now requires API key, so Groq is the better free default
const DEFAULT_PROVIDER: LLMProvider = (import.meta.env.VITE_LLM_PROVIDER as LLMProvider) || 'groq';
const DEFAULT_MODEL = import.meta.env.VITE_LLM_MODEL || 'llama-3.1-8b-instant';

// Provider endpoints
const PROVIDER_ENDPOINTS: Record<LLMProvider, string> = {
  ollama: 'http://localhost:11434/api/generate',
  huggingface: 'https://api-inference.huggingface.co/models', // Falls back to router if needed
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
};

interface LLMOptions {
  provider?: LLMProvider;
  model?: string;
  apiKey?: string; // Optional for Hugging Face, required for others
  temperature?: number;
  maxTokens?: number;
}

interface GenerateEmailOptions {
  brandName: string;
  dealTitle?: string;
  context?: string; // User's initial message or context
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  purpose?: 'deliverable_question' | 'payment_question' | 'general' | 'follow_up';
}

export const useLocalLLM = (options: LLMOptions = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = options.provider || DEFAULT_PROVIDER;
  const model = options.model || DEFAULT_MODEL;
  const apiKey = options.apiKey || import.meta.env.VITE_LLM_API_KEY;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 500;

  const generateEmail = async (emailOptions: GenerateEmailOptions): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = buildEmailPrompt(emailOptions);
      let generatedText = '';

      switch (provider) {
        case 'huggingface':
          generatedText = await generateWithHuggingFace(model, prompt, apiKey, temperature, maxTokens);
          break;
        case 'groq':
          generatedText = await generateWithGroq(model, prompt, apiKey, temperature, maxTokens);
          break;
        case 'together':
          generatedText = await generateWithTogether(model, prompt, apiKey, temperature, maxTokens);
          break;
        case 'openai':
          generatedText = await generateWithOpenAI(model, prompt, apiKey, temperature, maxTokens);
          break;
        case 'ollama':
        default:
          generatedText = await generateWithOllama(model, prompt, temperature, maxTokens);
          break;
      }

      const cleanedText = cleanGeneratedText(generatedText);
      return cleanedText;
    } catch (err: any) {
      logger.error('LLM generation error', err);
      const errorMessage = err.message || 'Failed to generate email. Please check your LLM configuration.';
      setError(errorMessage);
      return generateFallbackEmail(emailOptions);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmailSuggestion = async (
    partialMessage: string,
    options: Omit<GenerateEmailOptions, 'context'>
  ): Promise<string> => {
    return generateEmail({
      ...options,
      context: partialMessage,
    });
  };

  return {
    generateEmail,
    generateEmailSuggestion,
    isGenerating,
    error,
    provider, // Expose current provider
  };
};

// Helper function to call Supabase Edge Function (avoids CORS)
async function generateViaEdgeFunction(
  provider: 'huggingface' | 'groq' | 'together' | 'openai',
  model: string,
  prompt: string,
  apiKey?: string,
  temperature: number = 0.7,
  maxTokens: number = 500
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing. Please check your environment variables.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      prompt,
      provider,
      model,
      apiKey,
      temperature,
      maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to generate email: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text || '';
}

// Hugging Face (FREE, no API key needed for public models)
// Uses Supabase Edge Function to avoid CORS issues
async function generateWithHuggingFace(model: string, prompt: string, apiKey?: string, temperature: number = 0.7, maxTokens: number = 500): Promise<string> {
  return generateViaEdgeFunction('huggingface', model, prompt, apiKey, temperature, maxTokens);
}

// Groq (FREE tier, very fast, requires API key)
// Uses Supabase Edge Function to avoid CORS issues
async function generateWithGroq(model: string, prompt: string, apiKey: string, temperature: number, maxTokens: number): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API key required. Get one free at https://console.groq.com');
  }
  return generateViaEdgeFunction('groq', model, prompt, apiKey, temperature, maxTokens);
}

// Together AI (FREE tier, requires API key)
// Uses Supabase Edge Function to avoid CORS issues
async function generateWithTogether(model: string, prompt: string, apiKey: string, temperature: number, maxTokens: number): Promise<string> {
  if (!apiKey) {
    throw new Error('Together AI API key required. Get one free at https://together.ai');
  }
  return generateViaEdgeFunction('together', model, prompt, apiKey, temperature, maxTokens);
}

// OpenAI (Limited free tier, requires API key)
// Uses Supabase Edge Function to avoid CORS issues
async function generateWithOpenAI(model: string, prompt: string, apiKey: string, temperature: number, maxTokens: number): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI API key required');
  }
  return generateViaEdgeFunction('openai', model, prompt, apiKey, temperature, maxTokens);
}

// Ollama (Local)
async function generateWithOllama(model: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  const response = await fetch(PROVIDER_ENDPOINTS.ollama, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'llama3.2',
      prompt,
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.response || data.text || '';
}

function buildEmailPrompt(options: GenerateEmailOptions): string {
  const { brandName, dealTitle, context, tone = 'professional', purpose = 'general' } = options;

  const toneInstructions = {
    professional: 'professional and courteous',
    friendly: 'warm and friendly',
    formal: 'formal and respectful',
    casual: 'casual and conversational',
  };

  const purposeContext = {
    deliverable_question: 'asking about deliverables, timelines, or requirements',
    payment_question: 'asking about payment status, invoices, or payment terms',
    general: 'general inquiry or communication',
    follow_up: 'following up on a previous conversation',
  };

  return `You are an AI assistant helping a content creator write professional emails to brands.

Brand Name: ${brandName}
${dealTitle ? `Deal/Campaign: ${dealTitle}` : ''}
Purpose: ${purposeContext[purpose]}
Tone: ${toneInstructions[tone]}

${context ? `User's initial message/context: "${context}"` : ''}

Write a clear, concise, and professional email to ${brandName}. The email should:
- Be ${toneInstructions[tone]}
- Be specific and actionable
- Include a clear subject line suggestion
- Be 2-4 paragraphs maximum
- Include a professional greeting and closing
- Address the purpose: ${purposeContext[purpose]}

${context ? 'Use the user\'s context as a starting point, but expand it into a complete professional email.' : 'Write a complete email from scratch.'}

Format the response as:
SUBJECT: [subject line]

[email body]

Do not include any meta-commentary or explanations, just the email content.`;
}

function cleanGeneratedText(text: string): string {
  // Remove common LLM artifacts
  let cleaned = text
    .replace(/^SUBJECT:\s*/i, '')
    .replace(/^Subject:\s*/i, '')
    .replace(/^Email:\s*/i, '')
    .replace(/^Here's.*?:/i, '')
    .replace(/^Here is.*?:/i, '')
    .trim();

  // Extract subject if present
  const subjectMatch = cleaned.match(/^SUBJECT:\s*(.+?)(?:\n|$)/i);
  if (subjectMatch) {
    cleaned = cleaned.replace(/^SUBJECT:\s*.+?\n/i, '');
  }

  return cleaned.trim();
}

function generateFallbackEmail(options: GenerateEmailOptions): string {
  const { brandName, dealTitle, context, tone = 'professional', purpose = 'general' } = options;

  const greetings = {
    professional: 'Dear',
    friendly: 'Hi',
    formal: 'Dear',
    casual: 'Hey',
  };

  const closings = {
    professional: 'Best regards',
    friendly: 'Best',
    formal: 'Sincerely',
    casual: 'Thanks',
  };

  const purposeTemplates = {
    deliverable_question: `I hope this email finds you well. I'm reaching out regarding the deliverables for ${dealTitle || 'our collaboration'}.

${context || 'I have a few questions about the requirements and timeline.'}

Could you please provide clarification on the following:
- Deliverable specifications
- Timeline expectations
- Any specific requirements or guidelines

Thank you for your time, and I look forward to your response.`,
    payment_question: `I hope this email finds you well. I'm writing to inquire about the payment status for ${dealTitle || 'our collaboration'}.

${context || 'I wanted to follow up on the payment schedule and ensure everything is on track.'}

Could you please provide an update on:
- Payment timeline
- Invoice status
- Any required documentation

Thank you for your attention to this matter.`,
    general: `I hope this email finds you well. ${context || 'I wanted to reach out regarding our collaboration.'}

${context ? '' : 'I have a few questions and would appreciate your guidance.'}

Thank you for your time and consideration.`,
    follow_up: `I wanted to follow up on our previous conversation regarding ${dealTitle || 'our collaboration'}.

${context || 'I wanted to check in and see if there are any updates or if you need any additional information from my side.'}

Please let me know if you have any questions or need anything else from me.`,
  };

  return `${greetings[tone]} ${brandName} Team,

${purposeTemplates[purpose]}

${closings[tone]},
[Your Name]`;
}
