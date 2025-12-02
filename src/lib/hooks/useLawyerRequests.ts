import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { useSupabaseMutation } from '@/lib/hooks/useSupabaseMutation';
import { logger } from '@/lib/utils/logger';

export interface LawyerRequest {
  id: string;
  creator_id: string;
  deal_id?: string;
  subject: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  category: 'contract_review' | 'payment_dispute' | 'termination' | 'ip_rights' | 'exclusivity' | 'other';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  assigned_at?: string;
  response_text?: string;
  responded_at?: string;
  responded_by?: string;
  attachments?: Array<{ url: string; name: string; type: string }>;
  created_at: string;
  updated_at: string;
}

interface UseLawyerRequestsOptions {
  creatorId?: string;
  dealId?: string;
  status?: LawyerRequest['status'];
  enabled?: boolean;
}

export const useLawyerRequests = (options: UseLawyerRequestsOptions = {}) => {
  const { creatorId, dealId, status, enabled = true } = options;

  return useSupabaseQuery<LawyerRequest[], Error>(
    ['lawyer_requests', creatorId, dealId, status],
    async () => {
      let query = supabase
        .from('lawyer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch lawyer requests', error);
        throw new Error(`Failed to fetch lawyer requests: ${error.message}`);
      }

      return (data || []) as LawyerRequest[];
    },
    {
      enabled: enabled && !!creatorId,
      retry: false,
      errorMessage: 'Failed to fetch lawyer requests',
    }
  );
};

interface CreateLawyerRequestVariables {
  deal_id?: string;
  subject: string;
  description: string;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'contract_review' | 'payment_dispute' | 'termination' | 'ip_rights' | 'exclusivity' | 'other';
  attachments?: Array<{ url: string; name: string; type: string }>;
}

export const useCreateLawyerRequest = () => {
  const queryClient = useQueryClient();
  const { profile } = useSession();

  return useSupabaseMutation<LawyerRequest, Error, CreateLawyerRequestVariables>(
    async (variables) => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('lawyer_requests')
        .insert({
          ...variables,
          creator_id: profile.id,
          status: 'pending',
          urgency: variables.urgency || 'medium',
          category: variables.category || 'contract_review',
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create lawyer request', error);
        throw new Error(`Failed to create request: ${error.message}`);
      }

      return data as LawyerRequest;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['lawyer_requests'] });
      },
      successMessage: 'Lawyer help request submitted!',
      errorMessage: 'Failed to submit request',
    }
  );
};

