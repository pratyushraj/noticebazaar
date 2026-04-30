import React from 'react';
import { cn } from '@/lib/utils';
import { isBarterLikeCollab } from '@/lib/deals/collabType';
import { optimizeImage } from '@/lib/utils/image';
import { PortfolioItem } from '@/types';

// ============================================
// STATUS & TERM NORMALIZATION
// ============================================

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
    if (kind === 'barter') return false;
    return kind === 'paid' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter' || (kind !== 'barter' && amount > 0);
};

// ============================================
// IMAGE RESOLUTION
// ============================================

export const resolveCreatorDealProductImage = (item: any) => {
    const candidates = [
        item?.barter_product_image_url,
        item?.barter_product_image,
        item?.product_image_url,
        item?.brand_submission_details?.barter_product_image_url,
        item?.brand_submission_details?.product_image_url,
        item?.brand_submission_details?.form_data?.barter_product_image_url,
        item?.brand_submission_details?.form_data?.product_image_url,
        item?.form_data?.barter_product_image_url,
        item?.form_data?.product_image_url,
        item?.form_data?.barterProductImageUrl,
        item?.form_data?.productImageUrl,
        item?.raw?.barter_product_image_url,
        item?.raw?.product_image_url,
        item?.raw?.brand_submission_details?.barter_product_image_url,
        item?.raw?.brand_submission_details?.product_image_url,
        item?.raw?.brand_submission_details?.form_data?.barter_product_image_url,
        item?.raw?.brand_submission_details?.form_data?.product_image_url,
        item?.raw?.form_data?.barter_product_image_url,
        item?.raw?.form_data?.product_image_url,
    ];
    const raw = candidates.map((x) => String(x || '').trim()).find((x) => x && x !== 'null' && x !== 'undefined') || '';
    if (!raw) return '';
    if (/^(data:|blob:)/i.test(raw)) return raw;
    
    // Optimize the final URL
    return optimizeImage(raw, { width: 500, quality: 75 }) || raw;
};

// ============================================
// PORTFOLIO LOGIC
// ============================================

export const isPortfolioVideoUrl = (value: string) => /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(String(value || '').trim());

export const inferPortfolioPlatform = (value: string) => {
    const href = String(value || '').trim().toLowerCase();
    if (!href) return 'external';
    if (isPortfolioVideoUrl(href)) return 'upload';
    if (href.includes('instagram.com')) return 'instagram';
    if (href.includes('youtube.com') || href.includes('youtu.be')) return 'youtube';
    return 'external';
};

export const normalizePortfolioItems = (rawItems: any, legacyLinks?: string[] | null): PortfolioItem[] => {
    const normalizedFromItems = Array.isArray(rawItems)
        ? rawItems
            .map((item: any, index: number) => {
                const sourceUrl = String(item?.sourceUrl || item?.url || item?.link || '').trim();
                if (!sourceUrl) return null;
                const mediaType = item?.mediaType === 'video' || isPortfolioVideoUrl(sourceUrl) ? 'video' : 'link';
                return {
                    id: String(item?.id || `portfolio-item-${index + 1}`),
                    sourceUrl,
                    posterUrl: String(item?.posterUrl || item?.thumbnailUrl || '').trim() || null,
                    title: String(item?.title || '').trim() || null,
                    mediaType,
                    platform: String(item?.platform || inferPortfolioPlatform(sourceUrl)).trim() || null,
                    brand: item?.brand,
                    campaignType: item?.campaignType,
                    outcome: item?.outcome,
                    proofLabel: item?.proofLabel,
                } satisfies PortfolioItem;
            })
            .filter(Boolean) as PortfolioItem[]
        : [];

    if (normalizedFromItems.length > 0) {
        return normalizedFromItems.slice(0, 4);
    }

    return (Array.isArray(legacyLinks) ? legacyLinks : [])
        .map((value, index) => {
            const sourceUrl = String(value || '').trim();
            if (!sourceUrl) return null;
            const mediaType = isPortfolioVideoUrl(sourceUrl) ? 'video' : 'link';
            return {
                id: `portfolio-link-${index + 1}`,
                sourceUrl,
                posterUrl: null,
                title: null,
                mediaType,
                platform: inferPortfolioPlatform(sourceUrl),
            } satisfies PortfolioItem;
        })
        .filter(Boolean)
        .slice(0, 4) as PortfolioItem[];
};

export const buildPortfolioSlots = (rawItems: any, legacyLinks?: string[] | null): PortfolioItem[] => {
    const items = Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.map((item: any, index: number) => ({
            id: String(item?.id || `portfolio-item-${index + 1}`),
            sourceUrl: String(item?.sourceUrl || item?.url || item?.link || '').trim(),
            posterUrl: String(item?.posterUrl || item?.thumbnailUrl || '').trim() || null,
            title: String(item?.title || '').trim() || '',
            mediaType: item?.mediaType || (isPortfolioVideoUrl(String(item?.sourceUrl || item?.url || item?.link || '')) ? 'video' : 'link'),
            platform: item?.platform || inferPortfolioPlatform(String(item?.sourceUrl || item?.url || item?.link || '')),
        }))
        : normalizePortfolioItems([], legacyLinks);

    const slots = items.slice(0, 4);
    while (slots.length < 4) {
        slots.push({
            id: `portfolio-item-${slots.length + 1}`,
            sourceUrl: '',
            posterUrl: null,
            title: '',
            mediaType: 'link',
            platform: 'external',
        });
    }
    return slots;
};

// ============================================
// DEAL CARD UX LOGIC
// ============================================

export const getCreatorDealCardUX = (deal: any) => {
    const rawStatus = normalizeDealStatus(deal);

    const isCompleted = rawStatus.includes('completed') || rawStatus === 'paid' || rawStatus === 'finished';
    const isRevisionRequested = rawStatus.includes('revision_requested') || rawStatus.includes('changes_requested') || rawStatus.includes('brand_revision_requested');
    const isRevisionDone = rawStatus.includes('revision_done') || rawStatus.includes('revision_submitted');
    const requiresShipping = isBarterLikeCollab(deal);
    const shippingStatus = String(deal?.shipping_status || deal?.raw?.shipping_status || '').trim().toLowerCase();
    const isAwaitingShipment =
        requiresShipping &&
        shippingStatus !== 'shipped' &&
        shippingStatus !== 'delivered' &&
        shippingStatus !== 'received';
    const isDelivered =
        rawStatus.includes('content_delivered') ||
        rawStatus.includes('draft_review') ||
        rawStatus.includes('content_pending') ||
        rawStatus.includes('awaiting_review') ||
        rawStatus.includes('waiting_for_review') ||
        rawStatus.includes('awaiting_approval') ||
        isRevisionDone;
    const isApproved = rawStatus.includes('content_approved') || rawStatus.includes('approved');
    const isPaymentReleased = rawStatus.includes('payment_released') || rawStatus.includes('released');
    const isMaking = rawStatus.includes('content_making') || rawStatus.includes('drafting');
    const isFullyExecuted = rawStatus.includes('fully_executed') || rawStatus === 'signed';
    const isPaymentPending = rawStatus.includes('payment_pending');
    const isContractPending = rawStatus.includes('contract_ready') || rawStatus === 'sent' || rawStatus.includes('signed_pending_creator') || rawStatus.includes('signed_by_brand') || rawStatus.includes('needs signature') || rawStatus === 'accepted';

    const dueDate = parseDealDate(deal?.due_date || deal?.deadline || deal?.raw?.deadline || deal?.raw?.due_date);
    const daysUntilDue = getDaysUntil(dueDate);

    let progressStep = 1;
    if (isCompleted) progressStep = 7;
    else if (isPaymentReleased) progressStep = 6;
    else if (isApproved) progressStep = 5;
    else if (isDelivered || isRevisionRequested) progressStep = 4;
    else if (isMaking) progressStep = 3;
    else if (isPaymentPending) progressStep = 2.5;
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
        nextStep = 'View deal summary';
        cta = 'View Summary';
    } else if (isPaymentReleased) {
        stagePill = isBarterLikeCollab(deal) ? 'COLLABORATION DONE' : 'PAYMENT DONE';
        nextStep = isBarterLikeCollab(deal) ? 'Collaboration successfully finalized.' : 'Payment released to your account.';
        cta = 'View Details';
    } else if (isApproved) {
        stagePill = 'APPROVED';
        nextStep = isBarterLikeCollab(deal) ? 'Content approved! Collaboration finalized.' : 'Content approved! Payout is in progress.';
        cta = isBarterLikeCollab(deal) ? 'View Summary' : 'Track Payout';
    } else if (needsSignature) {
        stagePill = 'SIGN AGREEMENT';
        nextStep = 'Review and sign the agreement to start';
        cta = rawStatus.includes('signed_by_brand') ? 'Sign Agreement' : 'View Contract';
    } else if (isRevisionRequested) {
        stagePill = 'REVISION REQUESTED';
        nextStep = 'Brand requested changes. Please revise.';
        cta = 'Submit Revision';
    } else if (isDelivered) {
        stagePill = 'UNDER REVIEW';
        nextStep = 'Content submitted. Waiting for brand approval.';
        cta = 'View Submission';
    } else if (isAwaitingShipment) {
        stagePill = 'AWAITING PRODUCT';
        nextStep = 'Waiting for brand to ship the product';
        cta = 'Track Shipment';
    } else if (isPaymentPending) {
        stagePill = 'WAITING FOR PAYMENT';
        nextStep = 'Waiting for brand to fund escrow';
        cta = 'Check Status';
    } else if (isFullyExecuted) {
        stagePill = 'READY TO START';
        nextStep = 'Agreement active. You can now start working.';
        cta = 'Start Production';
    } else if (isMaking) {
        const shippingStatus = String(deal?.shipping_status || deal?.raw?.shipping_status || '').trim().toLowerCase();
        const isShippedOnly = requiresShipping && shippingStatus === 'shipped';
        stagePill = isShippedOnly ? 'SHIPPED' : 'IN PRODUCTION';
        nextStep = 'Creator is crafting the content';
        cta = 'Submit Content';
    } else {
        stagePill = 'WAITING';
        nextStep = 'View deal details';
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
    
    if (isPaid || isPaymentReleased) return { label: 'PROCESSING', sublabel: 'Payment being settled', tone: 'success' as const };
    if (ux.isRevisionRequested) return { label: 'REVISION REQUIRED', sublabel: 'Fix requested by brand', tone: 'warning' as const };
    if (isApproved) return { label: 'APPROVED', sublabel: 'Ready for payout', tone: 'success' as const };
    if (rawStatus.includes('content_delivered') || rawStatus.includes('revision_done')) {
        return { label: 'AWAITING APPROVAL', sublabel: 'Brand is reviewing content', tone: 'warning' as const };
    }
    if (rawStatus.includes('draft_review') || rawStatus.includes('content_pending') || rawStatus.includes('active') || rawStatus.includes('working') || rawStatus.includes('ongoing')) {
        return { label: 'AWAITING CONTENT', sublabel: 'Waiting for your delivery', tone: 'info' as const };
    }
    if (isAwaitingApproval) return { label: 'AWAITING APPROVAL', sublabel: 'Waiting for brand review', tone: 'warning' as const };
    return { label: 'PENDING', sublabel: 'Transaction in progress', tone: 'info' as const };
};

// ============================================
// BUDGET RENDERING
// ============================================

export const renderBudgetValue = (item: any) => {
    const exact = Number(
        item?.deal_amount ?? item?.exact_budget ?? item?.amount ??
        item?.total_amount ?? item?.budget ??
        (item?.amounts && item.amounts[0])
    );
    if (Number.isFinite(exact) && exact > 0) return `₹${exact.toLocaleString()}`;

    const min = Number(item?.budget_range?.min || item?.form_data?.budget_range?.min || (item?.budget_range && typeof item.budget_range === 'object' && item.budget_range.min));
    if (Number.isFinite(min) && min > 0) return `₹${min.toLocaleString()}+`;

    const barter = Number(
        item?.barter_value ?? 
        item?.product_value ?? 
        item?.form_data?.barter_value ?? 
        item?.form_data?.product_value ?? 
        item?.raw?.barter_value ??
        item?.raw?.product_value ??
        (item?.collab_type === 'barter' ? item?.deal_amount : 0)
    );
    
    if (Number.isFinite(barter) && barter > 0) {
        const finalBarter = barter <= 1 ? 2499 : barter;
        return `₹${finalBarter.toLocaleString()}`;
    }

    if (item?.collab_type === 'barter' || item?.deal_type === 'barter' || !exact) {
        return '₹2,499 (Est. Value)';
    }

    return 'Barter Collaboration';
};

// ============================================
// LOCATION PARSING
// ============================================

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
        const part = nonPincodeParts[0];
        if (/\d/.test(part) || part.length > 20) {
            address = part;
            city = ''; 
        } else {
            city = part;
            address = '';
        }
    }

    return { address, city, pincode };
};
