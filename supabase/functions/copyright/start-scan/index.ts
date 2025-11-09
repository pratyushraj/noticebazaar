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
    const { original_content_id } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !original_content_id) {
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

    // --- Step 1: Insert into copyright_scans (pending) ---
    const { data: scanData, error: scanInsertError } = await supabaseAdmin
      .from('copyright_scans')
      .insert({ content_id: original_content_id, scan_status: 'pending' })
      .select('id')
      .single();

    if (scanInsertError) throw scanInsertError;
    const scan_id = scanData.id;

    // --- Step 2-6: Simulate Fetching, Fingerprinting, Searching, Matching, and Storing ---
    // In a real app, this would trigger an asynchronous background job (e.g., a queue worker).
    // For this mock, we simulate the result immediately.

    const mockMatches = [
      { matched_url: 'https://youtube.com/stolen-video-1', platform: 'YouTube', similarity_score: 92, screenshot_url: 'https://example.com/mock-screenshot-1.jpg' },
      { matched_url: 'https://instagram.com/repost-image-2', platform: 'Instagram', similarity_score: 75, screenshot_url: 'https://example.com/mock-screenshot-2.jpg' },
    ];
    
    const matchesToInsert = mockMatches.map(match => ({
        ...match,
        scan_id: scan_id,
    }));

    const { error: matchesInsertError } = await supabaseAdmin
        .from('copyright_matches')
        .insert(matchesToInsert);

    if (matchesInsertError) throw matchesInsertError;

    // --- Step 7: Update scan_status = "completed" ---
    const { error: scanUpdateError } = await supabaseAdmin
      .from('copyright_scans')
      .update({ scan_status: 'completed' })
      .eq('id', scan_id);

    if (scanUpdateError) throw scanUpdateError;

    // --- Step 8: Trigger alerts (Mock activity log) ---
    await supabaseAdmin.from('activity_log').insert({
      client_id: creatorId,
      description: `Copyright scan completed for content ${original_content_id}. Found ${mockMatches.length} matches.`,
    });

    return new Response(JSON.stringify({ scan_id, number_of_matches: mockMatches.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Start Copyright Scan Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});