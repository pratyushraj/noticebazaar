
/**
 * Determines if a deal is "barter-like", meaning it involves physical product shipment.
 * This includes pure barter, both/hybrid, and paid_barter deals.
 */
export const isBarterLikeCollab = (deal: any): boolean => {
  if (!deal) return false;
  
  // Use explicit flags if available (highest priority)
  if (deal.requires_shipping === true || deal.shipping_required === true || 
      deal.raw?.requires_shipping === true || deal.raw?.shipping_required === true) {
    return true;
  }
  
  // Infer from collab_type / deal_type
  const type = String(
    deal.collab_type || 
    deal.deal_type || 
    deal.raw?.collab_type || 
    deal.raw?.deal_type ||
    deal.type ||
    ''
  ).trim().toLowerCase();
  
  return (
    type.includes('barter') || 
    type === 'free' ||
    ['both', 'hybrid', 'paid_barter', 'gifted', 'product_only'].includes(type)
  );
};

/**
 * Determines if a deal is "paid-like", meaning it involves monetary payment.
 * This includes pure paid, both/hybrid, and paid_barter deals.
 */
export const isPaidLikeCollab = (deal: any): boolean => {
  if (!deal) return false;
  
  const type = String(
    deal.collab_type || 
    deal.deal_type || 
    deal.raw?.collab_type || 
    deal.raw?.deal_type ||
    deal.type ||
    ''
  ).trim().toLowerCase();
  
  // If deal amount is clearly > 0, it is paid-like regardless of string type
  const amount = Number(deal.deal_amount || deal.exact_budget || 0);
  const rawAmount = Number(deal.raw?.deal_amount || deal.raw?.exact_budget || 0);
  if (amount > 0) return true;
  if (rawAmount > 0) return true;

  return (
    type.includes('paid') || 
    ['both', 'hybrid', 'paid_barter'].includes(type)
  );
};
