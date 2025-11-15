import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !query) {
      return new Response(JSON.stringify({ error: 'Missing query or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 1. Initialize Supabase Admin Client (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 2. Get User ID from JWT (using Service Role client to decode JWT)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // 3. Retrieve Contextual Data (Documents, Cases, Profile)
    const [documentsResult, casesResult, profileResult] = await Promise.all([
      supabaseAdmin
        .from('documents')
        .select('name, status, uploaded_at, categories(name), cases(title)')
        .eq('client_id', userId)
        .order('uploaded_at', { ascending: false })
        .limit(5),
      
      supabaseAdmin
        .from('cases')
        .select('title, status, deadline')
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),

      supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, business_name, gstin, business_entity_type')
        .eq('id', userId)
        .single(),
    ]);

    if (documentsResult.error) throw documentsResult.error;
    if (casesResult.error) throw casesResult.error;

    const profileData = profileResult.data || {};
    
    const documentsContext = documentsResult.data.map(doc => ({
      name: doc.name,
      status: doc.status,
      uploaded: new Date(doc.uploaded_at).toLocaleDateString(),
      category: doc.categories?.name || 'N/A',
      case: doc.cases?.title || 'N/A',
    }));

    const casesContext = casesResult.data.map(c => ({
      title: c.title,
      status: c.status,
      deadline: c.deadline ? new Date(c.deadline).toLocaleDateString() : 'N/A',
    }));

    // 4. Construct the LLM Prompt
    const systemPrompt = `You are Lexi, a highly secure and helpful Digital Paralegal for NoticeBazaar. Your primary function is to answer client queries based ONLY on the provided context about their Secure Vault (documents, cases, and profile).
    
    RULES:
    1. NEVER provide legal advice, financial advice, or tax advice. If the user asks for advice, politely state: "That is a question for your dedicated legal or CA advisor. I recommend booking a consultation."
    2. If the answer is not explicitly contained in the provided context, state: "I cannot find that specific information in your Secure Vault data. Please check the Documents or Cases page for details."
    3. Keep responses concise, professional, and focused on administrative status updates.
    4. Use the client's name and business name when appropriate.
    
    Client Profile: ${JSON.stringify(profileData)}
    Recent Documents (Max 5): ${JSON.stringify(documentsContext)}
    Active Cases (Max 3): ${JSON.stringify(casesContext)}
    `;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ];

    // 5. Call OpenAI API
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY secret is not configured.');
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error('OpenAI API Error:', openaiData);
      throw new Error(openaiData.error?.message || 'Failed to get response from LLM.');
    }

    const llmResponse = openaiData.choices[0].message.content;

    return new Response(JSON.stringify({ response: llmResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Secure Vault Query Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});