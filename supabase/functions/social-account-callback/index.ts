import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const platform = url.searchParams.get('platform') || url.searchParams.get('state')?.split('_')[0]; // Extract platform from state if needed
    
    if (error) {
      // Redirect to frontend with error
      return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:32100'}/creator-dashboard?social_error=${encodeURIComponent(error)}`, 302);
    }

    if (!code || !state) {
      return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:32100'}/creator-dashboard?social_error=missing_code_or_state`, 302);
    }

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

    // Extract user_id from state (in production, store state in DB with user_id)
    // For now, we'll need to pass user_id in state or use a session
    // This is a simplified version - in production, use a proper state management system
    
    // For this implementation, we'll need the user to be authenticated via a token
    // or store the state in a temporary table with user_id
    
    // Exchange code for tokens and fetch profile data
    let accountData: any = {};
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-account-callback`;
    
    // Determine platform from state or try to detect from callback
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      // Try to detect from the callback URL or token response
      // This is platform-specific logic
    }

    // Exchange code for access token (platform-specific)
    if (detectedPlatform === 'instagram' || !detectedPlatform) {
      // Try Instagram/Facebook first
      const appId = Deno.env.get('FACEBOOK_APP_ID');
      const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
      
      if (appId && appSecret) {
        try {
          // Exchange short-lived token for long-lived token
          const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
          const tokenData = await tokenResponse.json();
          
          if (tokenData.access_token) {
            const accessToken = tokenData.access_token;
            
            // Get user's pages
            const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
            const pagesData = await pagesResponse.json();
            
            if (pagesData.data && pagesData.data.length > 0) {
              const page = pagesData.data[0];
              const pageAccessToken = page.access_token;
              
              // Get Instagram Business Account
              const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`);
              const igData = await igResponse.json();
              
              if (igData.instagram_business_account) {
                const igId = igData.instagram_business_account.id;
                
                // Get IG account info
                const igInfoResponse = await fetch(`https://graph.facebook.com/v18.0/${igId}?fields=username,profile_picture_url,followers_count&access_token=${pageAccessToken}`);
                const igInfo = await igInfoResponse.json();
                
                accountData = {
                  platform: 'instagram',
                  account_id: igId,
                  account_username: igInfo.username,
                  access_token: pageAccessToken,
                  follower_count: igInfo.followers_count || 0,
                  profile_picture_url: igInfo.profile_picture_url,
                  token_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
                };
                detectedPlatform = 'instagram';
              }
            }
          }
        } catch (e) {
          console.error('Instagram OAuth error:', e);
        }
      }
    }

    if (detectedPlatform === 'youtube' || (!detectedPlatform && !accountData.platform)) {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      
      if (clientId && clientSecret) {
        try {
          // Exchange code for tokens
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            }),
          });
          const tokenData = await tokenResponse.json();
          
          if (tokenData.access_token) {
            // Get channel info
            const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?mine=true&part=statistics,snippet&access_token=${tokenData.access_token}`);
            const channelData = await channelResponse.json();
            
            if (channelData.items && channelData.items.length > 0) {
              const channel = channelData.items[0];
              accountData = {
                platform: 'youtube',
                account_id: channel.id,
                account_username: channel.snippet.title,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                follower_count: parseInt(channel.statistics.subscriberCount || '0'),
                profile_picture_url: channel.snippet.thumbnails?.default?.url,
                token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
              };
              detectedPlatform = 'youtube';
            }
          }
        } catch (e) {
          console.error('YouTube OAuth error:', e);
        }
      }
    }

    // Note: TikTok and Twitter OAuth implementations would go here
    // They follow similar patterns but with platform-specific endpoints

    if (!accountData.platform) {
      return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:32100'}/creator-dashboard?social_error=oauth_failed`, 302);
    }

    // For now, we need user_id - in production, store state with user_id in a temp table
    // This is a simplified version that requires the user to be passed via state
    // In a real implementation, you'd store: { state, user_id, platform } in a table
    
    // For this demo, we'll redirect to frontend with account data
    // Frontend will then call an API to save it with the authenticated user
    
    const accountDataEncoded = encodeURIComponent(JSON.stringify(accountData));
    return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:32100'}/creator-dashboard?social_success=true&account_data=${accountDataEncoded}`, 302);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Social Account Callback Error:', errorMessage);
    return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:32100'}/creator-dashboard?social_error=${encodeURIComponent(errorMessage)}`, 302);
  }
});

