import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Configuration ---
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second base delay (to enforce 1 RPM limit)

// --- Supabase Admin Client ---
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// --- Mock Gemini Call (Replace with actual fetch to Gemini API) ---
async function callGeminiApi(jobType: string, payload: any, userId: string): Promise<{ response: any, isRateLimited: boolean }> {
    // MOCK: Simulate rate limiting randomly for demonstration
    if (Math.random() < 0.1) { // 10% chance of rate limit
        console.log(`Job Type ${jobType}: Simulating Gemini Rate Limit (429)`);
        return { response: { error: "Rate Limit Exceeded (429)" }, isRateLimited: true };
    }

    // MOCK: Simulate successful response based on job type
    let response;
    if (jobType === 'secure_vault_query') {
        // This logic was previously in the query-secure-vault function
        response = { response: `Lexi found the answer to your query about ${payload.query}. (MOCK: Data derived from your vault context.)` };
    } else if (jobType === 'contract_scan') {
        // This logic was previously in the scan-contract-review function
        response = { 
            summary: `AI analysis for contract with ${payload.brand_name} completed. Found 5 potential risks.`,
            insights: [
                { type: 'missing_clause', description: 'Missing clear termination clause for creator-initiated cancellation.' },
                { type: 'risky_term', description: 'Broad "all rights" clause could impact future content usage. Recommend clarifying usage rights.' },
                { type: 'payment_mismatch', description: 'Payment terms in contract (Net 60) differ from expected (Net 30). Potential cash flow impact.' },
            ],
            recommendations: 'Consult your legal advisor to review these insights and negotiate amendments.',
        };
    } else if (jobType === 'copyright_action') {
        // This logic was previously in the perform-action function
        const { action_type, match_id } = payload;
        let document_url = null;
        let status = 'sent';
        let responseMessage = '';

        if (action_type === 'takedown') {
            document_url = `https://example.com/takedown-notice-${match_id}.pdf`;
            responseMessage = 'Takedown Notice generated and sent to platform.';
        } else if (action_type === 'email') {
            responseMessage = 'Infringement Email drafted and sent to platform/user.';
        } else if (action_type === 'ignored') {
            status = 'ignored';
            responseMessage = 'Match ignored.';
        } else {
            throw new Error('Invalid action type in payload.');
        }
        
        // Mock DB action (inserting copyright_actions)
        const { error: actionInsertError } = await supabaseAdmin
            .from('copyright_actions')
            .insert({ match_id, action_type, status, document_url })
            .select('id')
            .single();

        if (actionInsertError) throw actionInsertError;

        // Mock Activity Log
        await supabaseAdmin.from('activity_log').insert({
            client_id: userId,
            description: `Performed copyright action: ${action_type} on match ${match_id}. (via AI Worker)`,
        });

        response = { status: 'success', message: responseMessage, document_url };
    } else {
        response = { message: `Job type ${jobType} processed. (MOCK)` };
    }

    return { response, isRateLimited: false };
}

// --- Job Processing Logic ---
async function processJob(job: any) {
    const { id, job_type, payload, user_id } = job;
    let result: any = null;
    let status = 'completed';
    let retryCount = payload.retry_count || 0;

    try {
        // 1. Call Gemini API (or mock)
        const { response, isRateLimited } = await callGeminiApi(job_type, payload, user_id);

        if (isRateLimited) {
            if (retryCount < MAX_RETRIES) {
                // Exponential Backoff calculation
                const delaySeconds = Math.pow(2, retryCount); // 1, 2, 4, 8, 16
                const retryAfter = new Date(Date.now() + delaySeconds * 1000).toISOString();
                
                console.log(`Job ${id}: Rate limited. Retrying in ${delaySeconds}s.`);
                
                // Update job status to pending with increased retry count and retry_after timestamp
                await supabaseAdmin
                    .from('ai_request_queue')
                    .update({ 
                        status: 'pending', 
                        payload: { ...payload, retry_count: retryCount + 1, retry_after: retryAfter },
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', id);
                
                return { status: 'retrying' };
            } else {
                status = 'failed';
                result = { error: "Max retries reached due to rate limiting. Please contact support." };
                console.error(`Job ${id}: Failed after max retries.`);
            }
        } else {
            // Success: Store result and cache it if applicable
            result = response;
            
            if (job_type === 'secure_vault_query' || job_type === 'contract_scan') {
                const cacheKey = `${user_id}:${job_type}:${JSON.stringify(payload)}`;
                await supabaseAdmin
                    .from('ai_cache')
                    .upsert({ cache_key: cacheKey, response: result });
            }
        }

    } catch (error) {
        status = 'failed';
        result = { error: error.message };
        console.error(`Job ${id}: Execution failed.`, error);
    }

    return { result, status };
}

// --- Main Worker Handler ---
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Select one pending job, prioritizing those ready for retry
        const { data: jobs, error: selectError } = await supabaseAdmin
            .from('ai_request_queue')
            .select('*')
            .eq('status', 'pending')
            .or(`payload->>retry_after.is.null,payload->>retry_after.lte.${new Date().toISOString()}`)
            .order('created_at', { ascending: true })
            .limit(1);

        if (selectError) throw selectError;

        if (!jobs || jobs.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending jobs found.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const job = jobs[0];
        
        // 2. Mark job as processing immediately
        const { error: updateError } = await supabaseAdmin
            .from('ai_request_queue')
            .update({ status: 'processing', processed_at: new Date().toISOString() })
            .eq('id', job.id);

        if (updateError) throw updateError;

        // 3. Process the job
        const { result, status } = await processJob(job);

        // 4. Update final status if not retrying
        if (status !== 'retrying') {
            await supabaseAdmin
                .from('ai_request_queue')
                .update({ status, result })
                .eq('id', job.id);
        }
        
        // 5. Implement 1-second delay before returning (to enforce 1 RPM limit)
        await new Promise(resolve => setTimeout(resolve, BASE_DELAY_MS));

        return new Response(JSON.stringify({ message: `Job ${job.id} processed. Status: ${status}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('AI Worker Critical Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});