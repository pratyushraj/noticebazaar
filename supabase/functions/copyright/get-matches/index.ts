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
    const { content_id } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !content_id) {
      return new Response(JSON.stringify({ error: 'Missing content ID or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const creatorId = user.id;

    // Fetch the latest scan ID for this content
    const { data: latestScan, error: scanError } = await supabaseAdmin
        .from('copyright_scans')
        .select('id')
        .eq('content_id', content_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (scanError || !latestScan) {
        return new Response(JSON.stringify({ matches: [], error: 'No completed scans found for this content.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // Fetch matches for the latest scan, joining actions
    const { data: matches, error: matchesError } = await supabaseAdmin
        .from('copyright_matches')
        .select('*, copyright_actions(*)')
        .eq('scan_id', latestScan.id)
        .order('similarity_score', { ascending: false });

    if (matchesError) throw matchesError;

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Get Copyright Matches Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});