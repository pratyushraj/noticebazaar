// @ts-nocheck
import { supabase } from '../index';
import { resolveOrCreateBrandContact } from './brandContactService';
import { 
  normalizeCollabTypeForDb, 
  normalizeCollabTypeForApi, 
  isPaidLikeCollab, 
  isBarterLikeCollab, 
  normalizeImageUrl 
} from '../lib/collabUtils';

/**
 * Shared service to create a brand deal from a collab request.
 * Centralizes normalization, amount calculation, and missing column retry logic.
 */
export async function createDealFromCollabRequest(request: any, userId: string, options: {
  status?: string;
  shipping_address?: string;
  otp_verified?: boolean;
  otp_verified_at?: string | null;
} = {}) {
  const { status, shipping_address, otp_verified, otp_verified_at } = options;
  const now = new Date().toISOString();

  // Parse deliverables
  let deliverablesArray: string[] = [];
  try {
    deliverablesArray = Array.isArray(request.deliverables)
      ? request.deliverables
      : typeof request.deliverables === 'string'
        ? JSON.parse(request.deliverables)
        : [];
  } catch {
    deliverablesArray = [];
  }

  // Calculate deal amount
  let dealAmount = 0;
  if (isPaidLikeCollab(request.collab_type)) {
    dealAmount = request.exact_budget || 0;
  } else if (isBarterLikeCollab(request.collab_type)) {
    dealAmount = request.barter_value || 0;
  }

  const isBarter = normalizeCollabTypeForDb(request.collab_type) === 'barter';
  const normalizedProductImage = normalizeImageUrl(request.barter_product_image_url);

  // Prepare form data for DealDetailPage.tsx and other consumers
  const requestFormData =
    request && typeof request.form_data === 'object' && request.form_data !== null
      ? { ...request.form_data }
      : {};

  const offerDetailFormData = {
    ...requestFormData,
    selected_package_id: request.selected_package_id || undefined,
    selected_package_label: request.selected_package_label || undefined,
    selected_package_type: request.selected_package_type || undefined,
    selected_addons: request.selected_addons || undefined,
    content_quantity: request.content_quantity || undefined,
    content_duration: request.content_duration || undefined,
    content_requirements: request.content_requirements || undefined,
    barter_types: request.barter_types || undefined,
    ...(normalizedProductImage
      ? {
          barter_product_image_url: normalizedProductImage,
          product_image_url: normalizedProductImage,
        }
      : {}),
    campaign_goal: request.campaign_goal || undefined,
    campaign_category: request.campaign_category || undefined,
    campaign_description: request.campaign_description || undefined,
    // Legacy names for DealDetailPage.tsx
    campaignName: request.campaign_goal || undefined,
    brandName: request.brand_name || undefined,
    productDescription: request.barter_description || request.campaign_description || undefined,
    productName: request.barter_product_name || undefined,
  };

  const persistedFormData = Object.values(offerDetailFormData).some(
    (value) => value !== undefined && value !== null && value !== ''
  )
    ? offerDetailFormData
    : undefined;

  // Build the insert payload
  const dealData: any = {
    creator_id: userId,
    brand_id: request.brand_id || null,
    brand_name: request.brand_name,
    brand_email: request.brand_email,
    brand_logo_url: request.brand_logo_url || null,
    deal_amount: dealAmount,
    deliverables: JSON.stringify(deliverablesArray),
    due_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_expected_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    platform: 'Other',
    status: status || (isBarter ? 'Drafting' : 'CONTRACT_READY'),
    deal_type: isBarter ? 'barter' : 'paid',
    collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
    campaign_description: request.campaign_description || request.selected_package_label || null,
    campaign_goal: request.selected_package_label || request.campaign_goal || null,
    campaign_category: request.campaign_category || null,
    shipping_required: request.shipping_required === true || isBarterLikeCollab(request.collab_type),
    created_via: 'collab_request',
    brand_address: request.brand_address,
    brand_phone: request.brand_phone,
    barter_product_image_url: normalizedProductImage,
    form_data: persistedFormData,
    collab_request_id: request.id,
    delivery_address: shipping_address || request.shipping_address,
    creator_otp_verified: request.source_lead_id ? true : (otp_verified === true),
    creator_otp_verified_at: request.source_lead_id ? now : (otp_verified_at || (otp_verified === true ? now : null)),

    // Campaign metadata
    selected_package_id: request.selected_package_id || null,
    selected_package_label: request.selected_package_label || null,
    selected_package_type: request.selected_package_type || null,
    selected_addons: request.selected_addons || [],
    content_quantity: request.content_quantity || null,
    content_duration: request.content_duration || null,
    content_requirements: request.content_requirements || [],
    barter_types: request.barter_types || [],
    progress_percentage: status === 'accepted_pending_otp' ? 10 : (isBarter ? 15 : 20),
  };

  const dealOptionalFields = new Set([
    'brand_id',
    'collab_type',
    'shipping_required',
    'created_via',
    'brand_address',
    'brand_phone',
    'barter_product_image_url',
    'form_data',
    'progress_percentage',
    'collab_request_id',
    'campaign_goal',
    'campaign_category',
    'campaign_description',
    'brand_logo_url',
    'selected_package_id',
    'selected_package_label',
    'selected_package_type',
    'selected_addons',
    'content_quantity',
    'content_duration',
    'content_requirements',
    'barter_types',
  ]);

  const extractMissingColumn = (message: string): string | null => {
    if (!message) return null;
    const quoted = message.match(/'([^']+)' column/i);
    if (quoted?.[1]) return quoted[1];
    const quotedAlt = message.match(/column\s+"([^"]+)"/i);
    if (quotedAlt?.[1]) return quotedAlt[1];
    const unquoted = message.match(/column\s+([a-z_][a-z0-9_]*)/i);
    if (unquoted?.[1]) return unquoted[1];
    return null;
  };

  const dealInsertPayload: any = { ...dealData };
  let deal: any = null;
  let dealError: any = null;

  for (let attempt = 0; attempt < 15; attempt++) {
    const result = await supabase
      .from('brand_deals')
      .insert(dealInsertPayload)
      .select('id')
      .single();

    deal = result.data;
    dealError = result.error;

    if (!dealError) break;

    const missingColumn = extractMissingColumn(String(dealError.message || ''));
    if (missingColumn && dealOptionalFields.has(missingColumn) && missingColumn in dealInsertPayload) {
      console.log(`[DealCreationService] Stripping missing column "${missingColumn}" and retrying...`);
      delete dealInsertPayload[missingColumn];
      continue;
    }
    break;
  }

  if (dealError || !deal) {
    throw new Error(dealError?.message || 'Failed to create deal');
  }

  // Resolve or create brand contact for canonical linking
  const dealBrandContactId = await resolveOrCreateBrandContact({
    legalName: request.brand_name || '',
    email: request.brand_email || '',
    phone: request.brand_phone || null,
    website: null,
    instagram: null,
    address: request.brand_address?.trim() || null,
    gstin: request.brand_gstin?.trim().toUpperCase() || null,
  });

  if (dealBrandContactId) {
    await supabase
      .from('brand_deals')
      .update({ brand_contact_id: dealBrandContactId, updated_at: now })
      .eq('id', deal.id);
  }

  return deal;
}
