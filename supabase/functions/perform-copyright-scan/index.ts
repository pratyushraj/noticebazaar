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
    const { query, platforms } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !query || !platforms || !Array.isArray(platforms)) {
      return new Response(JSON.stringify({ error: 'Missing query, platforms (array), or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
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

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const creatorId = user.id;

    // --- Simulate Copyright Scan ---
    // In a real scenario, this would integrate with actual content ID APIs or web scrapers.
    // For this simulation, we'll return mock results based on the query.

    const mockAlerts = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('video') || lowerQuery.includes('tutorial')) {
      mockAlerts.push({
        id: 'alert-1',
        description: `Unauthorized repost of "${query}" found on YouTube.`,
        platform: 'YouTube',
        infringingUrl: 'https://youtube.com/watch?v=infringing_video_id',
        infringingUser: 'CopyCat Channel',
        originalContentUrl: 'https://youtube.com/watch?v=your_original_video_id',
      });
    }
    if (lowerQuery.includes('image') || lowerQuery.includes('photo')) {
      mockAlerts.push({
        id: 'alert-2',
        description: `Stolen image "${query}" detected on Instagram.`,
        platform: 'Instagram',
        infringingUrl: 'https://instagram.com/p/infringing_post_id',
        infringingUser: 'ImageThief',
        originalContentUrl: 'https://instagram.com/p/your_original_post_id',
      });
    }
    if (lowerQuery.includes('tiktok') || lowerQuery.includes('short')) {
      mockAlerts.push({
        id: 'alert-3',
        description: `2 Videos Reposted on TikTok.`,
        platform: 'TikTok',
        infringingUrl: 'https://tiktok.com/@infringing_user/video/infringing_video_id',
        infringingUser: 'TikTokPirate',
        originalContentUrl: 'https://tiktok.com/@your_user/video/your_original_video_id',
      });
    }

    // If no specific matches, return a generic alert
    if (mockAlerts.length === 0) {
      mockAlerts.push({
        id: 'alert-generic',
        description: `No immediate matches found for "${query}" across selected platforms.`,
        platform: 'N/A',
        infringingUrl: 'N/A',
        infringingUser: 'N/A',
        originalContentUrl: 'N/A',
      });
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      client_id: creatorId,
      description: `Performed copyright scan for "${query}" on ${platforms.join(', ')}. Found ${mockAlerts.length} potential alerts.`,
    });

    return new Response(JSON.stringify({ alerts: mockAlerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Perform Copyright Scan Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});