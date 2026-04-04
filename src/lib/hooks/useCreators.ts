import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';

export interface CreatorProfile {
  id: string;
  username: string;
  name: string;
  category: string | null;
  bio: string | null;
  platforms: Array<{
    name: string;
    handle: string;
    followers?: number;
  }>;
}

interface UseCreatorsOptions {
  search?: string;
  category?: string;
  limit?: number;
  enabled?: boolean;
}

export const useCreators = (options: UseCreatorsOptions = {}) => {
  const { search, category, limit = 20, enabled = true } = options;

  return useQuery({
    queryKey: ['creators', { search, category, limit }],
    queryFn: async (): Promise<CreatorProfile[]> => {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      if (search && search.trim()) params.set('q', search.trim());
      if (category && category !== 'all') params.set('category', category);
      params.set('limit', limit.toString());

      const response = await fetch(`${apiBaseUrl}/api/creators?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }
      const data = await response.json();
      return data.creators || [];
    },
    enabled,
    staleTime: 1000 * 60, // 1 minute
  });
};

/** Hook to fetch a single creator by username or instagram_handle */
export const useCreatorByUsername = (username: string | null) => {
  return useQuery({
    queryKey: ['creator', username],
    queryFn: async (): Promise<CreatorProfile | null> => {
      if (!username) return null;
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/creators?q=${encodeURIComponent(username.trim())}&limit=1`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.creators?.[0] ?? null;
    },
    enabled: !!username && username.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
