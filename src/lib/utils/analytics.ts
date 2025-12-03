/**
 * Analytics utility for tracking user events
 * Supports Mixpanel and Supabase logs as fallback
 */

type AnalyticsEvent = 
  | 'deal_preview_opened'
  | 'contract_preview_opened'
  | 'issue_reported'
  | 'issue_updated'
  | 'payment_marked_received'
  | 'payment_undo_clicked'
  | 'zip_bundle_downloaded'
  | 'calendar_sync_added'
  | 'overdue_payment_reminder_sent'
  | 'deliverable_marked_completed'
  | 'deal_duplicated'
  | 'deal_progress_updated';

interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// Check if Mixpanel is available
const isMixpanelAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).mixpanel !== 'undefined';
};

// Get Mixpanel instance
const getMixpanel = (): any => {
  if (typeof window === 'undefined') return null;
  return (window as any).mixpanel || null;
};

/**
 * Track an analytics event
 */
export async function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): Promise<void> {
  try {
    // Try Mixpanel first
    if (isMixpanelAvailable()) {
      const mixpanel = getMixpanel();
      if (mixpanel && mixpanel.track) {
        mixpanel.track(event, properties);
        return;
      }
    }

    // Fallback to Supabase logs
    await trackEventToSupabase(event, properties);
  } catch (error) {
    // Silently fail in production, log in development
    if (import.meta.env.DEV) {
      console.warn('Analytics tracking failed:', error);
    }
  }
}

/**
 * Track event to Supabase logs table
 */
async function trackEventToSupabase(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): Promise<void> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check if analytics_logs table exists, if not, just return
    const { error } = await supabase
      .from('analytics_logs')
      .insert({
        event_name: event,
        properties: properties || {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Table might not exist, that's okay
      if (import.meta.env.DEV) {
        console.warn('Analytics log insert failed (table may not exist):', error);
      }
    }
  } catch (error) {
    // Silently handle errors
    if (import.meta.env.DEV) {
      console.warn('Supabase analytics tracking failed:', error);
    }
  }
}

/**
 * Identify user for analytics
 */
export function identifyUser(userId: string, traits?: Record<string, any>): void {
  try {
    if (isMixpanelAvailable()) {
      const mixpanel = getMixpanel();
      if (mixpanel && mixpanel.identify) {
        mixpanel.identify(userId, traits);
        return;
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('User identification failed:', error);
    }
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>): void {
  try {
    if (isMixpanelAvailable()) {
      const mixpanel = getMixpanel();
      if (mixpanel && mixpanel.people && mixpanel.people.set) {
        mixpanel.people.set(properties);
        return;
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Setting user properties failed:', error);
    }
  }
}

