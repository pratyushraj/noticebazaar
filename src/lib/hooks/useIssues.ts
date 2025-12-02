import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { Issue, IssueHistory, CreateIssueInput, UpdateIssueInput, CreateIssueHistoryInput } from '@/types/issues';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Fetch issues for a specific deal
 */
export function useIssues(dealId: string | undefined, enabled = true) {
  return useSupabaseQuery<Issue[]>(
    ['issues', dealId],
    async () => {
      if (!dealId) {
        return [];
      }

      let query = supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('deal_id', dealId);

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        const errorCode = (error as any)?.code;
        const errorStatus = (error as any)?.status;
        if (
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorStatus === 404 ||
          String(error.message || '').toLowerCase().includes('does not exist') ||
          String(error.message || '').toLowerCase().includes('relation')
        ) {
          return [];
        }
        throw error;
      }

      return (data || []) as Issue[];
    },
    {
      enabled: enabled && !!dealId,
      errorMessage: 'Failed to fetch issues',
    }
  );
}

/**
 * Fetch a single issue by ID
 */
export function useIssue(issueId: string | undefined, enabled = true) {
  return useSupabaseQuery<Issue | null>(
    ['issue', issueId],
    async () => {
      if (!issueId) return null;

      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', issueId)
        .single();

      if (error) {
        throw error;
      }

      return data as Issue | null;
    },
    {
      enabled: enabled && !!issueId,
      errorMessage: 'Failed to fetch issue',
    }
  );
}

/**
 * Fetch issue history
 */
export function useIssueHistory(issueId: string | undefined, enabled = true) {
  return useSupabaseQuery<IssueHistory[]>(
    ['issue-history', issueId],
    async () => {
      if (!issueId) return [];

      const { data, error } = await supabase
        .from('issue_history')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as IssueHistory[];
    },
    {
      enabled: enabled && !!issueId,
      errorMessage: 'Failed to fetch issue history',
    }
  );
}

/**
 * Create a new issue
 */
export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useSupabaseMutation<Issue, CreateIssueInput>(
    async (variables) => {
      const { data, error } = await supabase
        .from('issues')
        .insert(variables)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Issue;
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['issues', variables.deal_id] });
        queryClient.invalidateQueries({ queryKey: ['deal-action-logs', variables.deal_id] });
      },
      errorMessage: 'Failed to create issue',
    }
  );
}

/**
 * Update an issue
 */
export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useSupabaseMutation<Issue, UpdateIssueInput & { id: string }>(
    async (variables) => {
      const { id, ...updateData } = variables;
      const { data, error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Issue;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['issues', data.deal_id] });
        queryClient.invalidateQueries({ queryKey: ['issue', data.id] });
      },
      errorMessage: 'Failed to update issue',
    }
  );
}

/**
 * Add issue history entry
 */
export function useAddIssueHistory() {
  const queryClient = useQueryClient();

  return useSupabaseMutation<IssueHistory, CreateIssueHistoryInput>(
    async (variables) => {
      const { data, error } = await supabase
        .from('issue_history')
        .insert(variables)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as IssueHistory;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['issue-history', data.issue_id] });
        queryClient.invalidateQueries({ queryKey: ['issue', data.issue_id] });
      },
      errorMessage: 'Failed to add issue history',
    }
  );
}

