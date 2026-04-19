import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import { logger } from '@/lib/utils/logger';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to automatically trigger Instagram public stats synchronization
 * when the profile is loaded and data is stale (> 24h).
 */
export function useInstagramSync(profile: any) {
  const queryClient = useQueryClient();
  const hasAttemptedSync = useRef(false);

  useEffect(() => {
    const triggerSync = async () => {
      const handle = profile?.instagram_handle;
      if (!handle || typeof handle !== 'string' || !handle.trim()) return;
      
      // Prevent multiple attempts in same mount/session
      if (hasAttemptedSync.current) return;
      
      const lastSync = profile?.last_instagram_sync;
      const followers = profile?.instagram_followers;
      
      const now = new Date();
      // Sync if: 
      // 1. Followers count is missing/0
      // 2. Last sync is missing
      // 3. Last sync was more than 24 hours ago
      const needsSync = !followers || !lastSync || (now.getTime() - new Date(lastSync).getTime() > 24 * 60 * 60 * 1000);
      
      if (!needsSync) return;
      
      hasAttemptedSync.current = true;

      try {
        const apiBaseUrl = getApiBaseUrl();
        // In local development, we only sync if the API is NOT localhost (staging/prod)
        // or if explicitly desired. The backend endpoint usually handles validation.
        const isLocalApi = /^http:\/\/localhost(?::\d+)?$/i.test(apiBaseUrl);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        logger.info('Auto-syncing Instagram followers...', { handle });

        const response = await fetch(`${apiBaseUrl}/api/profile/instagram-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            instagram_username: handle.replace('@', '').trim() 
          }),
        });

        if (response.ok) {
          logger.info('Instagram sync triggered successfully');
          // Invalidate queries to pick up new stats in the background
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
          queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } else {
          // Status 404/403/429 etc are handled silently but logged for debug
          if (import.meta.env.DEV) {
            console.debug('Instagram sync response status:', response.status);
          }
        }
      } catch (err: any) {
        logger.warn('Failed to auto-sync Instagram stats', err);
      }
    };

    if (profile?.id && profile?.instagram_handle && profile?.role === 'creator') {
      triggerSync();
    }
  }, [profile?.id, profile?.instagram_handle, profile?.last_instagram_sync, profile?.instagram_followers, profile?.role, queryClient]);
}
