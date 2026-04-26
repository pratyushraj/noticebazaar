
/**
 * Determines if a deal is "barter-like", meaning it involves physical product shipment.
 * This includes pure barter, both/hybrid, and paid_barter deals.
 */
export const isBarterLikeCollab = (deal: any): boolean => {
  if (!deal) return false;
  
  // Use explicit flags if available (highest priority)
  if (typeof deal.requires_shipping === 'boolean') return deal.requires_shipping;
  if (typeof deal.shipping_required === 'boolean') return deal.shipping_required;
  
  // Infer from collab_type / deal_type
  const type = String(
    deal.collab_type || 
    deal.deal_type || 
    deal.raw?.collab_type || 
    ''
  ).trim().toLowerCase();
  
  return (
    type.includes('barter') || 
    ['both', 'hybrid', 'paid_barter'].includes(type)
  );
};
