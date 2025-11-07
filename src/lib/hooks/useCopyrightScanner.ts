import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OriginalContent, CopyrightMatch, CopyrightAction } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

// --- 1. Original Content Management Hooks ---

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

// --- 3. Matches Retrieval Hook ---

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

export const usePerformCopyrightAction = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<PerformActionResponse, Error, PerformActionVariables>(
    async ({ match_id, action_type }) => {
      const { data, error } = await supabase.functions.invoke('copyright/perform-action', {
        body: { match_id, action_type },
      });

      if (error) throw new Error(error.message);
      if (data && (data as any).error) throw new Error((data as any).error);
      
      return data as PerformActionResponse;
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