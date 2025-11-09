import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScanContractAIVariables {
  contract_file_url: string;
  brand_name: string;
}

interface AIScanResult {
  summary: string;
  insights: { type: string; description: string }[];
  recommendations: string;
}

// Define the polling function outside the hook
const pollJobStatus = async (jobId: string): Promise<AIScanResult> => {
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
      // The result structure from the worker is { summary: ..., insights: ..., recommendations: ... }
      return data.result as AIScanResult;
    }

    if (data.status === 'failed') {
      throw new Error(data.result?.error || 'AI contract scan failed during processing.');
    }
    
    // If status is 'pending' or 'processing', continue polling
  }

  throw new Error("AI contract scan timed out. Please try again later.");
};


export const useAIScanContractReview = () => {
  return useSupabaseMutation<AIScanResult, Error, ScanContractAIVariables>(
    async ({ contract_file_url, brand_name }) => {
      // 1. Send request to Edge Function (which now enqueues the job)
      const { data, error, status } = await supabase.functions.invoke('copyright/scan-contract-review', {
        body: { contract_file_url, brand_name },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // 2. Handle immediate cache hit (status 200)
      if (status === 200) {
        // The response structure is { analysis: AIScanResult }
        return (data as any).analysis as AIScanResult;
      }

      // 3. Handle job queuing (status 202 Accepted)
      if (status === 202 && (data as any).jobId) {
        const jobId = (data as any).jobId;
        
        // Show non-blocking toast for background processing
        toast.info("AI contract scan queued. Processing in background...", { 
          description: "This may take a few moments. You'll be notified when the result is ready.",
          duration: 5000,
        });

        // Poll for the result
        return pollJobStatus(jobId);
      }
      
      // Fallback for unexpected response
      throw new Error('Unexpected response from AI service.');
    },
    {
      errorMessage: 'Failed to perform AI contract scan',
    }
  );
};