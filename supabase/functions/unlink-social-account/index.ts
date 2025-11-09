import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !platform) {
      return new Response(JSON.stringify({ error: 'Missing platform or authorization header' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // Get account before deleting (for token revocation)
    const { data: account } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    // Revoke token if API supports it (platform-specific)
    if (account?.access_token) {
      try {
        switch (platform) {
          case 'instagram':
            // Facebook/Instagram token revocation
            if (account.access_token) {
              await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${account.access_token}`, {
                method: 'DELETE',
              });
            }
            break;
          case 'youtube':
            // Google token revocation
            if (account.access_token) {
              await fetch(`https://oauth2.googleapis.com/revoke?token=${account.access_token}`, {
                method: 'POST',
              });
            }
            break;
          // TikTok and Twitter may have their own revocation endpoints
        }
      } catch (error) {
        console.error(`Error revoking token for ${platform}:`, error);
        // Continue with deletion even if revocation fails
      }
    }

    // Delete account from database
    const { error: deleteError } = await supabaseAdmin
      .from('social_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `${platform} account unlinked successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unlink Social Account Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

