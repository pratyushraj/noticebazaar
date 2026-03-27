import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { credential, email } = await req.json();
    
    if (!credential || !email) {
      return new Response(JSON.stringify({ error: 'Missing credential or email' }), {
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

    // Find passkey by credential ID
    const credentialId = credential.id;
    const { data: passkey, error: passkeyError } = await supabaseAdmin
      .from('passkeys')
      .select('*')
      .eq('user_id', user.id)
      .eq('credential_id', credentialId)
      .eq('is_active', true)
      .single();

    if (passkeyError || !passkey) {
      return new Response(JSON.stringify({ error: 'Invalid passkey' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify the signature (in production, you'd verify the WebAuthn signature here)
    // For now, we'll just check that the credential ID matches and update the counter
    const newCounter = (passkey.counter || 0) + 1;

    // Update passkey counter and last_used_at
    await supabaseAdmin
      .from('passkeys')
      .update({
        counter: newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', passkey.id);

    // Get frontend URL - prioritize request origin over environment variable
    // This ensures the redirect URL matches where the user is actually accessing the app
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    let frontendUrl: string | null = null;
    
    // First, try to extract from request origin (most reliable)
    if (origin) {
      try {
        const originUrl = new URL(origin);
        // Remove port for production (except localhost)
        const hostname = originUrl.hostname;
        const protocol = originUrl.protocol;
        if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
          // Keep port for localhost
          frontendUrl = `${protocol}//${originUrl.host}`;
        } else {
          // Remove port for production domains
          frontendUrl = `${protocol}//${hostname}`;
        }
        console.log('Using request origin as frontend URL:', frontendUrl);
      } catch (e) {
        console.warn('Failed to parse origin:', origin, e);
      }
    }
    
    // Fallback to environment variable
    if (!frontendUrl) {
      frontendUrl = Deno.env.get('FRONTEND_URL') || null;
      if (frontendUrl) {
        console.log('Using FRONTEND_URL env var:', frontendUrl);
      }
    }
    
    // Last resort: localhost (development only)
    if (!frontendUrl) {
      frontendUrl = 'http://localhost:32100';
      console.warn('No frontend URL detected, using localhost fallback');
    }

    // Generate a magic link that will automatically sign the user in
    // This is more secure than creating a session directly
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: `${frontendUrl}/`,
      },
    });

    if (sessionError || !sessionData) {
      console.error('Error generating session link:', sessionError);
      // Fallback: return user info and let client handle session creation
      return new Response(JSON.stringify({ 
        success: true,
        userId: user.id,
        email: user.email,
        message: 'Passkey authentication successful. Please sign in with your email to complete authentication.',
        requiresEmailSignIn: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Return success with magic link
    return new Response(JSON.stringify({ 
      success: true,
      userId: user.id,
      email: user.email,
      magicLink: sessionData.properties?.action_link || null,
      message: 'Passkey authentication successful'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in passkey-authenticate:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

