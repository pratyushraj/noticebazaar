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
    const { query } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !query) {
      return new Response(JSON.stringify({ error: 'Missing query or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase Admin Client (Service Role)
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

    // Get User ID from JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // --- ENQUEUE JOB INSTEAD OF DIRECT EXECUTION ---
    
    const jobPayload = { query: query };
    
    // 1. Check Cache (using the same logic as the worker for consistency)
    const cacheKey = `${userId}:secure_vault_query:${JSON.stringify(jobPayload)}`;
    const { data: cachedData } = await supabaseAdmin
        .from('ai_cache')
        .select('response')
        .eq('cache_key', cacheKey)
        .maybeSingle();

    if (cachedData) {
        console.log("Cache hit for secure_vault_query.");
        return new Response(JSON.stringify({ response: cachedData.response.response }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // 2. Insert job into the queue
    const { data: jobData, error: insertError } = await supabaseAdmin
      .from('ai_request_queue')
      .insert({
        user_id: userId,
        job_type: 'secure_vault_query',
        payload: jobPayload,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting job into queue:', insertError.message);
      throw new Error('Failed to enqueue AI request.');
    }

    // 3. Return job ID immediately (non-blocking)
    return new Response(JSON.stringify({ jobId: jobData.id, status: 'queued' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202, // Accepted
    });

  } catch (error) {
    console.error('Secure Vault Query Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});