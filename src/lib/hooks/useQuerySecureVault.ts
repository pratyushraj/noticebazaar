import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface QuerySecureVaultVariables {
  query: string;
}

interface QuerySecureVaultResponse {
  response: string;
}

// Define the polling function outside the hook
const pollJobStatus = async (jobId: string): Promise<QuerySecureVaultResponse> => {
  const MAX_POLLS = 30; // Poll for up to 30 seconds
  const POLL_INTERVAL = 1000; // 1 second interval

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

    const { data, error } = await supabase
      .from('ai_request_queue')
      .select('status, result')
      .eq('id', jobId)
      .single();

    if (error) {
      throw new Error(`Polling failed: ${error.message}`);
    }

    if (data.status === 'completed') {
      return data.result as QuerySecureVaultResponse;
    }

    if (data.status === 'failed') {
      throw new Error(data.result?.error || 'AI job failed during processing.');
    }
    
    // If status is 'pending' or 'processing', continue polling
  }

  throw new Error("AI processing timed out. Please try again later.");
};


export const useQuerySecureVault = () => {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation<QuerySecureVaultResponse, Error, QuerySecureVaultVariables>(
    async ({ query }) => {
      // 1. Send request to Edge Function (which now enqueues the job)
      const { data, error, status } = await supabase.functions.invoke('query-secure-vault', {
        body: { query },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // 2. Handle immediate cache hit (status 200)
      if (status === 200) {
        return data as QuerySecureVaultResponse;
      }

      // 3. Handle job queuing (status 202 Accepted)
      if (status === 202 && (data as any).jobId) {
        const jobId = (data as any).jobId;
        
        // Show non-blocking toast for background processing
        toast.info("AI request queued. Processing in background...", { 
          description: "This may take a few moments. Please wait for the result.",
          duration: 5000,
        });

        // Poll for the result
        return pollJobStatus(jobId);
      }
      
      // Fallback for unexpected response
      throw new Error('Unexpected response from AI service.');
    },
    {
      // Custom error handling is done inside the mutation function to manage polling errors
      errorMessage: 'Failed to query Secure Vault',
    }
  );
};