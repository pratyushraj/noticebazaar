/**
 * Analytics utility for tracking user events
 * Supports Mixpanel and Supabase logs as fallback
 * Fire events once per deal; attach deal_id, creator_id, collab_type where applicable.
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
  | 'deal_progress_updated'
  // Collab Link Funnel
  | 'collab_link_viewed'
  | 'collab_link_form_started'
  | 'collab_link_form_submitted'
  | 'collab_link_abandoned'
  // Creator Decision Funnel
  | 'creator_viewed_request'
  | 'creator_accepted_request'
  | 'creator_countered_request'
  | 'creator_declined_request'
  // Contract Funnel
  | 'contract_generated'
  | 'contract_viewed_by_brand'
  | 'contract_signed_by_brand'
  | 'contract_not_signed_48h'
  // Barter-Specific
  | 'delivery_details_requested'
  | 'delivery_details_submitted'
  | 'product_marked_shipped'
  | 'product_marked_received'
  | 'barter_delivery_delay'
  // Barter shipping (token-based brand flow)
  | 'shipping_link_opened'
  | 'shipping_marked_shipped'
  | 'shipping_confirmed_delivered'
  | 'shipping_issue_reported'
  // Payment Funnel (Paid)
  | 'payment_initiated'
  | 'payment_delayed'
  | 'payment_released';

/** Fire events once per deal. Attach deal_id, creator_id, collab_type where applicable. Contract/brand events (contract_generated, contract_viewed_by_brand, contract_signed_by_brand, contract_not_signed_48h, payment_*) are typically fired from the backend. */

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    // Check if analytics_events table exists, if not, just return
    const { error } = await (supabase
      .from('analytics_events')
      .insert({
        user_id: session.user.id,
        event_name: event,
        metadata: properties || {},
        created_at: new Date().toISOString(),
      } as any));

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

