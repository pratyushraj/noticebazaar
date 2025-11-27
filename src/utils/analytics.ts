/**
 * Universal Analytics Utility
 * Supports multiple analytics providers with fallback
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
    };
    mixpanel?: {
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

export interface AnalyticsEvent {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  userId?: string;
  metadata?: Record<string, any>;
}

class Analytics {
  private userId: string | null = null;
  private enabled: boolean = true;

  /**
   * Initialize analytics with user ID
   */
  init(userId?: string) {
    this.userId = userId || null;
    this.enabled = typeof window !== 'undefined';
  }

  /**
   * Track an event across all configured analytics providers
   */
  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      console.log('[Analytics]', event, properties);
      return;
    }

    const eventData: AnalyticsEvent = {
      event,
      userId: this.userId || undefined,
      ...properties,
    };

    // Google Analytics (gtag)
    if (window.gtag) {
      try {
        window.gtag('event', event, {
          event_category: properties?.category || 'general',
          event_label: properties?.label,
          value: properties?.value,
          ...properties,
        });
      } catch (error) {
        console.warn('[Analytics] gtag error:', error);
      }
    }

    // Facebook Pixel
    if (window.fbq) {
      try {
        window.fbq('track', event, properties);
      } catch (error) {
        console.warn('[Analytics] fbq error:', error);
      }
    }

    // PostHog
    if (window.posthog) {
      try {
        window.posthog.capture(event, {
          ...properties,
          userId: this.userId,
        });
      } catch (error) {
        console.warn('[Analytics] PostHog error:', error);
      }
    }

    // Mixpanel
    if (window.mixpanel) {
      try {
        window.mixpanel.track(event, {
          ...properties,
          distinct_id: this.userId,
        });
      } catch (error) {
        console.warn('[Analytics] Mixpanel error:', error);
      }
    }

    // Backend API (if configured)
    this.sendToBackend(event, eventData).catch((error) => {
      // Silently fail - don't break user experience
      if (import.meta.env.DEV) {
        console.warn('[Analytics] Backend error:', error);
      }
    });

    // Console log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, eventData);
    }
  }

  /**
   * Send event to backend API (Supabase Edge Function)
   */
  private async sendToBackend(event: string, data: AnalyticsEvent): Promise<void> {
    // Get Supabase URL and anon key from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      if (import.meta.env.DEV) {
        console.warn('[Analytics] Supabase URL or key not configured');
      }
      return;
    }

    // Get auth token from session
    const authToken = await this.getAuthToken();
    if (!authToken) {
      // Silently fail if no auth token (user not logged in)
      return;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          event,
          metadata: {
            ...data,
            userId: this.userId,
          },
          timestamp: new Date().toISOString(),
          page_url: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('X-RateLimit-Reset');
          if (import.meta.env.DEV) {
            console.warn('[Analytics] Rate limit exceeded', { retryAfter });
          }
          return;
        }
        
        throw new Error(`Analytics API error: ${response.status}`);
      }

      // Log success in development
      if (import.meta.env.DEV) {
        const result = await response.json();
        console.log('[Analytics] Event sent successfully', result);
      }
    } catch (error) {
      // Retry once after 1 second
      setTimeout(async () => {
        try {
          const retryResponse = await fetch(`${supabaseUrl}/functions/v1/analytics`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({
              event,
              metadata: {
                ...data,
                userId: this.userId,
              },
              timestamp: new Date().toISOString(),
              page_url: typeof window !== 'undefined' ? window.location.href : null,
            }),
          });
          
          if (!retryResponse.ok && retryResponse.status !== 429) {
            throw new Error(`Analytics API retry error: ${retryResponse.status}`);
          }
        } catch (retryError) {
          // Silently fail on retry too
          if (import.meta.env.DEV) {
            console.warn('[Analytics] Retry failed', retryError);
          }
        }
      }, 1000);
    }
  }

  /**
   * Get auth token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // Try to get token from Supabase client
      const { createClient } = await import('@/integrations/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set user ID for all future events
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Clear user ID (on logout)
   */
  clearUserId() {
    this.userId = null;
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Singleton instance
export const analytics = new Analytics();

// Initialize on module load if in browser
if (typeof window !== 'undefined') {
  analytics.init();
}

