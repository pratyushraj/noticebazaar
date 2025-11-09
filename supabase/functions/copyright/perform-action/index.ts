import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
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
    const { match_id, action_type } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !match_id || !action_type) {
      return new Response(JSON.stringify({ error: 'Missing match ID, action type, or authorization header' }), {
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

    // --- Step 1: Fetch match details (and implicitly check RLS via join) ---
    const { data: matchData, error: matchError } = await supabaseAdmin
        .from('copyright_matches')
        .select('*, copyright_scans(content_id, original_content(user_id, original_url))')
        .eq('id', match_id)
        .single();

    if (matchError || !matchData || matchData.copyright_scans?.original_content?.user_id !== creatorId) {
        return new Response(JSON.stringify({ error: 'Match not found or unauthorized.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    // --- Step 2-4: Generate AI Draft / Send Email (Mock) ---
    let document_url = null;
    let status = 'sent';
    let responseMessage = '';

    if (action_type === 'takedown') {
        // Mock PDF generation and storage
        document_url = `https://example.com/takedown-notice-${match_id}.pdf`;
        responseMessage = 'Takedown Notice generated and sent to platform.';
    } else if (action_type === 'email') {
        // Mock email sending
        responseMessage = 'Infringement Email drafted and sent to platform/user.';
    } else if (action_type === 'ignored') {
        status = 'ignored';
        responseMessage = 'Match ignored.';
    } else {
        return new Response(JSON.stringify({ error: 'Invalid action type.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // --- Step 5: Save a record to copyright_actions ---
    const { error: actionInsertError } = await supabaseAdmin
        .from('copyright_actions')
        .insert({ match_id, action_type, status })
        .select('id')
        .single();

    if (actionInsertError) throw actionInsertError;

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      client_id: creatorId,
      description: `Performed copyright action: ${action_type} on match ${match_id}.`,
    });

    return new Response(JSON.stringify({ status: 'success', message: responseMessage, document_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Perform Copyright Action Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});