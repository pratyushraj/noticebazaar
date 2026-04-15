/**
 * Warn user before session expires.
 * Monitors Supabase session and shows a toast 5 minutes before expiry.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes

export function useSessionTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.expires_at) return;

        const expiresAt = session.expires_at * 1000; // seconds → ms
        const msUntilExpiry = expiresAt - Date.now();

        if (msUntilExpiry <= 0) {
          // Already expired
          toast.error('Session expired', { description: 'Please sign in again.' });
          return;
        }

        if (msUntilExpiry <= WARNING_BEFORE_MS) {
          toast.warning('Session expiring soon', {
            description: 'Your session expires in a few minutes. Refresh to stay signed in.',
            action: {
              label: 'Refresh',
              onClick: async () => {
                try {
                  await supabase.auth.refreshSession();
                  toast.success('Session refreshed');
                } catch (refreshErr) {
                  toast.error('Failed to refresh session');
                }
              },
            },
            duration: 30000,
          });
        } else {
          // Schedule warning
          timerRef.current = setTimeout(check, msUntilExpiry - WARNING_BEFORE_MS);
        }
      } catch (err) {
        console.error('[useSessionTimeout] Error checking session:', err);
      }
    };

    check();
    return () => clearTimeout(timerRef.current);
  }, []);
}
