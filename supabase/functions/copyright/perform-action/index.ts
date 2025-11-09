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
    const { match_id, action_type, original_content_id } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !match_id || !action_type || !original_content_id) {
      return new Response(JSON.stringify({ error: 'Missing match ID, action type, original content ID, or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase Admin Client (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get User ID from JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const creatorId = user.id;

    // --- ENQUEUE JOB INSTEAD OF DIRECT EXECUTION ---
    
    const jobPayload = { match_id, action_type, original_content_id };
    
    // 1. Insert job into the queue
    const { data: jobData, error: insertError } = await supabaseAdmin
      .from('ai_request_queue')
      .insert({
        user_id: creatorId,
        job_type: 'copyright_action',
        payload: jobPayload,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting job into queue:', insertError.message);
      throw new Error('Failed to enqueue copyright action request.');
    }

    // 2. Return job ID immediately (non-blocking)
    return new Response(JSON.stringify({ jobId: jobData.id, status: 'queued' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202, // Accepted
    });

  } catch (error) {
    console.error('Perform Copyright Action Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});