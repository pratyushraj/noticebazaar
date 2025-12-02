import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { useSupabaseMutation } from '@/lib/hooks/useSupabaseMutation';
import { logger } from '@/lib/utils/logger';

export interface ContractIssue {
  id: string;
  deal_id: string;
  creator_id: string;
  issue_type: 'exclusivity' | 'payment' | 'termination' | 'ip_rights' | 'timeline' | 'deliverables' | 'other';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  impact?: string[];
  recommendation?: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

interface UseContractIssuesOptions {
  dealId?: string;
  creatorId?: string;
  status?: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  enabled?: boolean;
}

export const useContractIssues = (options: UseContractIssuesOptions = {}) => {
  const { dealId, creatorId, status, enabled = true } = options;

  return useSupabaseQuery<ContractIssue[], Error>(
    ['contract_issues', dealId, creatorId, status],
    async () => {
      let query = supabase
        .from('contract_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      if (creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch contract issues', error);
        throw new Error(`Failed to fetch contract issues: ${error.message}`);
      }

      return (data || []) as ContractIssue[];
    },
    {
      enabled: enabled && (!!dealId || !!creatorId),
      retry: false,
      errorMessage: 'Failed to fetch contract issues',
    }
  );
};

interface ResolveIssueVariables {
  issueId: string;
  resolutionNotes?: string;
}

export const useResolveContractIssue = () => {
  const queryClient = useQueryClient();
  const { profile } = useSession();

  return useSupabaseMutation<void, Error, ResolveIssueVariables>(
    async ({ issueId, resolutionNotes }) => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('contract_issues')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: profile.id,
          resolution_notes: resolutionNotes || null,
        })
        .eq('id', issueId)
        .eq('creator_id', profile.id); // Ensure user can only resolve their own issues

      if (error) {
        logger.error('Failed to resolve contract issue', error);
        throw new Error(`Failed to resolve issue: ${error.message}`);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contract_issues'] });
      },
      successMessage: 'Issue marked as resolved',
      errorMessage: 'Failed to resolve issue',
    }
  );
};

interface CreateIssueVariables {
  deal_id: string;
  issue_type: ContractIssue['issue_type'];
  severity: ContractIssue['severity'];
  title: string;
  description?: string;
  impact?: string[];
  recommendation?: string;
}

export const useCreateContractIssue = () => {
  const queryClient = useQueryClient();
  const { profile } = useSession();

  return useSupabaseMutation<ContractIssue, Error, CreateIssueVariables>(
    async (variables) => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('contract_issues')
        .insert({
          ...variables,
          creator_id: profile.id,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create contract issue', error);
        throw new Error(`Failed to create issue: ${error.message}`);
      }

      return data as ContractIssue;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contract_issues'] });
      },
      errorMessage: 'Failed to create issue',
    }
  );
};

