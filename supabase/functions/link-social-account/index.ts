import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { encode } from "https://deno.land/std@0.200.0/encoding/base64url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { platform } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !platform) {
      return new Response(JSON.stringify({ error: 'Missing platform or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase Admin Client
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
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // Validate platform
    const validPlatforms = ['instagram', 'youtube', 'tiktok', 'twitter'];
    if (!validPlatforms.includes(platform)) {
      return new Response(JSON.stringify({ error: 'Invalid platform. Must be one of: instagram, youtube, tiktok, twitter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Generate state token (CSRF protection)
    const stateToken = encode(crypto.getRandomValues(new Uint8Array(32)));
    
    // Store pending auth session in database (optional: use a separate table or cache)
    // For now, we'll include state in the redirect URL and validate on callback
    
    // Get OAuth redirect URL based on platform
    let oauthUrl = '';
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-account-callback`;
    
    switch (platform) {
      case 'instagram': {
        const appId = Deno.env.get('FACEBOOK_APP_ID');
        const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
        if (!appId || !appSecret) {
          return new Response(JSON.stringify({ error: 'Facebook/Instagram OAuth not configured' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        // Instagram uses Facebook OAuth
        oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateToken}&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement`;
        break;
      }
      case 'youtube': {
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        if (!clientId) {
          return new Response(JSON.stringify({ error: 'Google OAuth not configured' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${stateToken}&access_type=offline&prompt=consent`;
        break;
      }
      case 'tiktok': {
        const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
        if (!clientKey) {
          return new Response(JSON.stringify({ error: 'TikTok OAuth not configured' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        oauthUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user.info.basic&state=${stateToken}`;
        break;
      }
      case 'twitter': {
        const clientId = Deno.env.get('TWITTER_CLIENT_ID');
        if (!clientId) {
          return new Response(JSON.stringify({ error: 'Twitter OAuth not configured' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        oauthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20users.read%20offline.access&state=${stateToken}&code_challenge=challenge&code_challenge_method=plain`;
        break;
      }
    }

    // Store state token temporarily (in a real app, use Redis or a database table)
    // For now, we'll pass it in the response and validate on callback
    
    return new Response(JSON.stringify({ 
      oauth_url: oauthUrl,
      state: stateToken,
      platform: platform
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Link Social Account Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

