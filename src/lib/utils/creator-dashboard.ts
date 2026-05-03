import { DealStage, getDealStageFromStatus } from '@/lib/hooks/useBrandDeals';
import { isBarterLikeCollab } from '@/lib/deals/collabType';

export const normalizeDealStatus = (deal: any) =>
    String(deal?.status ?? deal?.raw?.status ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');

export const parseDealDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const asString = String(value);
    const dt = new Date(asString);
    return Number.isNaN(dt.getTime()) ? null : dt;
};

export const getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
};

export const inferCreatorRequiresPayment = (deal: any) => {
    if (typeof deal?.requires_payment === 'boolean') return Boolean(deal.requires_payment);
    const kind = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').trim().toLowerCase();
    const amount = Number(deal?.deal_amount || deal?.exact_budget || 0);
    return kind === 'paid' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter' || (kind !== 'barter' && amount > 0);
};


export const getCreatorDealCardUX = (deal: any) => {
    const rawStatus = normalizeDealStatus(deal);

    const isCompleted = rawStatus.includes('completed') || rawStatus === 'paid';
    const isRevisionRequested = rawStatus.includes('revision_requested') || rawStatus.includes('changes_requested') || rawStatus.includes('brand_revision_requested');
    const isRevisionDone = rawStatus.includes('revision_done') || rawStatus.includes('revision_submitted');
    const requiresShipping = isBarterLikeCollab(deal);
    const isAwaitingShipment =
        requiresShipping &&
        (rawStatus.includes('awaiting_product_shipment') ||
            rawStatus.includes('awaiting_product') ||
            rawStatus.includes('product_shipment_pending'));
    const isDelivered =
        rawStatus.includes('content_delivered') ||
        rawStatus.includes('draft_review') ||
        rawStatus.includes('content_pending') ||
        rawStatus.includes('awaiting_review') ||
        rawStatus.includes('waiting_for_review') ||
        rawStatus.includes('awaiting_approval') ||
        isRevisionDone;
    const isApproved = rawStatus.includes('content_approved');
    const isPaymentReleased = rawStatus.includes('payment_released');
    const isMaking = rawStatus.includes('content_making') || rawStatus.includes('drafting');
    const isFullyExecuted = rawStatus.includes('fully_executed') || rawStatus === 'signed';
    const isContractPending = rawStatus.includes('contract_ready') || rawStatus === 'sent' || rawStatus.includes('signed_pending_creator') || rawStatus.includes('signed_by_brand') || rawStatus.includes('needs signature');

    const dueDate = parseDealDate(deal?.due_date || deal?.deadline || deal?.raw?.deadline || deal?.raw?.due_date);
    const daysUntilDue = getDaysUntil(dueDate);

    let progressStep = 1;
    if (isCompleted) progressStep = 7;
    else if (isPaymentReleased) progressStep = 6;
    else if (isApproved) progressStep = 5;
    else if (isDelivered || isRevisionRequested) progressStep = 4;
    else if (isMaking) progressStep = 3;
    else if (isFullyExecuted) progressStep = 2;
    else if (isContractPending) progressStep = 1;

    const contractLabel = isContractPending
        ? (rawStatus.includes('signed_by_brand') ? 'Contract: waiting for your signature' : 'Contract: pending signature')
        : (isFullyExecuted || isMaking || isDelivered || isApproved || isPaymentReleased || isCompleted ? 'Contract: signed' : null);

    const needsSignature = isContractPending;
    const needsCreatorAction = !isCompleted && !isApproved && !isPaymentReleased && !isAwaitingShipment && (needsSignature || isRevisionRequested || isMaking);

    const urgencyLevel: 'critical' | 'warning' | 'normal' = daysUntilDue !== null && daysUntilDue <= 2
        ? 'critical'
        : daysUntilDue !== null && daysUntilDue <= 5
            ? 'warning'
            : 'normal';

    let stagePill = 'IN PROGRESS';
    let nextStep = 'Open deal';
    let cta = 'Open';

    if (isCompleted) {
        stagePill = 'COMPLETED';
        nextStep = 'View summary';
        cta = 'View Summary';
    } else if (isPaymentReleased) {
        stagePill = 'PAYMENT RELEASED';
        nextStep = 'Confirm completion and close the deal';
        cta = 'View Deal';
    } else if (isApproved) {
        stagePill = 'APPROVED';
        nextStep = 'Waiting for payment release';
        cta = 'Payment Pending';
    } else if (needsSignature) {
        stagePill = 'SIGN CONTRACT';
        nextStep = 'Review and sign the agreement';
        cta = rawStatus.includes('signed_by_brand') ? 'Sign Now' : 'View Contract';
    } else if (isRevisionRequested) {
        stagePill = 'REVISION REQUESTED';
        nextStep = 'Update content and resubmit';
        cta = 'Upload Revision';
    } else if (isDelivered) {
        stagePill = 'AWAITING REVIEW';
        nextStep = 'Wait for brand approval';
        cta = 'Waiting for Review';
    } else if (isAwaitingShipment) {
        stagePill = 'AWAITING PRODUCT';
        nextStep = 'Waiting for product shipment from brand';
        cta = 'Waiting';
    } else if (isFullyExecuted) {
        stagePill = 'COLLAB STARTED';
        nextStep = 'Start creating content';
        cta = 'View Deal';
    } else if (isMaking) {
        stagePill = 'MAKE CONTENT';
        nextStep = 'Deliver your Instagram link for review';
        cta = 'Deliver Content';
    } else {
        stagePill = 'WAITING';
        nextStep = 'Open deal';
        cta = 'View Deal';
    }

    return {
        rawStatus,
        dueDate,
        daysUntilDue,
        urgencyLevel,
        progressStep,
        contractLabel,
        needsCreatorAction,
        needsSignature,
        isRevisionRequested,
        isRevisionDone,
        isApproved,
        isPaymentReleased,
        isAwaitingShipment,
        isMaking,
        stagePill,
        nextStep,
        cta,
    };
};

export const getCreatorPaymentListUX = (deal: any) => {
    const ux = getCreatorDealCardUX(deal);
    const rawStatus = ux.rawStatus;
    const isPaid = rawStatus.includes('completed') || rawStatus === 'paid' || rawStatus.includes('payment_received');
    const isPaymentReleased = rawStatus.includes('payment_released');
    const isApproved = rawStatus.includes('content_approved');
    const isAwaitingApproval = rawStatus.includes('content_delivered') || rawStatus.includes('revision_done') || rawStatus.includes('draft_review') || rawStatus.includes('content_pending');
    const isContractPending = rawStatus.includes('contract_ready') || rawStatus === 'sent' || rawStatus.includes('needs signature');

    if (isPaid) return { label: 'PAID', sublabel: 'Payment released', tone: 'success' as const };
    if (isPaymentReleased) return { label: 'PAYMENT RELEASED', sublabel: 'Waiting to close the deal', tone: 'success' as const };
    if (isApproved) return { label: 'APPROVED', sublabel: 'Payment pending', tone: 'warning' as const };
    if (isAwaitingApproval) return { label: 'PENDING APPROVAL', sublabel: 'Waiting for brand approval', tone: 'warning' as const };
    if (isContractPending) return { label: 'CONTRACT PENDING', sublabel: 'Sign to start collaboration', tone: 'neutral' as const };
    if (ux.isRevisionRequested) return { label: 'REVISION', sublabel: 'Fix requested before approval', tone: 'warning' as const };
    
    // Status is likely content_making (Funded/In Progress)
    return { label: 'SECURED', sublabel: 'In escrow, released after approval', tone: 'info' as const };
};

export const parseLocationParts = (location?: string | null) => {
    const raw = (location || '').trim();
    if (!raw) return { address: '', city: '', pincode: '' };
    const pincodeMatch = raw.match(/\b\d{6}\b/);
    const pincode = pincodeMatch?.[0] || '';

    const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
    const nonPincodeParts = parts.filter(p => !/\b\d{6}\b/.test(p));

    let city = '';
    let address = '';

    if (nonPincodeParts.length >= 2) {
        city = nonPincodeParts[nonPincodeParts.length - 1];
        address = nonPincodeParts.slice(0, -1).join(', ');
    } else if (nonPincodeParts.length === 1) {
        city = nonPincodeParts[0];
    }

    return { address, city, pincode };
};

export const resolveAvatarUrl = (candidate: any, _username: string = 'creator') => {
    const raw = String(candidate || '').trim();
    // Return null so AvatarFallback (initials) renders — avoids ui-avatars.com CORS issues
    if (!raw) return null;
    if (/^(https?:)?\/\//i.test(raw)) return raw.startsWith('//') ? `https:${raw}` : raw;
    if (/^(data:|blob:)/i.test(raw)) return raw;
    return null;
};

export const buildProfileFormData = (profile: any, userEmail?: string | null) => {
    const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.full_name || '';
    const parsedLocation = parseLocationParts(profile?.location);
    return {
        full_name: fullName,
        email: profile?.email || userEmail || '',
        phone: profile?.phone || '',
        bio: profile?.bio || '',
        pincode: profile?.pincode || parsedLocation.pincode || '',
        city: profile?.city || parsedLocation.city || '',
        address: profile?.address || parsedLocation.address || '',
        instagram_handle: profile?.instagram_handle || '',
        media_kit_url: profile?.media_kit_url || '',
        open_to_collabs: profile?.open_to_collabs ?? true,
        typical_deal_size: profile?.typical_deal_size || 'standard',
        collaboration_preference: profile?.collaboration_preference || 'Hybrid',
        avg_rate_reel: profile?.avg_rate_reel || '5000',
        content_niches: profile?.content_niches || ['Fashion', 'Tech', 'Lifestyle'],
        bank_account_name: profile?.bank_account_name || '',
        bank_upi: profile?.bank_upi || '',
        deal_templates: profile?.deal_templates || [],
        audience_gender_split: profile?.audience_gender_split || '',
        top_cities: Array.isArray(profile?.top_cities) ? profile.top_cities : [],
        audience_age_range: profile?.audience_age_range || '',
        primary_audience_language: profile?.primary_audience_language || '',
        posting_frequency: profile?.posting_frequency || '',
        active_brand_collabs_month: profile?.active_brand_collabs_month || '',
        past_brand_count: profile?.past_brand_count || profile?.collab_brands_count_override || 0,
        avg_reel_views_manual: profile?.avg_reel_views_manual || '',
        avg_likes_manual: profile?.avg_likes_manual || '',
        collab_region_label: profile?.collab_region_label || '',
        collab_audience_fit_note: profile?.collab_audience_fit_note || '',
        collab_recent_activity_note: profile?.collab_recent_activity_note || '',
        collab_audience_relevance_note: profile?.collab_audience_relevance_note || '',
        collab_delivery_reliability_note: profile?.collab_delivery_reliability_note || '',
        collab_response_behavior_note: profile?.collab_response_behavior_note || '',
        campaign_slot_note: profile?.campaign_slot_note || '',
        portfolio_links: Array.isArray(profile?.portfolio_links) ? profile.portfolio_links : [],
        past_brands: Array.isArray(profile?.past_brands) ? profile.past_brands : [],
        collab_cta_trust_note: profile?.collab_cta_trust_note || '',
        collab_cta_dm_note: profile?.collab_cta_dm_note || '',
        collab_cta_platform_note: profile?.collab_cta_platform_note || '',
        discovery_video_url: profile?.discovery_video_url || null,
        portfolio_videos: Array.isArray(profile?.portfolio_videos) ? profile.portfolio_videos : [],
    };
};

/**
 * Safely resolves the monetary value of a deal — prefers deal_amount,
 * falls back to barter_value (including nested form_data) so barter
 * deals never show ₹0 in analytics widgets.
 */
export const resolvedDealAmount = (deal: any): number => {
    if (deal?.deal_amount != null && Number(deal.deal_amount) > 0) return Number(deal.deal_amount);
    if (deal?.barter_value != null && Number(deal.barter_value) > 0) return Number(deal.barter_value);
    if (deal?.form_data?.barter_value != null && Number(deal.form_data.barter_value) > 0) return Number(deal.form_data.barter_value);
    return Number(deal?.deal_amount ?? 0);
};

export const renderBudgetValue = (item: any) => {
    // Use null-check (not falsy) so deal_amount=0 doesn't fall through to 'Flexible Budget'
    const exact = item?.deal_amount != null ? Number(item.deal_amount) : Number(item?.exact_budget ?? NaN);
    if (Number.isFinite(exact) && exact > 0) return `₹${exact.toLocaleString()}`;

    const min = Number(item?.budget_range?.min || item?.form_data?.budget_range?.min || (item?.budget_range && typeof item.budget_range === 'object' && item.budget_range.min));
    if (Number.isFinite(min) && min > 0) return `₹${min.toLocaleString()}+`;

    const barter = Number(item?.barter_value || item?.form_data?.barter_value);
    if (Number.isFinite(barter) && barter > 0) return `₹${barter.toLocaleString()} (Free products)`;

    return 'Flexible Budget';
};
