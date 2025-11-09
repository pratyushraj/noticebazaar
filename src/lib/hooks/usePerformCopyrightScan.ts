import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CopyrightScanAlert {
  id: string;
  description: string;
  platform: string;
  infringingUrl: string;
  infringingUser: string;
  originalContentUrl: string;
}

interface PerformCopyrightScanVariables {
  query: string;
  platforms: string[];
}

interface PerformCopyrightScanResponse {
  alerts: CopyrightScanAlert[];
}

// Define the polling function outside the hook
const pollJobStatus = async (jobId: string): Promise<PerformCopyrightScanResponse> => {
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
      return data.result as PerformCopyrightScanResponse;
    }

    if (data.status === 'failed') {
      throw new Error(data.result?.error || 'AI copyright scan failed during processing.');
    }
    
    // If status is 'pending' or 'processing', continue polling
  }

  throw new Error("AI copyright scan timed out. Processing may continue in background.");
};


export const usePerformCopyrightScan = () => {
  return useSupabaseMutation<PerformCopyrightScanResponse, Error, PerformCopyrightScanVariables>(
    async ({ query, platforms }) => {
      // 1. Send request to Edge Function (which now enqueues the job)
      const { data, error, status } = await supabase.functions.invoke('perform-copyright-scan', {
        body: { query, platforms },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // 2. Handle job queuing (status 202 Accepted)
      if (status === 202 && (data as any).jobId) {
        const jobId = (data as any).jobId;
        
        // Show non-blocking toast for background processing
        toast.info("Copyright scan queued. Processing in background...", { 
          description: "This may take a few moments. You'll be notified when the result is ready.",
          duration: 5000,
        });

        // Poll for the result
        return pollJobStatus(jobId);
      }
      
      // Fallback for unexpected response (e.g., if the function returned 200 with an error payload)
      throw new Error('Unexpected response from AI service.');
    },
    {
      errorMessage: 'Failed to perform copyright scan',
    }
  );
};