import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface PerformCopyrightScanRequest {
  query: string;
  platforms: string[];
}

interface CopyrightScanAlert {
  id: string;
  description: string;
  platform: string;
  infringingUrl: string;
  infringingUser: string;
  originalContentUrl: string;
  similarity_score?: number; // 0-1 scale
  screenshot_url?: string | null; // Thumbnail URL
}

interface PerformCopyrightScanResponse {
  alerts: CopyrightScanAlert[];
}

serve(async (req) => {
  // Handle CORS preflight - MUST be first and return 200
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Authenticate user via JWT from request headers
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
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

    // Parse request body
    let requestBody: PerformCopyrightScanRequest;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { query, platforms } = requestBody;

    if (!query || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing query or platforms' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // TODO: Implement actual copyright scan logic
    // For now, return mock data with similarity scores
    const alerts: CopyrightScanAlert[] = platforms.map((platform, index) => {
      // Generate varied similarity scores for demonstration
      const baseScore = 0.85 - (index * 0.15); // Vary scores: 0.85, 0.70, 0.55, etc.
      const similarityScore = Math.max(0.1, Math.min(0.95, baseScore));
      
      return {
        id: `alert-${Date.now()}-${index}`,
        description: `Potential copyright infringement found on ${platform}`,
        platform: platform,
        infringingUrl: `https://${platform.toLowerCase().replace(' ', '')}.com/infringing-content-${index + 1}`,
        infringingUser: 'user123',
        originalContentUrl: query,
        similarity_score: similarityScore, // Add similarity score
        screenshot_url: `https://via.placeholder.com/200x200?text=${platform}+Match`, // Mock thumbnail
      };
    });

    const response: PerformCopyrightScanResponse = {
      alerts,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Perform Copyright Scan Error:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

