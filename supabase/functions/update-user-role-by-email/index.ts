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
    const { email, newRole } = await req.json();

    if (!email || !newRole) {
      return new Response(JSON.stringify({ error: 'Missing email or newRole in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validate newRole against allowed roles
    const allowedRoles = ['client', 'admin', 'chartered_accountant', 'creator'];
    if (!allowedRoles.includes(newRole)) {
      return new Response(JSON.stringify({ error: `Invalid role: ${newRole}. Allowed roles are: ${allowedRoles.join(', ')}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the service role key
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

    // 1. Find the user by email in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (userError || !userData?.user) {
      console.error('Error finding user by email:', userError?.message || 'User not found');
      return new Response(JSON.stringify({ error: `User with email ${email} not found.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const userId = userData.user.id;

    // 2. Update the role in the public.profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile role:', profileError.message);
      return new Response(JSON.stringify({ error: `Failed to update role for user ${email}: ${profileError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: `Role for ${email} updated to ${newRole} successfully.`, profile: profileData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Request processing error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});