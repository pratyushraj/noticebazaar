import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
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
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // Fetch user's social accounts
    const { data: accounts, error: fetchError } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      throw fetchError;
    }

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No social accounts linked',
        results: {}
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const results: any = {};

    // Sync each account
    for (const account of accounts) {
      try {
        let updatedData: any = {};

        // Check if token is expired and refresh if needed
        if (account.token_expiry && new Date(account.token_expiry) < new Date()) {
          // Refresh token logic (platform-specific)
          // For now, we'll skip expired tokens
          console.log(`Token expired for ${account.platform}, skipping sync`);
          continue;
        }

        // Fetch current stats based on platform
        switch (account.platform) {
          case 'instagram': {
            if (account.access_token && account.account_id) {
              const response = await fetch(`https://graph.facebook.com/v18.0/${account.account_id}?fields=username,profile_picture_url,followers_count&access_token=${account.access_token}`);
              const data = await response.json();
              if (data.followers_count !== undefined) {
                updatedData = {
                  follower_count: data.followers_count,
                  account_username: data.username || account.account_username,
                  profile_picture_url: data.profile_picture_url || account.profile_picture_url,
                  last_synced_at: new Date().toISOString(),
                };
                results.instagram = { followers: data.followers_count };
              }
            }
            break;
          }
          case 'youtube': {
            if (account.access_token && account.account_id) {
              const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?id=${account.account_id}&part=statistics,snippet&access_token=${account.access_token}`);
              const data = await response.json();
              if (data.items && data.items.length > 0) {
                const channel = data.items[0];
                updatedData = {
                  follower_count: parseInt(channel.statistics.subscriberCount || '0'),
                  account_username: channel.snippet.title || account.account_username,
                  profile_picture_url: channel.snippet.thumbnails?.default?.url || account.profile_picture_url,
                  last_synced_at: new Date().toISOString(),
                };
                results.youtube = { subscribers: parseInt(channel.statistics.subscriberCount || '0') };
              }
            }
            break;
          }
          case 'tiktok': {
            // TikTok API implementation
            if (account.access_token) {
              const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count', {
                headers: {
                  'Authorization': `Bearer ${account.access_token}`,
                },
              });
              const data = await response.json();
              if (data.data && data.data.user) {
                const user = data.data.user;
                updatedData = {
                  follower_count: user.follower_count || 0,
                  account_username: user.display_name || account.account_username,
                  profile_picture_url: user.avatar_url || account.profile_picture_url,
                  last_synced_at: new Date().toISOString(),
                };
                results.tiktok = { followers: user.follower_count || 0 };
              }
            }
            break;
          }
          case 'twitter': {
            if (account.access_token && account.account_id) {
              const response = await fetch(`https://api.twitter.com/2/users/${account.account_id}?user.fields=public_metrics,profile_image_url,username`, {
                headers: {
                  'Authorization': `Bearer ${account.access_token}`,
                },
              });
              const data = await response.json();
              if (data.data && data.data.public_metrics) {
                updatedData = {
                  follower_count: data.data.public_metrics.followers_count || 0,
                  account_username: data.data.username || account.account_username,
                  profile_picture_url: data.data.profile_image_url || account.profile_picture_url,
                  last_synced_at: new Date().toISOString(),
                };
                results.twitter = { followers: data.data.public_metrics.followers_count || 0 };
              }
            }
            break;
          }
        }

        // Update account in database
        if (Object.keys(updatedData).length > 0) {
          await supabaseAdmin
            .from('social_accounts')
            .update(updatedData)
            .eq('id', account.id);
        }

      } catch (error) {
        console.error(`Error syncing ${account.platform}:`, error);
        // Continue with other accounts
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Sync Social Accounts Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

