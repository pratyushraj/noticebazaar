import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OriginalContent, CopyrightMatch, CopyrightAction } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { toast } from 'sonner';

// Demo data for Content Protection (used when database table doesn't exist or for preview)
const getDemoOriginalContent = (creatorId: string): OriginalContent[] => {
  const now = new Date();
  
  return [
    {
      id: 'demo-diwali-outfit-001',
      user_id: creatorId,
      platform: 'Instagram',
      original_url: 'https://instagram.com/p/diwali-outfit-reveal',
      watermark_text: '@mycreatorhandle',
      created_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-creator-life-vlog-002',
      user_id: creatorId,
      platform: 'YouTube',
      original_url: 'https://youtube.com/watch?v=creator-life-vlog-12',
      watermark_text: '@mycreatorhandle',
      created_at: new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-morning-routine-003',
      user_id: creatorId,
      platform: 'TikTok',
      original_url: 'https://tiktok.com/@mycreatorhandle/video/morning-routine',
      watermark_text: '@mycreatorhandle',
      created_at: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-iphone-unboxing-004',
      user_id: creatorId,
      platform: 'YouTube',
      original_url: 'https://youtube.com/watch?v=iphone-16-pro-unboxing',
      watermark_text: '@mycreatorhandle',
      created_at: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-skincare-routine-005',
      user_id: creatorId,
      platform: 'Instagram',
      original_url: 'https://instagram.com/p/skincare-daily-routine',
      watermark_text: '@mycreatorhandle',
      created_at: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-manali-vlog-006',
      user_id: creatorId,
      platform: 'YouTube',
      original_url: 'https://youtube.com/watch?v=travel-vlog-manali',
      watermark_text: '@mycreatorhandle',
      created_at: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as OriginalContent[];
};

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

      try {
        const { data, error } = await supabase
          .from('original_content')
          .select('*')
          .eq('user_id', creatorId)
          .order('created_at', { ascending: false });

        if (error) {
          // Check for 404 or table not found errors
          const errorStr = JSON.stringify(error).toLowerCase();
          const is404Error = 
            error.code === 'PGRST116' || // PostgREST: relation does not exist
            error.code === '42P01' || // PostgreSQL: relation does not exist
            error.code === 'PGRST301' || // PostgREST: not found
            (error as any).status === 404 ||
            (error as any).statusCode === 404 ||
            error.message?.includes('404') ||
            error.message?.includes('Could not find the table') ||
            error.message?.includes('relation') ||
            error.message?.includes('does not exist') ||
            errorStr.includes('404') ||
            errorStr.includes('not found');

          if (is404Error) {
          // Return demo data when table doesn't exist
          return getDemoOriginalContent(creatorId);
          }
          
          // For other errors, throw to let React Query handle it
          // But still return empty array to prevent UI crashes
          throw error;
        }
      
      // If no data, return demo data for preview/demo purposes
      if ((!data || data.length === 0) && creatorId) {
        return getDemoOriginalContent(creatorId);
      }
      
        return data as OriginalContent[];
      } catch (err: any) {
        // Catch network errors (404, etc.) and return empty array silently
        const errorStr = String(err?.message || err || '').toLowerCase();
        const is404Error = 
          err?.status === 404 || 
          err?.statusCode === 404 || 
          err?.code === 404 ||
          err?.code === 'PGRST116' ||
          err?.code === '42P01' ||
          errorStr.includes('404') ||
          errorStr.includes('not found') ||
          errorStr.includes('relation') ||
          errorStr.includes('does not exist');

        if (is404Error) {
          // Expected 404 - table doesn't exist yet
          // Return empty array - React Query will treat this as success
          return [];
        }
        
        // For other errors, throw to let React Query handle it properly
        throw err;
      }
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

      try {
      // Use the Edge Function to fetch matches for the latest scan
      const { data, error } = await supabase.functions.invoke('copyright/get-matches', {
        body: { content_id: contentId },
      });

        // Handle Edge Function errors gracefully
        if (error) {
          const errorStr = String(error.message || error || '').toLowerCase();
          const errorStatus = (error as any).status || (error as any).statusCode;
          
          // Check if Edge Function doesn't exist (404) or network/CORS error
          const isEdgeFunctionError = 
            errorStatus === 404 ||
            errorStatus === 0 || // Network error
            errorStr.includes('404') ||
            errorStr.includes('not found') ||
            errorStr.includes('failed to send') ||
            errorStr.includes('edge function') ||
            errorStr.includes('network') ||
            errorStr.includes('fetch failed') ||
            errorStr.includes('could not resolve') ||
            errorStr.includes('timeout') ||
            errorStr.includes('cors') ||
            errorStr.includes('preflight') ||
            errorStr.includes('access-control') ||
            errorStr.includes('blocked by cors policy') ||
            errorStr.includes('err_failed');
          
          if (isEdgeFunctionError) {
            // Edge Function not deployed yet, network issue, or CORS error - return empty array silently
            return [];
          }
          throw new Error(error.message);
        }

        if (data && (data as any).error) {
          const dataErrorStr = String((data as any).error || '').toLowerCase();
          // If Edge Function returns error in response body, return empty array
          if (dataErrorStr.includes('no completed scans') || 
              dataErrorStr.includes('not found') ||
              dataErrorStr.includes('404')) {
            return [];
          }
          throw new Error((data as any).error);
        }

        return (data as { matches: CopyrightMatch[] })?.matches || [];
      } catch (err: any) {
        // Catch network errors, CORS errors, and return empty array to prevent UI crashes
        const errorStr = String(err?.message || err || '').toLowerCase();
        const errorStatus = (err as any)?.status || (err as any)?.statusCode;
        
        const isEdgeFunctionError = 
          errorStatus === 404 ||
          errorStatus === 0 || // Network error
          errorStr.includes('404') ||
          errorStr.includes('not found') ||
          errorStr.includes('edge function') ||
          errorStr.includes('failed to send') ||
          errorStr.includes('network') ||
          errorStr.includes('fetch failed') ||
          errorStr.includes('could not resolve') ||
          errorStr.includes('cors') ||
          errorStr.includes('preflight') ||
          errorStr.includes('access-control') ||
          errorStr.includes('blocked by cors policy') ||
          errorStr.includes('err_failed') ||
          errorStr.includes('timeout');
        
        if (isEdgeFunctionError) {
          // Edge Function not available - return empty array
          return [];
        }
        // For other errors, throw to let React Query handle it
        throw err;
      }
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