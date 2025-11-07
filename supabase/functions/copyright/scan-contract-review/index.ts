import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contract_file_url, brand_name } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !contract_file_url || !brand_name) {
      return new Response(JSON.stringify({ error: 'Missing contract_file_url, brand_name, or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // --- Simulate AI Analysis ---
    const mockAnalysis = {
      summary: `AI analysis for contract with ${brand_name} completed. Found 5 potential risks.`,
      insights: [
        { type: 'missing_clause', description: 'Missing clear termination clause for creator-initiated cancellation.' },
        { type: 'risky_term', description: 'Broad "all rights" clause could impact future content usage. Recommend clarifying usage rights.' },
        { type: 'payment_mismatch', description: 'Payment terms in contract (Net 60) differ from expected (Net 30). Potential cash flow impact.' },
        { type: 'exclusivity_issue', description: 'Exclusivity clause is too broad (6 months across all platforms). Recommend narrowing scope.' },
        { type: 'termination_loophole', description: 'Brand can terminate without cause with 7-day notice, but creator cannot. Unbalanced.' },
      ],
      recommendations: 'Consult your legal advisor to review these insights and negotiate amendments.',
    };

    return new Response(JSON.stringify({ analysis: mockAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('AI Contract Scan Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});