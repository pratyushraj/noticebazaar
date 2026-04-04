import { createClient } from '@supabase/supabase-js';

interface MarketplaceEventInput {
  eventName: string;
  userId?: string | null;
  creatorId?: string | null;
  brandId?: string | null;
  dealId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

const CATEGORY_BY_EVENT: Record<string, string> = {
  creator_signed_up: 'creator_funnel',
  instagram_added: 'creator_funnel',
  reel_price_set: 'creator_funnel',
  collab_link_copied: 'creator_funnel',
  collab_link_shared: 'creator_funnel',
  offer_received: 'deal_funnel',
  offer_opened: 'deal_funnel',
  offer_accepted: 'deal_funnel',
  deal_started: 'deal_funnel',
  content_submitted: 'deal_funnel',
  content_approved: 'deal_funnel',
  payment_marked: 'deal_funnel',
  payment_confirmed: 'deal_funnel',
  invoice_generated: 'deal_funnel',
  deal_completed: 'deal_funnel',
};

export async function recordMarketplaceEvent(
  supabase: ReturnType<typeof createClient>,
  input: MarketplaceEventInput
): Promise<void> {
  const {
    eventName,
    userId = null,
    creatorId = null,
    brandId = null,
    dealId = null,
    requestId = null,
    metadata = {},
    createdAt,
  } = input;

  const payload = {
    user_id: userId,
    creator_id: creatorId,
    brand_id: brandId,
    deal_id: dealId,
    request_id: requestId,
    event_name: eventName,
    event_category: CATEGORY_BY_EVENT[eventName] || 'general',
    metadata,
    created_at: createdAt || new Date().toISOString(),
  };

  const { error } = await supabase.from('analytics_events' as never).insert(payload as never);
  if (error) {
    console.warn('[MarketplaceAnalytics] Failed to record event:', eventName, error.message);
  }
}
