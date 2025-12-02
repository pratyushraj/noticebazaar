import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, provider = 'huggingface', model, apiKey, temperature = 0.7, maxTokens = 500 } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let response: Response;
    let generatedText = '';
    
    if (provider === 'huggingface') {
      // Hugging Face router endpoint now requires authentication
      if (!apiKey) {
        throw new Error('Hugging Face API key is now required. Get a free token at https://huggingface.co/settings/tokens or switch to Groq provider (also free, faster).');
      }
      
      // Try Inference Endpoints API first (more reliable)
      const endpoint = `https://api-inference.huggingface.co/models/${model || 'mistralai/Mistral-7B-Instruct-v0.2'}`;
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature,
            return_full_text: false,
          },
        }),
      });
      
      // If Inference API fails, try router endpoint
      if (!response.ok && response.status === 410) {
        // 410 means Inference API is deprecated, try router
        const routerEndpoint = `https://router.huggingface.co/models/${model || 'mistralai/Mistral-7B-Instruct-v0.2'}`;
        response = await fetch(routerEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: maxTokens,
              temperature,
              return_full_text: false,
            },
          }),
        });
      }

      if (!response.ok) {
        if (response.status === 503) {
          // Model is loading, wait and retry once
          await new Promise(resolve => setTimeout(resolve, 5000));
          response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_new_tokens: maxTokens,
                temperature,
                return_full_text: false,
              },
            }),
          });
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        generatedText = data[0].generated_text;
      } else if (data.generated_text) {
        generatedText = data.generated_text;
      } else {
        throw new Error('Unexpected response format from Hugging Face');
      }
      
    } else if (provider === 'groq') {
      if (!apiKey) {
        throw new Error('Groq API key required');
      }
      
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      generatedText = data.choices[0]?.message?.content || '';
      
    } else if (provider === 'together') {
      if (!apiKey) {
        throw new Error('Together AI API key required');
      }
      
      response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Together AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      generatedText = data.choices[0]?.message?.content || '';
      
    } else if (provider === 'openai') {
      if (!apiKey) {
        throw new Error('OpenAI API key required');
      }
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      generatedText = data.choices[0]?.message?.content || '';
      
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('Generate email error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate email' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

