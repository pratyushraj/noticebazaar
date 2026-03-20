import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { Opportunity } from '@/types';
import { useSession } from '@/contexts/SessionContext';
import { useMemo } from 'react';

interface UseOpportunitiesOptions {
  brandId?: string;
  status?: 'open' | 'closed' | 'filled' | 'expired';
  deliverableType?: string;
  minPayout?: number;
  maxPayout?: number;
  enabled?: boolean;
}

export const useOpportunities = (options?: UseOpportunitiesOptions) => {
  const { profile } = useSession();
  const {
    brandId,
    status = 'open',
    deliverableType,
    minPayout,
    maxPayout,
    enabled = true,
  } = options || {};

  const queryKey = useMemo(
    () => ['opportunities', brandId, status, deliverableType, minPayout, maxPayout, profile?.id],
    [brandId, status, deliverableType, minPayout, maxPayout, profile?.id]
  );

  return useSupabaseQuery<Opportunity[]>(
    queryKey,
    async () => {
      // Type assertion needed because tables might not exist in TypeScript types until migrations are run
      let query = (supabase
        .from('opportunities' as any)
        .select(`
          *,
          brands(*)
        `)
        .eq('status' as any, status) as any);

      // Only show open opportunities that haven't expired
      if (status === 'open') {
        query = (query.gte('deadline' as any, new Date().toISOString().split('T')[0]) as any);
      }

      if (brandId) {
        query = (query.eq('brand_id' as any, brandId) as any);
      }

      if (deliverableType) {
        query = (query.eq('deliverable_type' as any, deliverableType) as any);
      }

      if (minPayout) {
        query = (query.gte('payout_min' as any, minPayout) as any);
      }

      if (maxPayout) {
        query = (query.lte('payout_max' as any, maxPayout) as any);
      }

      // Order by deadline (soonest first)
      query = (query.order('deadline' as any, { ascending: true }) as any);

      const { data, error } = await query;

      if (error) {
        // If the tables don't exist yet (404, PGRST116, or relation errors), return empty array silently
        const errorStatus = (error as any)?.status || (error as any)?.statusCode;
        const errorCode = (error as any)?.code;
        const errorMessage = error.message || '';
        
        if (
          errorStatus === 404 ||
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('could not find')
        ) {
          // Tables don't exist yet - return empty array silently
          return [];
        }
        throw error;
      }

      if (!data) return [];

      return data.map((opp: any) => ({
        ...opp,
        brand: opp.brands,
      })) as Opportunity[];
    },
    {
      enabled: enabled && !!profile?.id,
      errorMessage: 'Failed to fetch opportunities',
    }
  );
};

export const useOpportunityById = (opportunityId: string | undefined, options?: { enabled?: boolean }) => {
  const { profile } = useSession();
  const enabled = options?.enabled !== false && !!opportunityId && !!profile?.id;

  return useSupabaseQuery<Opportunity | null>(
    ['opportunity', opportunityId, profile?.id],
    async () => {
      if (!opportunityId) return null;

      // Type assertion needed because tables might not exist in TypeScript types until migrations are run
      const { data, error } = await (supabase
        .from('opportunities' as any)
        .select(`
          *,
          brands(*)
        `)
        .eq('id' as any, opportunityId)
        .single() as any);

      if (error) {
        // If the tables don't exist yet, return null silently
        const errorStatus = (error as any)?.status || (error as any)?.statusCode;
        const errorCode = (error as any)?.code;
        const errorMessage = error.message || '';
        
        if (
          errorStatus === 404 ||
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('could not find')
        ) {
          return null;
        }
        throw error;
      }

      if (!data) return null;

      const oppData = data as any;
      return {
        ...oppData,
        brand: oppData.brands,
      } as Opportunity;
    },
    {
      enabled,
      errorMessage: 'Failed to fetch opportunity',
    }
  );
};

