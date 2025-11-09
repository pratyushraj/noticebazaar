import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OriginalContent, CopyrightMatch, CopyrightAction } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { toast } from 'sonner'; // Import toast

// --- 1. Original Content Management Hooks (No change needed here) ---

interface UseOriginalContentOptions {
  creatorId: string | undefined;
  enabled?: boolean;
}

export const useOriginalContent = (options: UseOriginalContentOptions) => {
  const { creatorId, enabled = true } = options;

  return useSupabaseQuery<OriginalContent[], Error>(
    ['original_content', creatorId],
    async () => {
      if (!creatorId) {
        return [];
      }

      const { data, error } = await supabase
        .from('original_content')
        .select('*')
        .eq('user_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        // Log the error but return an empty array to prevent crashing the UI
        console.error('Supabase Error in useOriginalContent:', error.message);
        return [];
      }
      return data as OriginalContent[];
    },
    {
      enabled: enabled && !!creatorId,
      errorMessage: 'Failed to fetch original content list',
      retry: false,
    }
  );
};

interface AddOriginalContentVariables {
  user_id: string;
  platform: string;
  original_url: string;
  watermark_text?: string;
}

export const useAddOriginalContent = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<OriginalContent, Error, AddOriginalContentVariables>(
    async (newContent) => {
      const { data, error } = await supabase
        .from('original_content')
        .insert(newContent)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as OriginalContent;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['original_content', variables.user_id] });
      },
      successMessage: 'Original content registered successfully!',
      errorMessage: 'Failed to register original content',
    }
  );
};

export const useDeleteOriginalContent = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { id: string; user_id: string }>(
    async ({ id }) => {
      const { error } = await supabase
        .from('original_content')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['original_content', variables.user_id] });
        queryClient.invalidateQueries({ queryKey: ['copyright_matches'] });
      },
      successMessage: 'Original content deleted.',
      errorMessage: 'Failed to delete original content',
    }
  );
};

// --- 2. Scan Initiation Hook (Edge Function) ---

interface StartScanVariables {
  original_content_id: string;
}

interface StartScanResponse {
  scan_id: string;
  number_of_matches: number;
}

export const useStartCopyrightScan = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<StartScanResponse, Error, StartScanVariables>(
    async ({ original_content_id }) => {
      const { data, error } = await supabase.functions.invoke('copyright/start-scan', {
        body: { original_content_id },
      });

      if (error) throw new Error(error.message);
      if (data && (data as any).error) throw new Error((data as any).error);
      
      return data as StartScanResponse;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['copyright_matches', variables.original_content_id] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      },
      successMessage: 'Copyright scan initiated successfully!',
      errorMessage: 'Failed to start copyright scan',
    }
  );
};

// --- 3. Matches Retrieval Hook (No change needed here) ---

interface UseCopyrightMatchesOptions {
  contentId: string | undefined;
  enabled?: boolean;
}

export const useCopyrightMatches = (options: UseCopyrightMatchesOptions) => {
  const { contentId, enabled = true } = options;

  return useSupabaseQuery<CopyrightMatch[], Error>(
    ['copyright_matches', contentId],
    async () => {
      if (!contentId) return [];

      // Use the Edge Function to fetch matches for the latest scan
      const { data, error } = await supabase.functions.invoke('copyright/get-matches', {
        body: { content_id: contentId },
      });

      if (error) throw new Error(error.message);
      if (data && (data as any).error) throw new Error((data as any).error);

      return (data as { matches: CopyrightMatch[] }).matches || [];
    },
    {
      enabled: enabled && !!contentId,
      errorMessage: 'Failed to fetch copyright matches',
      retry: false,
    }
  );
};

// --- 4. Action Hook (Takedown/Email) ---

interface PerformActionVariables {
  match_id: string;
  action_type: CopyrightAction['action_type']; // "takedown", "email", "ignored"
  original_content_id: string; // For invalidation
}

interface PerformActionResponse {
  status: string;
  message: string;
  document_url: string | null;
}

// Define the polling function for actions
const pollActionJobStatus = async (jobId: string): Promise<PerformActionResponse> => {
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
      return data.result as PerformActionResponse;
    }

    if (data.status === 'failed') {
      throw new Error(data.result?.error || 'Copyright action failed during processing.');
    }
  }

  throw new Error("Copyright action timed out. Processing may continue in background.");
};


export const usePerformCopyrightAction = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<PerformActionResponse, Error, PerformActionVariables>(
    async (variables) => {
      // 1. Send request to Edge Function (which now enqueues the job)
      const { data, error, status } = await supabase.functions.invoke('copyright/perform-action', {
        body: variables,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // 2. Handle job queuing (status 202 Accepted)
      if (status === 202 && (data as any).jobId) {
        const jobId = (data as any).jobId;
        
        // Show non-blocking toast for background processing
        toast.info("Copyright action queued. Processing in background...", { 
          description: "This may take a few moments. You'll be notified when the result is ready.",
          duration: 5000,
        });

        // Poll for the result
        return pollActionJobStatus(jobId);
      }
      
      // Fallback for unexpected response
      throw new Error('Unexpected response from copyright action service.');
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['copyright_matches', variables.original_content_id] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
        queryClient.invalidateQueries({ queryKey: ['creatorDashboardData'] });
        
        if (data.status === 'success') {
            toast.success(data.message);
        }
      },
      errorMessage: 'Failed to perform copyright action',
    }
  );
};