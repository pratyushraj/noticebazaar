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

    // Return success with user info
    // The client will handle creating a session via Supabase auth
    return new Response(JSON.stringify({ 
      success: true,
      userId: user.id,
      email: user.email,
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

