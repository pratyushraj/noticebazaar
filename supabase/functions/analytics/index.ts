import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 requests per minute per user
const RATE_LIMIT_MAX_EVENTS = 50; // Max 50 events per request

// In-memory rate limit store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check rate limit for a user
 */
function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `user:${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Generate request hash for replay protection
 */
function generateRequestHash(userId: string, event: string, timestamp: number, metadata: any): string {
  const data = `${userId}:${event}:${timestamp}:${JSON.stringify(metadata)}`;
  // Simple hash (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract device info from request headers
 */
function extractDeviceInfo(req: Request): {
  userAgent: string | null;
  ip: string | null;
  referer: string | null;
  language: string | null;
} {
  return {
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
    referer: req.headers.get('referer'),
    language: req.headers.get('accept-language'),
  };
}

/**
 * Detect potential fraud/anomalies
 */
function detectAnomalies(
  userId: string,
  event: string,
  metadata: any,
  deviceInfo: ReturnType<typeof extractDeviceInfo>
): { isAnomaly: boolean; reason?: string } {
  // Check for suspicious patterns
  if (event.includes('tutorial') && metadata?.time_spent && metadata.time_spent < 100) {
    // Tutorial completed in less than 100ms is suspicious
    return { isAnomaly: true, reason: 'suspicious_timing' };
  }

  if (metadata?.step_number && metadata.step_number > metadata?.total_steps) {
    // Invalid step number
    return { isAnomaly: true, reason: 'invalid_step_number' };
  }

  // Check for rapid-fire events (same event multiple times in quick succession)
  // This would require additional state tracking in production

  return { isAnomaly: false };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
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

    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = user.id;
    const body = await req.json();
    
    // Validate request body
    const { event, metadata = {}, timestamp, page_url } = body;
    
    if (!event || typeof event !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid event name' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Handle batch events (array of events)
    const events = Array.isArray(body.events) ? body.events : [{ event, metadata, timestamp, page_url }];
    
    if (events.length > RATE_LIMIT_MAX_EVENTS) {
      return new Response(JSON.stringify({ error: `Too many events. Maximum ${RATE_LIMIT_MAX_EVENTS} per request` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retry_after: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
          status: 429,
        }
      );
    }

    // Extract device info
    const deviceInfo = extractDeviceInfo(req);

    // Process each event
    const processedEvents = [];
    const anomalies = [];

    for (const eventData of events) {
      const { event: eventName, metadata: eventMetadata = {}, timestamp: eventTimestamp, page_url: eventPageUrl } = eventData;
      
      // Use provided timestamp or current time
      const eventTime = eventTimestamp ? new Date(eventTimestamp) : new Date();
      
      // Detect anomalies
      const anomalyCheck = detectAnomalies(userId, eventName, eventMetadata, deviceInfo);
      if (anomalyCheck.isAnomaly) {
        anomalies.push({
          event: eventName,
          reason: anomalyCheck.reason,
        });
        // Continue processing but mark as anomaly
      }

      // Generate request hash for replay protection
      const requestHash = generateRequestHash(
        userId,
        eventName,
        eventTime.getTime(),
        eventMetadata
      );

      // Insert into analytics table
      const { error: insertError } = await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_name: eventName,
          event_category: eventMetadata?.category || 'general',
          metadata: eventMetadata,
          page_url: eventPageUrl || null,
          user_agent: deviceInfo.userAgent,
          ip_address: deviceInfo.ip,
          referer: deviceInfo.referer,
          language: deviceInfo.language,
          request_hash: requestHash,
          is_anomaly: anomalyCheck.isAnomaly,
          anomaly_reason: anomalyCheck.reason || null,
          created_at: eventTime.toISOString(),
        });

      if (insertError) {
        console.error('Error inserting analytics event:', insertError);
        // Continue processing other events even if one fails
      } else {
        processedEvents.push({
          event: eventName,
          timestamp: eventTime.toISOString(),
          hash: requestHash,
        });
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        processed: processedEvents.length,
        total: events.length,
        anomalies: anomalies.length > 0 ? anomalies : undefined,
        rate_limit: {
          remaining: rateLimit.remaining,
          reset_at: rateLimit.resetAt,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Analytics endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

