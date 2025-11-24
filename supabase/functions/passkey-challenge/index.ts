import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Generate a random challenge for WebAuthn
function generateChallenge(): Uint8Array {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array;
}

// Convert Uint8Array to Base64URL
function base64URLEncode(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Handle both GET and POST - check if email is provided
    const body = req.method === 'POST' ? await req.json() : {};
    const { email } = body;

    if (!email) {
      // Generate challenge for registration (no email = registration mode)
      const challenge = generateChallenge();
      const challengeBase64 = base64URLEncode(challenge);

      return new Response(JSON.stringify({ 
        challenge: challengeBase64,
        rpId: new URL(Deno.env.get('SUPABASE_URL') || '').hostname,
        userId: null, // Will be set by client for registration
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Authentication mode (email provided)
    if (email) {
      
      if (!email) {
        return new Response(JSON.stringify({ error: 'Missing email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

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

      // Find user by email
      const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      if (userError) {
        return new Response(JSON.stringify({ error: 'Failed to find user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      const user = users.find(u => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      // Get user's passkeys
      const { data: passkeys, error: passkeyError } = await supabaseAdmin
        .from('passkeys')
        .select('credential_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (passkeyError) {
        return new Response(JSON.stringify({ error: 'Failed to fetch passkeys' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      // Generate challenge for authentication
      const challenge = generateChallenge();
      const challengeBase64 = base64URLEncode(challenge);

      // Convert credential IDs to ArrayBuffer format for WebAuthn
      const allowCredentials = passkeys?.map(pk => ({
        id: pk.credential_id,
        type: 'public-key',
      })) || [];

      return new Response(JSON.stringify({ 
        challenge: challengeBase64,
        rpId: new URL(Deno.env.get('SUPABASE_URL') || '').hostname,
        allowCredentials: allowCredentials,
        userId: user.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error: any) {
    console.error('Error in passkey-challenge:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

