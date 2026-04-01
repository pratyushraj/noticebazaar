import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    User, Search, ShieldCheck, Handshake, Camera,
    LayoutDashboard, CreditCard, Briefcase, Menu, Clapperboard, Instagram,
    Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, Bell, ChevronRight, Zap, Link2, CheckCircle2, Download, Clock,
    Info, Globe, Star, LogOut, Copy, Share2, QrCode, Eye, MoreHorizontal, Landmark, FileText, Smartphone, TrendingUp, BarChart3, Mail,
    MessageCircle, MessageSquare, Edit3, Send, X, XCircle, ExternalLink, AlertCircle, AlertTriangle, ArrowRight, Package, Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { CreatorProgressiveChecklist } from '@/components/creator-dashboard/CreatorProgressiveChecklist';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProgressUpdateSheet from '@/components/deals/ProgressUpdateSheet';
import { triggerHaptic as globalTriggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

import PremiumDrawer from '@/components/drawer/PremiumDrawer';
import { supabase } from '@/integrations/supabase/client';
import { DealStage, getDealStageFromStatus, STAGE_TO_PROGRESS, STAGE_TO_STATUS, useUpdateDealProgress } from '@/lib/hooks/useBrandDeals';
import { dealPrimaryCtaButtonClass, getDealPrimaryCta } from '@/lib/deals/primaryCta';

interface MobileDashboardProps {
    profile?: any;
    collabRequests?: any[];
    brandDeals?: any[];
    stats?: any;
    onAcceptRequest?: (req: any) => Promise<void>;
    onDeclineRequest?: (id: string) => void;
    onOpenMenu?: () => void;
    isRefreshing?: boolean;
    onRefresh?: () => Promise<void>;
    onLogout?: () => void;
    /**
     * If true, the dashboard may render demo-only UI (like the Interactive Demo Offer placeholder).
     * Default behavior is to avoid showing demo items for real accounts.
     */
    showDemoOffer?: boolean;
}

interface CollabAnalyticsData {
    period: number;
    views: {
        total: number;
        unique: number;
        trend: number;
        trendDirection: 'up' | 'down';
    };
    submissions: {
        total: number;
        trend: number;
        trendDirection: 'up' | 'down';
    };
    conversionRate: {
        value: number;
        trend: number;
        trendDirection: 'up' | 'down' | 'neutral';
    };
    deviceBreakdown: {
        mobile: number;
        desktop: number;
        tablet: number;
        unknown: number;
    };
    dailySeries?: Array<{
        label: string;
        views: number;
        submissions: number;
    }>;
}

interface CollabAnalyticsSummary {
    weeklyViews: number;
    totalViews: number;
    submissions: number;
    weeklySubmissions: number;
}

interface PackageTemplate {
    id: string;
    name: string;
    description?: string | null;
    deliverables?: string[] | null;
    rate?: number | null;
    revision_count?: number | null;
    turnaround_days?: number | null;
    terms?: string | null;
    is_default?: boolean | null;
    addons?: Array<{ id: string; label: string; price: number }> | null;
}

const buildDefaultPackageTemplates = (profile: any): PackageTemplate[] => {
    const reelRate = Math.max(0, Number(profile?.avg_rate_reel || 0) || 5000);
    return [
        {
            id: 'starter_package',
            name: 'Starter Package',
            description: 'Quick entry package for simple brand collabs.',
            deliverables: ['1 Reel'],
            rate: Math.max(reelRate - 1, 999),
            revision_count: 1,
            turnaround_days: 7,
            terms: 'Includes one revision.',
            is_default: false,
            addons: [],
        },
        {
            id: 'engagement_package',
            name: 'Engagement Package',
            description: 'Balanced package for stronger reach and response.',
            deliverables: ['1 Reel', '2 Stories'],
            rate: Math.max(Math.round(reelRate * 1.5) - 1, 1499),
            revision_count: 1,
            turnaround_days: 10,
            terms: 'Includes one revision and story support.',
            is_default: true,
            addons: [
                { id: 'addon_story', label: 'Extra Story', price: 500 },
            ],
        },
        {
            id: 'product_review',
            name: 'Product Review',
            description: 'Review-led package for launches, barter, or seeding.',
            deliverables: ['1 Unboxing Video', '1 Story'],
            rate: Math.max(1999, Math.round(reelRate * 0.5) - 1),
            revision_count: 1,
            turnaround_days: 14,
            terms: 'Product must be received before content production.',
            is_default: false,
            addons: [],
        },
    ];
};

// Minimal Status Badge for Deal Cards
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        'new': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'NEW' },
        'pending': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'AWAITING REVIEW' },
        'negotiating': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'IN NEGOTIATION' },
        'active': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'ACTIVE' },
        'completed': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'COMPLETED' },
    };
    const normalizeStatus = (status: string) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('complete') || s.includes('closed') || s.includes('paid')) return 'completed';
        if (s.includes('active') || s.includes('sign') || s.includes('execut') || s.includes('making') || s.includes('deliver') || s.includes('ship')) return 'active';
        if (s.includes('neg')) return 'negotiating';
        return 'pending';
    };

    const c = config[normalizeStatus(status)] ?? config['pending'];
    return (
        <span className={cn('px-2.5 py-1 rounded-full text-[12px] font-semibold tracking-wider', c.bg, c.text)}>
            {c.label}
        </span>
    );
};

const renderBudgetValue = (item: any) => {
    const exact = Number(item?.deal_amount || item?.exact_budget);
    if (Number.isFinite(exact) && exact > 0) return `₹${exact.toLocaleString()}`;
    
    // Check for budget range in nested properties
    const min = Number(item?.budget_range?.min || item?.form_data?.budget_range?.min || (item?.budget_range && typeof item.budget_range === 'object' && item.budget_range.min));
    if (Number.isFinite(min) && min > 0) return `₹${min.toLocaleString()}+`;
    
    const barter = Number(item?.barter_value || item?.form_data?.barter_value);
    if (Number.isFinite(barter) && barter > 0) return `₹${barter.toLocaleString()} (Barter)`;
    
    return 'Flexible Budget';
};

const parseDealDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const asString = String(value);
    const dt = new Date(asString);
    return Number.isNaN(dt.getTime()) ? null : dt;
};

const getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
};

const normalizeDealStatus = (deal: any) =>
    String(deal?.status ?? deal?.raw?.status ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');

const inferCreatorRequiresPayment = (deal: any) => {
    if (typeof deal?.requires_payment === 'boolean') return Boolean(deal.requires_payment);
    const kind = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').trim().toLowerCase();
    const amount = Number(deal?.deal_amount || deal?.exact_budget || 0);
    return kind === 'paid' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter' || (kind !== 'barter' && amount > 0);
};

const inferCreatorRequiresShipping = (deal: any) => {
    if (typeof deal?.requires_shipping === 'boolean') return Boolean(deal.requires_shipping);
    if (typeof deal?.shipping_required === 'boolean') return Boolean(deal.shipping_required);
    const kind = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').trim().toLowerCase();
    return kind === 'barter' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter';
};

const normalizeCreatorCollabType = (deal: any) => {
    const raw = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').trim().toLowerCase();
    if (raw === 'both' || raw === 'hybrid' || raw === 'paid_barter') return 'hybrid';
    if (raw === 'barter') return 'barter';
    if (raw === 'paid') return 'paid';
    if (inferCreatorRequiresPayment(deal) && inferCreatorRequiresShipping(deal)) return 'hybrid';
    if (inferCreatorRequiresShipping(deal)) return 'barter';
    return 'paid';
};

const isValidUpiId = (value: string) => /^[a-z0-9._-]{2,}@[a-z]{2,}$/i.test(value.trim());

const getCreatorObligationBadges = (deal: any) => {
    const collabType = normalizeCreatorCollabType(deal);
    const badges = [collabType === 'hybrid' ? 'Paid + Product' : collabType === 'barter' ? 'Free products' : 'Paid'];
    if (inferCreatorRequiresShipping(deal)) badges.push('Shipping required');
    return badges;
};

const getCreatorDealCardUX = (deal: any) => {
    const rawStatus = normalizeDealStatus(deal);

    const isCompleted = rawStatus.includes('completed') || rawStatus === 'paid' || rawStatus.includes('payment_received');
    const isRevisionRequested = rawStatus.includes('revision_requested') || rawStatus.includes('changes_requested') || rawStatus.includes('brand_revision_requested');
    const isRevisionDone = rawStatus.includes('revision_done') || rawStatus.includes('revision_submitted');
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
    const isMaking = rawStatus.includes('content_making') || rawStatus.includes('drafting') || rawStatus.includes('awaiting_product_shipment') || rawStatus.includes('awaiting product shipment');
    const isFullyExecuted = rawStatus.includes('fully_executed') || rawStatus === 'signed';
    const isContractPending = rawStatus.includes('contract_ready') || rawStatus === 'sent' || rawStatus.includes('signed_pending_creator') || rawStatus.includes('signed_by_brand') || rawStatus.includes('needs signature');
    const isOfferStage = !isCompleted && !isPaymentReleased && !isApproved && !isDelivered && !isRevisionRequested && !isMaking && !isFullyExecuted && !isContractPending;

    const dueDate = parseDealDate(deal?.due_date || deal?.deadline || deal?.raw?.deadline || deal?.raw?.due_date);
    const daysUntilDue = getDaysUntil(dueDate);

    let stageKey: 'offer' | 'contract' | 'create' | 'deliver' | 'review' | 'paid' = 'offer';
    if (isCompleted || isPaymentReleased) stageKey = 'paid';
    else if (isApproved || isRevisionRequested) stageKey = 'review';
    else if (isDelivered) stageKey = 'deliver';
    else if (isMaking || isFullyExecuted) stageKey = 'create';
    else if (isContractPending) stageKey = 'contract';
    else if (isOfferStage) stageKey = 'offer';

    const progressStepMap = {
        offer: 1,
        contract: 2,
        create: 3,
        deliver: 4,
        review: 5,
        paid: 6,
    } as const;
    const progressStep = progressStepMap[stageKey];

    const contractLabel = isContractPending
        ? (rawStatus.includes('signed_by_brand') ? 'Contract: waiting for your signature' : 'Contract: pending signature')
        : (isFullyExecuted || isMaking || isDelivered || isApproved || isPaymentReleased || isCompleted ? 'Contract: signed' : null);

    const needsSignature = stageKey === 'contract';
    const needsOfferReview = stageKey === 'offer';
    const needsUpload = stageKey === 'create';
    const needsPaymentConfirmation = stageKey === 'review' && isApproved && !isPaymentReleased;
    const needsCreatorAction = needsOfferReview || needsSignature || needsUpload || isRevisionRequested || needsPaymentConfirmation;

    const urgencyLevel: 'critical' | 'warning' | 'normal' = daysUntilDue !== null && daysUntilDue <= 2
        ? 'critical'
        : daysUntilDue !== null && daysUntilDue <= 5
            ? 'warning'
            : 'normal';

    let stagePill = 'OFFER';
    let nextStep = 'Review the incoming collaboration offer';
    let cta = 'Review Offer';

    if (stageKey === 'paid') {
        stagePill = 'PAID';
        nextStep = 'Payment completed';
        cta = 'Completed';
    } else if (stageKey === 'review') {
        stagePill = 'REVIEW';
        if (isRevisionRequested) {
            nextStep = 'Revision requested by the brand';
            cta = 'Submit Revision';
        } else if (needsPaymentConfirmation) {
            nextStep = 'Confirm payment received';
            cta = 'Waiting Payment';
        } else {
            nextStep = 'Waiting for final review';
            cta = 'Waiting Review';
        }
    } else if (stageKey === 'deliver') {
        stagePill = 'DELIVER';
        nextStep = 'Content delivered, waiting for review';
        cta = 'Waiting Review';
    } else if (stageKey === 'create') {
        stagePill = 'CREATE';
        nextStep = 'Create and upload your content';
        cta = 'Upload Content';
    } else if (stageKey === 'contract') {
        stagePill = 'CONTRACT';
        nextStep = 'Review and sign the agreement';
        cta = 'Sign Contract';
    }

    return {
        rawStatus,
        dueDate,
        daysUntilDue,
        urgencyLevel,
        stageKey,
        progressStep,
        contractLabel,
        needsCreatorAction,
        needsOfferReview,
        needsSignature,
        needsUpload,
        needsPaymentConfirmation,
        isRevisionRequested,
        isRevisionDone,
        isApproved,
        isPaymentReleased,
        isMaking,
        stagePill,
        nextStep,
        cta,
    };
};

const getCreatorPaymentListUX = (deal: any) => {
    const ux = getCreatorDealCardUX(deal);
    const rawStatus = ux.rawStatus;
    const isPaid = rawStatus.includes('completed') || rawStatus === 'paid' || rawStatus.includes('payment_received');
    const isPaymentReleased = rawStatus.includes('payment_released');
    const isApproved = rawStatus.includes('content_approved');
    const isAwaitingApproval = rawStatus.includes('content_delivered') || rawStatus.includes('revision_done') || rawStatus.includes('draft_review') || rawStatus.includes('content_pending');
    const isContractPending = rawStatus.includes('contract_ready') || rawStatus === 'sent' || rawStatus.includes('needs signature');

    if (isPaid) return { label: 'PAID', sublabel: 'Payment completed', tone: 'success' as const };
    if (isPaymentReleased) return { label: 'PAID', sublabel: 'Payment completed', tone: 'success' as const };
    if (isApproved) return { label: 'PAYMENT PENDING', sublabel: 'Waiting for payment release', tone: 'warning' as const };
    if (isAwaitingApproval) return { label: 'UNDER REVIEW', sublabel: 'Waiting for brand approval', tone: 'warning' as const };
    if (isContractPending) return { label: 'CONTRACT', sublabel: 'Sign to start collaboration', tone: 'neutral' as const };
    if (ux.isRevisionRequested) return { label: 'REVISION', sublabel: 'Fix requested before approval', tone: 'warning' as const };
    return { label: 'IN PROGRESS', sublabel: ux.nextStep, tone: 'info' as const };
};

// Animated Number Counter
const AnimatedCounter = ({ value }: { value: number }) => {
    const springValue = useSpring(0, { stiffness: 45, damping: 20 });
    const displayValue = useTransform(springValue, (latest: number) => Math.floor(latest).toLocaleString());

    useEffect(() => {
        const timeout = setTimeout(() => springValue.set(value), 400);
        return () => clearTimeout(timeout);
    }, [value, springValue]);

    return <motion.span>{displayValue}</motion.span>;
};

// Helper components for iOS-style Settings
const SettingsRow = ({ icon, label, subtext, iconBg, hasChevron, isDark, textColor, onClick, rightElement, labelClassName }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "flex items-center gap-4 py-4 px-4 active:bg-opacity-50 transition-all cursor-pointer group",
            isDark ? "active:bg-white/5" : "active:bg-slate-100"
        )}
    >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0", iconBg)}>
            {React.cloneElement(icon, { size: 20, strokeWidth: 1.5 })}
        </div>
        <div className="flex-1 min-w-0">
            <p className={cn("text-[17px] font-medium leading-tight", textColor, labelClassName)}>{label}</p>
            {subtext && <p className={cn("text-[13px] opacity-50 mt-0.5", textColor)}>{subtext}</p>}
        </div>
        {rightElement}
        {hasChevron && !rightElement && <ChevronRight className="w-5 h-5 opacity-20" />}
    </div>
);

const SettingsGroup = ({ children, isDark }: any) => (
    <div className={cn(
        "mx-4 overflow-hidden rounded-2xl border mb-8",
        isDark ? "bg-[#1C1C1E] border-[#2C2C2E] divide-[#2C2C2E]" : "bg-white border-[#E5E5EA] divide-[#E5E5EA] shadow-sm",
        "divide-y"
    )}>
        {children}
    </div>
);

const SectionHeader = ({ title, isDark }: any) => (
    <p className={cn(
        "px-8 mb-2 text-[13px] font-bold uppercase tracking-wider opacity-40",
        isDark ? "text-white" : "text-black"
    )}>
        {title}
    </p>
);

const ToggleSwitch = ({ active, onToggle, isDark }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
            "w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out",
            active ? "bg-green-500" : (isDark ? "bg-[#39393D]" : "bg-[#E9E9EB]")
        )}
    >
        <motion.div
            animate={{ x: active ? 22 : 2 }}
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        />
    </button>
);

const parseLocationParts = (location?: string | null) => {
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

const buildDefaultPastWorkItems = () => ([
    { id: 'past-work-1', brand: 'boAt', campaignType: 'Launch Reel', outcome: '42K views in 5 days', proofLabel: 'Electronics' },
    { id: 'past-work-2', brand: 'Mamaearth', campaignType: 'Routine Story Set', outcome: 'Strong audience fit for skincare shoppers', proofLabel: 'Beauty' },
    { id: 'past-work-3', brand: 'Lenskart', campaignType: 'Review Package', outcome: 'High saves and click-through from lifestyle audience', proofLabel: 'Lifestyle' },
]);

const buildProfileFormData = (profile: any, userEmail?: string | null) => {
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
        pricing_min: profile?.pricing_min || '',
        content_niches: profile?.content_niches || ['Fashion', 'Tech', 'Lifestyle'],
        creator_category: profile?.creator_category || '',
        instagram_followers: profile?.instagram_followers || '',
        avg_reel_views_manual: profile?.avg_reel_views_manual || '',
        avg_likes_manual: profile?.avg_likes_manual || '',
        audience_gender_split: profile?.audience_gender_split || '',
        top_cities: Array.isArray(profile?.top_cities) ? profile.top_cities.join(', ') : '',
        audience_age_range: profile?.audience_age_range || '',
        primary_audience_language: profile?.primary_audience_language || '',
        posting_frequency: profile?.posting_frequency || '',
        active_brand_collabs_month: profile?.active_brand_collabs_month || '',
        campaign_slot_note: profile?.campaign_slot_note || '',
        collab_audience_relevance_note: profile?.collab_audience_relevance_note || '',
        collab_delivery_reliability_note: profile?.collab_delivery_reliability_note || '',
        collab_response_behavior_note: profile?.collab_response_behavior_note || '',
        collab_engagement_confidence_note: profile?.collab_engagement_confidence_note || '',
        collab_intro_line: profile?.collab_intro_line || '',
        collab_region_label: profile?.collab_region_label || '',
        collab_audience_fit_note: profile?.collab_audience_fit_note || '',
        collab_recent_activity_note: profile?.collab_recent_activity_note || '',
        collab_cta_trust_note: profile?.collab_cta_trust_note || '',
        collab_cta_dm_note: profile?.collab_cta_dm_note || '',
        collab_cta_platform_note: profile?.collab_cta_platform_note || '',
        collab_brands_count_override: profile?.collab_brands_count_override || '',
        collab_response_hours_override: profile?.collab_response_hours_override || '',
        past_brands: Array.isArray(profile?.past_brands) ? profile.past_brands.join(', ') : '',
        recent_campaign_types: Array.isArray(profile?.recent_campaign_types) ? profile.recent_campaign_types.join(', ') : '',
        collab_past_work_items: Array.isArray(profile?.collab_past_work_items) && profile.collab_past_work_items.length > 0
            ? profile.collab_past_work_items
            : buildDefaultPastWorkItems(),
        collab_show_packages: profile?.collab_show_packages ?? true,
        collab_show_trust_signals: profile?.collab_show_trust_signals ?? true,
        collab_show_audience_snapshot: profile?.collab_show_audience_snapshot ?? true,
        collab_show_past_work: profile?.collab_show_past_work ?? true,
        bank_account_name: '',
        bank_upi: '',
    };
};

// Main Component
const MobileDashboardDemo = ({
    profile,
    collabRequests = [],
    brandDeals = [],
    stats,
    onAcceptRequest,
    onDeclineRequest,
    onOpenMenu,
    isRefreshing: isRefreshingProp,
    onRefresh,
    onLogout,
    showDemoOffer = false,
}: MobileDashboardProps) => {
    const APP_TAB_STORAGE_KEY = 'creatorarmour.creator.active-tab';
    const APP_COLLAB_SUBTAB_STORAGE_KEY = 'creatorarmour.creator.collabs.subtab';
    const APP_STOREFRONT_SECTION_STORAGE_KEY = 'creatorarmour.creator.storefront.section';
    const APP_THEME_STORAGE_KEY = 'creatorarmour.creator.theme';
    const APP_SCROLL_POSITIONS_STORAGE_KEY = 'creatorarmour.creator.scroll.positions';
    const APP_PROFILE_DRAFT_STORAGE_KEY = 'creatorarmour.creator.profile.draft';
    const APP_DELIVER_DRAFT_STORAGE_KEY = 'creatorarmour.creator.deliver.draft';
    const APP_NOTIFICATIONS_LAST_READ_STORAGE_KEY = 'creatorarmour.creator.notifications.last-read-at';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const signOutMutation = useSignOut();
    const updateDealProgress = useUpdateDealProgress();
    const {
        isSupported: isPushSupported,
        permission: pushPermission,
        isSubscribed: isPushSubscribed,
        isBusy: isPushBusy,
        promptDismissed: isPushPromptDismissed,
        isIOSNeedsInstall,
        hasVapidKey,
        enableNotifications,
        dismissPrompt: dismissPushPrompt,
        sendTestPush,
        refreshStatus: refreshPushStatus,
    } = useDealAlertNotifications();
    const [searchParams, setSearchParams] = useSearchParams();
    const isDemoParamEnabled = ['1', 'true', 'yes'].includes(String(searchParams.get('demo') || '').toLowerCase());
    const isDemoOfferEnabled = Boolean(showDemoOffer || isDemoParamEnabled);
    const persistedTab = typeof window !== 'undefined'
        ? (window.localStorage.getItem(APP_TAB_STORAGE_KEY) as 'dashboard' | 'collabs' | 'payments' | 'profile' | null)
        : null;
    const activeTab = (searchParams.get('tab') as 'dashboard' | 'collabs' | 'payments' | 'profile') || persistedTab || 'dashboard';
    const setActiveTab = (tab: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(APP_TAB_STORAGE_KEY, tab);
        }
        setSearchParams(next, { replace: true });
    };

    const requestIdParam = (searchParams.get('requestId') || '').trim() || null;
    const dealIdParam = (searchParams.get('dealId') || '').trim() || null;
    const subtabParam = (searchParams.get('subtab') as 'active' | 'pending' | 'completed' | null) || null;

    const [collabSubTab, setCollabSubTab] = useState<'active' | 'pending' | 'completed'>(() => {
        if (typeof window === 'undefined') return 'active';
        return (window.localStorage.getItem(APP_COLLAB_SUBTAB_STORAGE_KEY) as 'active' | 'pending' | 'completed' | null) || 'active';
    });
    const hasHandledDeepLinkRef = useRef(false);
    useEffect(() => {
        if (activeTab !== 'collabs') return;

        // Deep-link for Pending Offers (requestId)
        if (requestIdParam) {
            setCollabSubTab('pending');

            if (!hasHandledDeepLinkRef.current) {
                const match = (collabRequests || []).find((r: any) => String(r?.id || r?.raw?.id || '') === requestIdParam);
                if (match) {
                    hasHandledDeepLinkRef.current = true;
                    setSelectedItem(match);
                    setSelectedType('offer');
                    // Clear requestId so the user can freely navigate tabs/subtabs afterwards.
                    const next = new URLSearchParams(searchParams);
                    next.delete('requestId');
                    next.set('tab', 'collabs');
                    next.set('subtab', 'pending');
                    setSearchParams(next, { replace: true });
                }
            }
            return;
        }

        // Deep-link for Active Deals (dealId)
        if (dealIdParam) {
            setCollabSubTab('active');

            if (!hasHandledDeepLinkRef.current) {
                const match = (brandDeals || []).find((d: any) => String(d?.id || d?.raw?.id || '') === dealIdParam);
                if (match) {
                    hasHandledDeepLinkRef.current = true;
                    setSelectedItem(match);
                    setSelectedType('deal');
                    // Clear dealId so the user can freely navigate tabs/subtabs afterwards
                    const next = new URLSearchParams(searchParams);
                    next.delete('dealId');
                    next.set('tab', 'collabs');
                    next.set('subtab', 'active');
                    setSearchParams(next, { replace: true });
                }
            }
            return;
        }

        if (subtabParam === 'pending') setCollabSubTab('pending');
        else if (subtabParam === 'completed') setCollabSubTab('completed');
        else if (subtabParam === 'active') setCollabSubTab('active');
    }, [activeTab, requestIdParam, dealIdParam, subtabParam, collabRequests, brandDeals, searchParams, setSearchParams]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!searchParams.get('tab') && persistedTab) {
            const next = new URLSearchParams(searchParams);
            next.set('tab', persistedTab);
            if (persistedTab === 'collabs') {
                const savedSubtab = window.localStorage.getItem(APP_COLLAB_SUBTAB_STORAGE_KEY);
                if (savedSubtab) next.set('subtab', savedSubtab);
            }
            setSearchParams(next, { replace: true });
        }
    }, [persistedTab, searchParams, setSearchParams]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(APP_COLLAB_SUBTAB_STORAGE_KEY, collabSubTab);
    }, [collabSubTab]);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
            if (storedTheme === 'light' || storedTheme === 'dark') {
                return storedTheme;
            }
        }
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });
    const [showItemMenu, setShowItemMenu] = useState(false);
    const [showProgressSheet, setShowProgressSheet] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            triggerHaptic();
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const getSelectedItemUrl = () => {
        if (!selectedItem) return null;
        const itemId = String(selectedItem?.id || selectedItem?.raw?.id || '').trim();
        if (!itemId) return null;

        if (selectedType === 'offer') return `/collab-requests/${itemId}/brief`;
        if (selectedType === 'deal') return `/creator-dashboard?tab=collabs&subtab=active&dealId=${itemId}`;
        return null;
    };

    const copySelectedItemLink = async () => {
        const path = getSelectedItemUrl();
        if (!path) return toast.error('No link available for this item.');
        const full = new URL(path, window.location.origin).toString();
        try {
            await navigator.clipboard.writeText(full);
            toast.success('Link copied');
        } catch {
            toast.error('Could not copy link on this device.');
        }
    };

    const shareSelectedItemLink = async () => {
        const path = getSelectedItemUrl();
        if (!path) return toast.error('No link available for this item.');
        const full = new URL(path, window.location.origin).toString();
        const title = selectedType === 'deal' ? 'Deal link' : 'Offer link';
        try {
            if (navigator.share) {
                await navigator.share({ title, url: full });
                return;
            }
        } catch {
            // fall back to copy
        }
        await copySelectedItemLink();
    };

    // Sync theme to document element for Tailwind dark mode support
    // This is scoped: we add the class on mount/theme change, and remove it on unmount
    // so it doesn't bleed into other pages (e.g. CollabLinkLanding which is light-only).
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
        // Cleanup on unmount: remove both theme classes so other pages don't inherit
        return () => {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.remove('light');
        };
    }, [theme]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
    }, [theme]);


    const [showActionSheet, setShowActionSheet] = useState(false);
    const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
    const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>(buildDefaultPackageTemplates(profile));
    const [collabAnalytics, setCollabAnalytics] = useState<CollabAnalyticsData | null>(null);
    const [collabAnalyticsSummary, setCollabAnalyticsSummary] = useState<CollabAnalyticsSummary | null>(null);
    const [isLoadingCollabAnalytics, setIsLoadingCollabAnalytics] = useState(false);
    const [showPushInstallGuide, setShowPushInstallGuide] = useState(false);
    const [processingDeal, setProcessingDeal] = React.useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [showDeliverContentModal, setShowDeliverContentModal] = useState(false);
    const [deliverContentUrlDraft, setDeliverContentUrlDraft] = useState('');
    const [deliverCaptionDraft, setDeliverCaptionDraft] = useState('');
    const [deliverAdditionalLinksDraft, setDeliverAdditionalLinksDraft] = useState('');
    const [deliverMessageDraft, setDeliverMessageDraft] = useState('');
    const [deliverContentStatusDraft, setDeliverContentStatusDraft] = useState<'draft' | 'posted'>('draft');
    const [isSubmittingContent, setIsSubmittingContent] = useState(false);
    const [showReportIssueModal, setShowReportIssueModal] = useState(false);
    const [reportIssueReason, setReportIssueReason] = useState('');
    const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);
    const [isReportingIssue, setIsReportingIssue] = useState(false);
    const contractSectionRef = useRef<HTMLDivElement | null>(null);

    // Prevent double scrollbar when item detail modal is open
    useEffect(() => {
        if (selectedItem) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedItem]);

    // When opening the deliver/revision modal, prefill with any previously submitted values.
    useEffect(() => {
        if (!showDeliverContentModal) return;
        const existingUrl = String((selectedItem as any)?.content_submission_url || (selectedItem as any)?.content_url || '').trim();
        const existingCaption = String((selectedItem as any)?.content_caption || '').trim();
        const existingNotes = String((selectedItem as any)?.content_notes || '').trim();
        const existingStatusRaw = String((selectedItem as any)?.content_delivery_status || '').trim().toLowerCase();
        const existingStatus = existingStatusRaw === 'posted' ? 'posted' : 'draft';

        const linksRaw = (selectedItem as any)?.content_links;
        const linksFromDeal: string[] = Array.isArray(linksRaw)
            ? linksRaw.map((v: any) => String(v || '').trim()).filter(Boolean)
            : [];
        const legacyDrive = String((selectedItem as any)?.content_drive_link || '').trim();
        const combinedLinks = Array.from(new Set([...linksFromDeal, legacyDrive].map((v) => String(v || '').trim()).filter(Boolean)));
        const additional = combinedLinks.filter((l) => l !== existingUrl);

        setDeliverContentUrlDraft(existingUrl);
        setDeliverCaptionDraft(existingCaption);
        setDeliverAdditionalLinksDraft(additional.join('\n'));
        setDeliverMessageDraft(existingNotes);
        setDeliverContentStatusDraft(existingStatus);
    }, [showDeliverContentModal, selectedItem]);

    const [selectedType, setSelectedType] = useState<'deal' | 'offer' | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [itemDetailPortalRoot, setItemDetailPortalRoot] = useState<HTMLElement | null>(null);

    // New: Availability & Engagement States
    const [workStatus, setWorkStatus] = useState<'open' | 'limited' | 'booked'>('open');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);

    const currentDealStage: DealStage | undefined = React.useMemo(() => {
        if (selectedType !== 'deal' || !selectedItem) return undefined;
        return getDealStageFromStatus(selectedItem?.status, selectedItem?.progress_percentage);
    }, [selectedItem, selectedType]);

    const selectedDealStatus = normalizeDealStatus(selectedItem);
    const selectedRequiresPayment = selectedType === 'deal' && !!selectedItem ? inferCreatorRequiresPayment(selectedItem) : false;
    const selectedRequiresShipping = selectedType === 'deal' && !!selectedItem ? inferCreatorRequiresShipping(selectedItem) : false;
    const selectedShippingStatus = String(selectedItem?.shipping_status || '').trim().toLowerCase() || 'pending';
    const selectedShippingDelivered = selectedShippingStatus === 'delivered' || selectedShippingStatus === 'received';

    const confirmSelectedProductReceived = async () => {
        if (!selectedItem?.id) return;
        setIsConfirmingReceived(true);
        try {
            const apiBaseUrl = getApiBaseUrl();
            const res = await fetch(`${apiBaseUrl}/api/deals/${selectedItem.id}/shipping/confirm-received`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'Failed to confirm product received');
            }

            setSelectedItem((prev: any) => prev ? {
                ...prev,
                shipping_status: 'delivered',
            } : prev);
            toast.success('Product receipt confirmed');
            await onRefresh?.();
        } catch (error: any) {
            toast.error(error?.message || 'Something went wrong');
        } finally {
            setIsConfirmingReceived(false);
        }
    };

    const reportSelectedShippingIssue = async () => {
        if (!selectedItem?.id || !reportIssueReason.trim()) {
            toast.error('Please describe the issue');
            return;
        }
        setIsReportingIssue(true);
        try {
            const apiBaseUrl = getApiBaseUrl();
            const res = await fetch(`${apiBaseUrl}/api/deals/${selectedItem.id}/shipping/report-issue`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ reason: reportIssueReason.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'Failed to report issue');
            }

            setSelectedItem((prev: any) => prev ? {
                ...prev,
                shipping_status: 'issue_reported',
                shipping_issue_reason: reportIssueReason.trim(),
            } : prev);
            setShowReportIssueModal(false);
            setReportIssueReason('');
            toast.success('Issue reported to the brand');
            await onRefresh?.();
        } catch (error: any) {
            toast.error(error?.message || 'Something went wrong');
        } finally {
            setIsReportingIssue(false);
        }
    };

    const patchDealInCache = React.useCallback(
        (dealId: string, patch: Record<string, any>) => {
            if (!dealId) return;

            queryClient.setQueriesData(
                { queryKey: ['brand_deals'], exact: false },
                (old: any) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((d: any) => (String(d?.id || '') === dealId ? { ...d, ...patch } : d));
                }
            );

            queryClient.setQueriesData(
                { queryKey: ['brand_deal', dealId], exact: false },
                (old: any) => (old && typeof old === 'object' ? { ...old, ...patch } : old)
            );
        },
        [queryClient]
    );

    const handleProgressStageSelect = async (stage: DealStage) => {
        if (stage === 'fully_executed' || stage === 'completed') {
            toast.message('This step is automatic.');
            return;
        }
        if (stage === 'content_delivered') {
            toast.message('Submit delivery links to mark as delivered.');
            setShowProgressSheet(false);
            setShowDeliverContentModal(true);
            return;
        }
        if (!selectedItem?.id || !profile?.id) {
            toast.error('Cannot update progress: missing deal or profile');
            return;
        }

        const previousItemSnapshot = selectedItem;
        const nextStatus = (STAGE_TO_STATUS as any)?.[stage] || selectedItem.status;
        const nextProgress = (STAGE_TO_PROGRESS as any)?.[stage] ?? selectedItem.progress_percentage;

        // Optimistic UI update: update CTA/progress instantly (no refresh needed).
        setSelectedItem((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                status: nextStatus,
                progress_percentage: nextProgress,
                raw: prev.raw
                    ? { ...prev.raw, status: nextStatus, progress_percentage: nextProgress }
                    : prev.raw,
            };
        });
        patchDealInCache(String(selectedItem.id), {
            status: nextStatus,
            progress_percentage: nextProgress,
            updated_at: new Date().toISOString(),
            raw: (selectedItem as any)?.raw
                ? { ...(selectedItem as any).raw, status: nextStatus, progress_percentage: nextProgress }
                : (selectedItem as any)?.raw,
        });

        try {
            await updateDealProgress.mutateAsync({
                dealId: selectedItem.id,
                stage,
                creator_id: profile.id,
            });
            toast.success('Progress updated');
            setShowProgressSheet(false);
            await onRefresh?.();
        } catch (e: any) {
            // Roll back optimistic update (then refetch via existing query invalidations).
            setSelectedItem(previousItemSnapshot);
            queryClient.invalidateQueries({ queryKey: ['brand_deals'], exact: false });
            toast.error(e?.message || 'Failed to update progress');
        }
    };

    const submitDealContent = async () => {
        const dealId = String(selectedItem?.id || '').trim();
        if (!dealId) {
            toast.error('Deal details unavailable');
            return;
        }
        const contentUrl = String(deliverContentUrlDraft || '').trim();
        if (!contentUrl) {
            toast.error('Content link is required');
            return;
        }
        try {
            setIsSubmittingContent(true);
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
            if (!accessToken) {
                toast.error('Authentication required');
                return;
            }
            const apiBase = getApiBaseUrl();
            const resp = await fetch(`${apiBase}/api/deals/${encodeURIComponent(dealId)}/submit-content`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    mainLink: contentUrl,
                    additionalLinks: String(deliverAdditionalLinksDraft || '')
                        .split(/[\n,]+/)
                        .map((v) => v.trim())
                        .filter(Boolean),
                    caption: String(deliverCaptionDraft || '').trim() || null,
                    messageToBrand: String(deliverMessageDraft || '').trim() || null,
                    contentStatus: deliverContentStatusDraft,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok || !data?.success) {
                const msg =
                    data?.error ||
                    data?.details ||
                    (typeof data === 'string' ? data : null) ||
                    `Failed to submit content (HTTP ${resp.status})`;
                throw new Error(msg);
            }
            toast.success('Submitted for review');
            triggerHaptic(HapticPatterns.success);
            // Optimistically update the open deal so CTA/status changes immediately.
            setSelectedItem((prev: any) => {
                if (!prev) return prev;
                const nextStatus = 'Content Delivered';
                const nextProgress = 95;
                return {
                    ...prev,
                    status: nextStatus,
                    progress_percentage: nextProgress,
                    brand_approval_status: 'awaiting_approval',
                    content_submission_url: contentUrl,
                    content_links: Array.from(
                        new Set([
                            contentUrl,
                            ...String(deliverAdditionalLinksDraft || '')
                                .split(/[\n,]+/)
                                .map((v) => v.trim())
                                .filter(Boolean),
                        ])
                    ),
                    content_caption: String(deliverCaptionDraft || '').trim() || null,
                    content_notes: String(deliverMessageDraft || '').trim() || null,
                    content_delivery_status: deliverContentStatusDraft,
                    raw: prev.raw
                        ? {
                            ...prev.raw,
                            status: nextStatus,
                            progress_percentage: nextProgress,
                            brand_approval_status: 'awaiting_approval',
                        }
                        : prev.raw,
                };
            });
            patchDealInCache(dealId, {
                status: 'Content Delivered',
                progress_percentage: 95,
                brand_approval_status: 'awaiting_approval',
                content_submission_url: contentUrl,
                content_delivery_status: deliverContentStatusDraft,
                updated_at: new Date().toISOString(),
            });
            setShowDeliverContentModal(false);
            setDeliverContentUrlDraft('');
            setDeliverCaptionDraft('');
            setDeliverAdditionalLinksDraft('');
            setDeliverMessageDraft('');
            setDeliverContentStatusDraft('draft');
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(APP_DELIVER_DRAFT_STORAGE_KEY);
            }
            await onRefresh?.();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to submit content');
            triggerHaptic(HapticPatterns.error);
        } finally {
            setIsSubmittingContent(false);
        }
    };

    const { session, user, refetchProfile } = useSession();

    const triggerHaptic = (pattern: any = HapticPatterns.light) => {
        globalTriggerHaptic(pattern);
    };

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState<any>(buildProfileFormData(profile, user?.email || null));
    const [profileSaveState, setProfileSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Signing states
    const [showCreatorSigningModal, setShowCreatorSigningModal] = useState(false);
    const [isSendingCreatorOTP, setIsSendingCreatorOTP] = useState(false);
    const [isVerifyingCreatorOTP, setIsVerifyingCreatorOTP] = useState(false);
    const [creatorOTP, setCreatorOTP] = useState('');
    const [creatorSigningStep, setCreatorSigningStep] = useState<'send' | 'verify'>('send');
    const [isSigningAsCreator, setIsSigningAsCreator] = useState(false);
    const [liveCollabProfile, setLiveCollabProfile] = useState<{ name?: string | null; profile_photo?: string | null } | null>(null);
    const [isCollabLinkCopied, setIsCollabLinkCopied] = useState(false);
    const actionRequiredRef = useRef<HTMLDivElement>(null);

    const isGeneratedCreatorHandle = (value?: string | null) => Boolean(value && /^creator-[a-z0-9]{6,}$/i.test(value.trim()));
    const normalizedInstagramHandle = (profile?.instagram_handle || '').replace('@', '').trim();
    const normalizedUsername = (profile?.username || '').replace('@', '').trim();
    const instagramHandle = normalizedInstagramHandle && !isGeneratedCreatorHandle(normalizedInstagramHandle)
        ? normalizedInstagramHandle
        : '';
    const usernameFallback = normalizedUsername && !isGeneratedCreatorHandle(normalizedUsername)
        ? normalizedUsername
        : '';
    const username = instagramHandle || usernameFallback || 'creator';
    const avatarFallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=10B981&color=fff`;
    const resolveAvatarUrl = (candidate: any) => {
        const raw = String(candidate || '').trim();
        if (!raw) return '';
        if (/^(https?:)?\/\//i.test(raw)) return raw.startsWith('//') ? `https:${raw}` : raw;
        if (/^(data:|blob:)/i.test(raw)) return raw;
        // Avoid relative/non-URL values which commonly break on iOS (renders as a "?" placeholder).
        return '';
    };
    const avatarUrl =
        resolveAvatarUrl(liveCollabProfile?.profile_photo) ||
        resolveAvatarUrl(profile?.instagram_profile_photo) ||
        resolveAvatarUrl(profile?.avatar_url) ||
        avatarFallbackUrl;
    const displayName = liveCollabProfile?.name || profile?.full_name || profile?.first_name || 'Pratyush';
    const pendingOffersCount = (collabRequests || []).length;
    const completedDealsList = React.useMemo(() => {
        return (brandDeals || []).filter((d: any) => {
            const s = normalizeDealStatus(d);
            return s.includes('completed') || s === 'paid';
        });
    }, [brandDeals]);
    const activeDealsList = React.useMemo(() => {
        return (brandDeals || []).filter((d: any) => {
            const s = normalizeDealStatus(d);
            return !(s.includes('completed') || s === 'paid');
        });
    }, [brandDeals]);
    const actionRequiredDealsList = React.useMemo(() => {
        return (activeDealsList || []).filter((d: any) => Boolean(getCreatorDealCardUX(d).needsCreatorAction));
    }, [activeDealsList]);
    const actionRequiredDealsCount = actionRequiredDealsList.length;
    const actionRequiredTotalCount = pendingOffersCount + actionRequiredDealsCount;
    const activeDealsCount = activeDealsList.length;
    const completedDealsCount = completedDealsList.length;
    const trustLevel = completedDealsCount >= 10 ? 3 : completedDealsCount >= 3 ? 2 : 1;
    const trustLevelLabel = trustLevel === 3 ? "Pro Partner" : trustLevel === 2 ? "Rising Star" : "New Creator";
    const nextTrustUnlock = trustLevel === 1 ? (3 - completedDealsCount) : trustLevel === 2 ? (10 - completedDealsCount) : 0;
    const collabViews = collabAnalytics?.views.total ?? 0;
    const collabRequestCount = collabAnalytics?.submissions.total ?? 0;
    const collabConversion = collabAnalytics?.conversionRate.value ?? 0;
    const creatorUpiOnFile = String(profile?.bank_upi || profileFormData.bank_upi || '').trim();
    const creatorHasPaidDealsWithoutUpi = !!(brandDeals || []).some((deal: any) => inferCreatorRequiresPayment(deal)) && !creatorUpiOnFile;
    const creatorStage: string = (profile as any)?.creator_stage || 'new';
    const storefrontUrl = `creatorarmour.com/${username}`;
    const storefrontFullUrl = `https://creatorarmour.com/${username}`;

    // Auto-scroll to Action Required when creator gets their first offer
    useEffect(() => {
        if (pendingOffersCount > 0 && activeTab === 'dashboard' && actionRequiredRef.current) {
            const el = actionRequiredRef.current;
            const timer = window.setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 600);
            return () => window.clearTimeout(timer);
        }
    // Only trigger on first render with offers, not every re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Compute Monthly Revenue based on active deals this month
    const monthlyRevenue = React.useMemo(() => {
        if (stats?.earnings > 0 && stats?.timeframe === 'month') return stats.earnings;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return (brandDeals || []).reduce((sum, deal) => {
            const dateStr = deal.payment_received_date || deal.payment_expected_date || deal.due_date || deal.created_at;
            let isCurrentMonth = true;
            if (dateStr) {
                const date = new Date(dateStr);
                isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }
            return sum + (isCurrentMonth ? (deal.deal_amount || 0) : 0);
        }, 0);
    }, [stats?.earnings, brandDeals]);
    const pendingPaymentsAmount = React.useMemo(() => {
        return activeDealsList.reduce((sum, deal: any) => {
            const ux = getCreatorPaymentListUX(deal);
            if (ux.label === 'PAID') return sum;
            return sum + Number(deal?.deal_amount || 0);
        }, 0);
    }, [activeDealsList]);
    const completedPaymentsAmount = React.useMemo(() => {
        return completedDealsList.reduce((sum, deal: any) => sum + Number(deal?.deal_amount || 0), 0);
    }, [completedDealsList]);
    const isDashboardRefreshing = Boolean(isRefreshingProp && activeTab === 'dashboard');
    const isPaymentsRefreshing = Boolean(isRefreshingProp && activeTab === 'payments');
    const bookingReadinessChecks = React.useMemo(() => ([
        Boolean((profile?.collab_intro_line || '').trim()),
        Array.isArray(packageTemplates) && packageTemplates.some((pkg: any) => Number(pkg?.rate || 0) > 0),
        Boolean((profile?.media_kit_url || '').trim()),
        Boolean((profile?.bank_upi || profileFormData?.bank_upi || '').trim()),
        Boolean((profile?.collab_brands_count_override || 0) > 0 || (profile?.collab_past_work_items || []).length > 0),
    ]), [packageTemplates, profile?.bank_upi, profile?.collab_brands_count_override, profile?.collab_intro_line, profile?.collab_past_work_items, profile?.media_kit_url, profileFormData?.bank_upi]);
    const bookingReadinessScore = Math.round((bookingReadinessChecks.filter(Boolean).length / bookingReadinessChecks.length) * 100);
    const storefrontReadinessTasks = React.useMemo(() => ([
        {
            done: Boolean((profile?.collab_intro_line || '').trim()),
            label: 'Add your intro line',
            target: () => {
                setActiveTab('account');
                setActiveSettingsPage('collab-link');
                setStorefrontSection('profile');
            },
        },
        {
            done: Array.isArray(packageTemplates) && packageTemplates.some((pkg: any) => Number(pkg?.rate || 0) > 0),
            label: 'Set your first package',
            target: () => {
                setActiveTab('account');
                setActiveSettingsPage('packages');
            },
        },
        {
            done: Boolean((profile?.media_kit_url || '').trim()),
            label: 'Add a media kit or portfolio link',
            target: () => {
                setActiveTab('account');
                setActiveSettingsPage('collab-link');
                setStorefrontSection('profile');
            },
        },
        {
            done: Boolean((profile?.bank_upi || profileFormData?.bank_upi || '').trim()),
            label: 'Add payout details',
            target: () => {
                setActiveTab('account');
                setActiveSettingsPage('payouts');
            },
        },
        {
            done: Boolean((profile?.collab_brands_count_override || 0) > 0 || (profile?.collab_past_work_items || []).length > 0),
            label: 'Add one proof item',
            target: () => {
                setActiveTab('account');
                setActiveSettingsPage('collab-link');
                setStorefrontSection('proof');
            },
        },
    ]), [packageTemplates, profile?.bank_upi, profile?.collab_brands_count_override, profile?.collab_intro_line, profile?.collab_past_work_items, profile?.media_kit_url, profileFormData?.bank_upi]);
    const remainingStorefrontTasks = storefrontReadinessTasks.filter((task) => !task.done);
    const isStorefrontDiscoverable = remainingStorefrontTasks.length === 0;
    const storefrontStatus = isStorefrontDiscoverable
        ? { label: 'Visible In Brand Search', tone: 'emerald' as const, helper: 'Brands can now discover and compare your collab page.' }
        : bookingReadinessScore >= 60
            ? { label: 'Collab Page Preview Ready', tone: 'blue' as const, helper: 'Your page is usable. Finish the remaining fields to unlock discovery.' }
            : { label: 'Needs Setup', tone: 'amber' as const, helper: 'Add the core selling details so brands know what you offer.' };
    const applyStarterStorefrontContent = () => {
        const displayName = String(profileFormData?.full_name || profile?.first_name || profile?.username || 'Creator').trim();
        const category = String(profileFormData?.creator_category || profile?.creator_category || 'Lifestyle').trim();
        const followers = Number(profileFormData?.instagram_followers || profile?.instagram_followers || 0) || 18000;
        const baseRate = Math.max(
            5000,
            Number(profileFormData?.avg_rate_reel || profile?.avg_rate_reel || packageTemplates?.[0]?.rate || 0) || 12000
        );

        setProfileFormData((prev: any) => ({
            ...prev,
            collab_intro_line: prev?.collab_intro_line?.trim() || `${category} creator helping brands launch clear, conversion-focused collaborations.`,
            media_kit_url: prev?.media_kit_url?.trim() || 'https://drive.google.com/your-media-kit',
            creator_category: prev?.creator_category?.trim() || category,
            instagram_followers: prev?.instagram_followers || String(followers),
            collab_brands_count_override: prev?.collab_brands_count_override || '3',
            collab_response_hours_override: prev?.collab_response_hours_override || '3',
            content_niches: Array.isArray(prev?.content_niches) && prev.content_niches.length > 0 ? prev.content_niches : [category],
            collab_past_work_items: Array.isArray(prev?.collab_past_work_items) && prev.collab_past_work_items.length > 0
                ? prev.collab_past_work_items
                : [{
                    id: 'starter-proof',
                    brand: `${displayName.split(' ')[0] || 'Creator'} x Demo Brand`,
                    campaignType: 'Instagram Reel',
                    outcome: 'Starter proof card added for your collab page',
                    proofLabel: 'Featured work',
                }],
        }));

        setPackageTemplates((prev) => {
            const seeded = Array.isArray(prev) && prev.length > 0 ? [...prev] : buildDefaultPackageTemplates(profile);
            if (!seeded[0]) return seeded;
            seeded[0] = {
                ...seeded[0],
                name: seeded[0].name || 'Starter Package',
                description: seeded[0].description || 'Fast brand-ready reel package for discovery campaigns.',
                deliverables: Array.isArray(seeded[0].deliverables) && seeded[0].deliverables.length > 0 ? seeded[0].deliverables : ['1 Reel'],
                rate: Number(seeded[0].rate || 0) > 0 ? seeded[0].rate : baseRate,
                turnaround_days: seeded[0].turnaround_days || 5,
                revision_count: seeded[0].revision_count ?? 1,
                is_default: true,
            };
            return seeded;
        });

        toast.success('Starter collab page content added');
        triggerHaptic(HapticPatterns.success);
    };
    const dashboardActionItems = React.useMemo(() => {
        const items: Array<{ id: string; priority: number; title: string; subtitle: string; cta: string; tone: 'amber' | 'blue' | 'red' | 'emerald'; onClick: () => void }> = [];

        collabRequests.slice(0, 3).forEach((req: any, index: number) => {
            items.push({
                id: `offer-${req?.id || index}`,
                priority: 1,
                title: 'Review Offer',
                subtitle: `${req?.brand_name || 'Brand'} sent a new collaboration request`,
                cta: 'Review Offer',
                tone: 'blue',
                onClick: () => {
                    triggerHaptic();
                    setSelectedItem(req);
                    setSelectedType('offer');
                },
            });
        });

        actionRequiredDealsList.slice(0, 4).forEach((deal: any, index: number) => {
            const ux = getCreatorDealCardUX(deal);
            let title = 'Open Deal';
            let priority = 99;
            if (ux.needsOfferReview) {
                title = 'Review Offer';
                priority = 1;
            } else if (ux.needsSignature) {
                title = 'Sign Contract';
                priority = 2;
            } else if (ux.needsUpload) {
                title = 'Upload Content';
                priority = 3;
            } else if (ux.isRevisionRequested) {
                title = 'Revision Requested';
                priority = 4;
            } else if (ux.needsPaymentConfirmation) {
                title = 'Confirm Payment Received';
                priority = 5;
            }

            items.push({
                id: `deal-${deal?.id || index}`,
                priority,
                title,
                subtitle: `${deal?.brand_name || 'Brand'} • ${ux.nextStep}`,
                cta: title,
                tone: ux.isRevisionRequested ? 'red' : ux.needsSignature ? 'amber' : ux.needsPaymentConfirmation ? 'emerald' : 'blue',
                onClick: () => {
                    triggerHaptic();
                    setSelectedItem(deal);
                    setSelectedType('deal');
                },
            });
        });

        if (creatorHasPaidDealsWithoutUpi) {
            items.push({
                id: 'upi-required',
                priority: 5,
                title: 'Payment Pending Confirmation',
                subtitle: 'Add your UPI ID before brands release money',
                cta: 'Confirm Payment',
                tone: 'amber',
                onClick: () => {
                    triggerHaptic();
                    setActiveTab('profile');
                    setActiveSettingsPage('payouts');
                },
            });
        }

        return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
    }, [actionRequiredDealsList, collabRequests, creatorHasPaidDealsWithoutUpi]);
    const recentActivityItems = React.useMemo(() => {
        const items: Array<{ id: string; title: string; meta: string; date: number }> = [];

        collabRequests.slice(0, 4).forEach((req: any, index: number) => {
            items.push({
                id: `activity-offer-${req?.id || index}`,
                title: `Offer received from ${req?.brand_name || 'Brand'}`,
                meta: `${req?.collab_type || 'paid'} collaboration`,
                date: new Date(req?.created_at || Date.now()).getTime(),
            });
        });

        brandDeals.slice(0, 12).forEach((deal: any, index: number) => {
            const ux = getCreatorDealCardUX(deal);
            let title = `Offer received from ${deal?.brand_name || 'Brand'}`;
            if (normalizeDealStatus(deal).includes('completed')) title = `Deal completed with ${deal?.brand_name || 'Brand'}`;
            else if (ux.isPaymentReleased || normalizeDealStatus(deal).includes('paid') || normalizeDealStatus(deal).includes('payment_received')) title = `Payment marked as paid by ${deal?.brand_name || 'Brand'}`;
            else if (ux.needsSignature) title = `Contract signed by brand for ${deal?.brand_name || 'Brand'}`;
            else if (ux.needsUpload) title = `Content creation started for ${deal?.brand_name || 'Brand'}`;
            else if (ux.stageKey === 'deliver') title = `Content delivered to ${deal?.brand_name || 'Brand'}`;
            else if (ux.isRevisionRequested) title = `Revision requested by ${deal?.brand_name || 'Brand'}`;
            else if (ux.isApproved) title = `Content approved by ${deal?.brand_name || 'Brand'}`;

            items.push({
                id: `activity-deal-${deal?.id || index}`,
                title,
                meta: ux.stagePill,
                date: new Date(deal?.updated_at || deal?.created_at || Date.now()).getTime(),
            });
        });

        return items.sort((a, b) => b.date - a.date).slice(0, 5);
    }, [brandDeals, collabRequests]);
    useEffect(() => {
        const handle = (instagramHandle || '').trim();
        if (!handle) {
            setLiveCollabProfile(null);
            return;
        }

        const controller = new AbortController();
        const loadLiveCollabProfile = async () => {
            try {
                const response = await fetch(`${getApiBaseUrl()}/api/collab/${encodeURIComponent(handle)}`, {
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const data = await response.json().catch(() => null);
                const creator = data?.creator;
                if (!creator) return;
                setLiveCollabProfile({
                    name: creator.name || null,
                    profile_photo: creator.profile_photo || null,
                });
            } catch {
                // Ignore transient failures; fallback profile data remains visible.
            }
        };

        loadLiveCollabProfile();
        return () => controller.abort();
    }, [instagramHandle]);

    const yearlyRevenue = React.useMemo(() => {
        if (stats?.earnings > 0 && stats?.timeframe === 'year') return stats.earnings;
        const currentYear = new Date().getFullYear();
        return (brandDeals || []).reduce((sum, deal) => {
            const dateStr = deal.payment_received_date || deal.payment_expected_date || deal.due_date || deal.created_at;
            let isCurrentYear = true;
            if (dateStr) {
                const date = new Date(dateStr);
                isCurrentYear = date.getFullYear() === currentYear;
            }
            return sum + (isCurrentYear ? (deal.deal_amount || 0) : 0);
        }, 0);
    }, [stats?.earnings, brandDeals]);

    const allTimeRevenue = React.useMemo(() => {
        if (stats?.earnings > 0 && stats?.timeframe === 'allTime') return stats.earnings;
        return (brandDeals || []).reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    }, [stats?.earnings, brandDeals]);

    useEffect(() => {
        const titles: Record<string, string> = {
            dashboard: 'Dashboard | CreatorArmour',
            collabs: 'Collabs | CreatorArmour',
            payments: 'Payments | CreatorArmour',
            profile: 'Profile | CreatorArmour',
        };
        document.title = titles[activeTab] || 'CreatorArmour';
    }, [activeTab]);

    const [pullDistance, setPullDistance] = useState(0);
    const [startY, setStartY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastListScrollTopRef = useRef(0);

    const isDark = theme === 'dark';
    // Brand-like background base (gradient overlays applied in JSX below)
    const bgColor = isDark ? '#061318' : '#FFFFFF';
    const cardBgColor = isDark ? 'bg-white/5 backdrop-blur-md' : 'bg-white';
    const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
    const secondaryTextColor = isDark ? 'text-white/60' : 'text-slate-500';
    const textColor = isDark ? 'text-white' : 'text-slate-900';

    const shouldShowPushPrompt =
        isPushSupported &&
        hasVapidKey &&
        !isPushSubscribed &&
        pushPermission !== 'denied' &&
        !isPushPromptDismissed;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshingProp) {
            setStartY(e.touches[0].pageY);
        }
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY > 0 && scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshingProp) {
            const diff = e.touches[0].pageY - startY;
            if (diff > 0) setPullDistance(Math.min(diff * 0.4, 80));
        }
    };
    const handleTouchEnd = () => {
        if (pullDistance > 50 && onRefresh) { onRefresh(); setPullDistance(60); }
        else setPullDistance(0);
        setStartY(0);
    };
    useEffect(() => {
        if (typeof window === 'undefined' || !scrollRef.current) return;
        const viewKey = activeSettingsPage ? `settings:${activeSettingsPage}` : `tab:${activeTab}`;
        try {
            const raw = window.localStorage.getItem(APP_SCROLL_POSITIONS_STORAGE_KEY);
            const saved = raw ? JSON.parse(raw) : {};
            const top = Number(saved?.[viewKey] || 0);
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = top;
                }
            });
        } catch {
            // ignore malformed saved positions
        }
    }, [activeSettingsPage, activeTab]);
    useEffect(() => {
        if (typeof window === 'undefined' || !scrollRef.current) return;
        const node = scrollRef.current;
        const handleScroll = () => {
            lastListScrollTopRef.current = node.scrollTop;
            const viewKey = activeSettingsPage ? `settings:${activeSettingsPage}` : `tab:${activeTab}`;
            try {
                const raw = window.localStorage.getItem(APP_SCROLL_POSITIONS_STORAGE_KEY);
                const saved = raw ? JSON.parse(raw) : {};
                saved[viewKey] = node.scrollTop;
                window.localStorage.setItem(APP_SCROLL_POSITIONS_STORAGE_KEY, JSON.stringify(saved));
            } catch {
                // ignore storage issues
            }
        };
        node.addEventListener('scroll', handleScroll, { passive: true });
        return () => node.removeEventListener('scroll', handleScroll);
    }, [activeSettingsPage, activeTab]);
    useEffect(() => {
        if (!selectedItem || !scrollRef.current) return;
        lastListScrollTopRef.current = scrollRef.current.scrollTop;
    }, [selectedItem]);

    React.useEffect(() => { if (!isRefreshingProp) setPullDistance(0); }, [isRefreshingProp]);
    React.useEffect(() => {
        const meta = document.querySelector('meta[name=theme-color]');
        const orig = meta?.getAttribute('content');
        meta?.setAttribute('content', bgColor);
        document.body.style.backgroundColor = bgColor;
        return () => { if (meta && orig) meta.setAttribute('content', orig); };
    }, [theme, bgColor]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const existing = document.getElementById('nb-item-detail-root') as HTMLElement | null;
        if (existing) {
            setItemDetailPortalRoot(existing);
            return;
        }
        const el = document.createElement('div');
        el.id = 'nb-item-detail-root';
        document.body.appendChild(el);
        setItemDetailPortalRoot(el);
        // Keep node for the app lifetime to avoid iOS unmount race conditions.
    }, []);

    useEffect(() => {
        if (activeSettingsPage !== 'collab-link') return;
        if (!profile?.id) return;

        let isCancelled = false;

        const fetchCollabAnalytics = async () => {
            setIsLoadingCollabAnalytics(true);
            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !sessionData.session?.access_token) {
                    if (!isCancelled) {
                        setCollabAnalytics(null);
                        setCollabAnalyticsSummary(null);
                    }
                    return;
                }

                const headers = {
                    Authorization: `Bearer ${sessionData.session.access_token}`,
                    'Content-Type': 'application/json',
                };
                const apiBaseUrl = getApiBaseUrl();
                const [analyticsRes, summaryRes] = await Promise.all([
                    fetch(`${apiBaseUrl}/api/collab-analytics?days=7`, { headers }),
                    fetch(`${apiBaseUrl}/api/collab-analytics/summary`, { headers }),
                ]);

                const analyticsJson = await analyticsRes.json().catch(() => null);
                const summaryJson = await summaryRes.json().catch(() => null);

                if (isCancelled) return;

                setCollabAnalytics(analyticsRes.ok && analyticsJson?.success ? analyticsJson.analytics : null);
                setCollabAnalyticsSummary(summaryRes.ok && summaryJson?.success ? {
                    weeklyViews: Number(summaryJson.weeklyViews || 0),
                    totalViews: Number(summaryJson.totalViews || 0),
                    submissions: Number(summaryJson.submissions || 0),
                    weeklySubmissions: Number(summaryJson.weeklySubmissions || 0),
                } : null);
            } catch {
                if (!isCancelled) {
                    setCollabAnalytics(null);
                    setCollabAnalyticsSummary(null);
                }
            } finally {
                if (!isCancelled) setIsLoadingCollabAnalytics(false);
            }
        };

        fetchCollabAnalytics();
        return () => {
            isCancelled = true;
        };
    }, [activeSettingsPage, profile?.id]);

    useEffect(() => {
        if (profile) {
            setProfileFormData((prev: any) => ({ ...prev, ...buildProfileFormData(profile, user?.email || null) }));
            setPackageTemplates(
                Array.isArray((profile as any)?.deal_templates) && (profile as any).deal_templates.length > 0
                    ? (profile as any).deal_templates.slice(0, 3)
                    : buildDefaultPackageTemplates(profile)
            );
        }
    }, [profile, user?.email]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const rawDraft = window.localStorage.getItem(APP_PROFILE_DRAFT_STORAGE_KEY);
        if (!rawDraft) return;
        try {
            const draft = JSON.parse(rawDraft);
            if (draft && typeof draft === 'object') {
                setProfileFormData((prev: any) => ({ ...prev, ...draft }));
            }
        } catch {
            // ignore corrupt draft
        }
    }, []);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const timeout = window.setTimeout(() => {
            window.localStorage.setItem(APP_PROFILE_DRAFT_STORAGE_KEY, JSON.stringify(profileFormData));
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [profileFormData]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const rawDraft = window.localStorage.getItem(APP_DELIVER_DRAFT_STORAGE_KEY);
        if (!rawDraft) return;
        try {
            const draft = JSON.parse(rawDraft);
            if (draft?.url) setDeliverContentUrlDraft(String(draft.url));
            if (draft?.caption) setDeliverCaptionDraft(String(draft.caption));
            if (draft?.additionalLinks) setDeliverAdditionalLinksDraft(String(draft.additionalLinks));
            if (draft?.message) setDeliverMessageDraft(String(draft.message));
            if (draft?.status === 'posted' || draft?.status === 'draft') setDeliverContentStatusDraft(draft.status);
        } catch {
            // ignore corrupt draft
        }
    }, []);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const timeout = window.setTimeout(() => {
            window.localStorage.setItem(APP_DELIVER_DRAFT_STORAGE_KEY, JSON.stringify({
                url: deliverContentUrlDraft,
                caption: deliverCaptionDraft,
                additionalLinks: deliverAdditionalLinksDraft,
                message: deliverMessageDraft,
                status: deliverContentStatusDraft,
            }));
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [deliverAdditionalLinksDraft, deliverCaptionDraft, deliverContentStatusDraft, deliverContentUrlDraft, deliverMessageDraft]);

    const handleSaveProfile = async () => {
        if (!session?.user?.id) return;
        const trimmedUpi = String(profileFormData.bank_upi || '').trim();
        if (trimmedUpi && !isValidUpiId(trimmedUpi)) {
            toast.error('Enter a valid UPI ID like yourname@upi');
            return;
        }
        setIsSavingProfile(true);
        setProfileSaveState('saving');
        triggerHaptic(HapticPatterns.light);
        try {
            const nameParts = (profileFormData.full_name || '').trim().split(/\s+/);
            const first_name = nameParts[0] || null;
            const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

            // Step 1: Update fields that are guaranteed to exist in profiles.
            // Keep this payload minimal — do NOT include columns that may not exist.
            const locParts = [];
            if (profileFormData.address) locParts.push(profileFormData.address.trim());
            if (profileFormData.city) locParts.push(profileFormData.city.trim());
            if (profileFormData.pincode) locParts.push(profileFormData.pincode.trim());
            const location = locParts.join(', ') || null;

            const corePayload: Record<string, unknown> = {
                first_name,
                last_name,
                phone: profileFormData.phone || null,
                bio: profileFormData.bio || null,
                location: location,
                creator_category: profileFormData.creator_category?.trim() || null,
                instagram_followers: Number(profileFormData.instagram_followers || 0) || null,
                avg_reel_views_manual: Number(profileFormData.avg_reel_views_manual || 0) || null,
                avg_likes_manual: Number(profileFormData.avg_likes_manual || 0) || null,
                audience_gender_split: profileFormData.audience_gender_split?.trim() || null,
                top_cities: String(profileFormData.top_cities || '')
                    .split(',')
                    .map((city) => city.trim())
                    .filter(Boolean),
                audience_age_range: profileFormData.audience_age_range?.trim() || null,
                primary_audience_language: profileFormData.primary_audience_language?.trim() || null,
                posting_frequency: profileFormData.posting_frequency?.trim() || null,
                active_brand_collabs_month: Number(profileFormData.active_brand_collabs_month || 0) || null,
                campaign_slot_note: profileFormData.campaign_slot_note?.trim() || null,
                collab_intro_line: profileFormData.collab_intro_line?.trim() || null,
                collab_region_label: profileFormData.collab_region_label?.trim() || null,
                collab_audience_fit_note: profileFormData.collab_audience_fit_note?.trim() || null,
                collab_recent_activity_note: profileFormData.collab_recent_activity_note?.trim() || null,
                collab_audience_relevance_note: profileFormData.collab_audience_relevance_note?.trim() || null,
                collab_delivery_reliability_note: profileFormData.collab_delivery_reliability_note?.trim() || null,
                collab_response_behavior_note: profileFormData.collab_response_behavior_note?.trim() || null,
                collab_engagement_confidence_note: profileFormData.collab_engagement_confidence_note?.trim() || null,
                collab_cta_trust_note: profileFormData.collab_cta_trust_note?.trim() || null,
                collab_cta_dm_note: profileFormData.collab_cta_dm_note?.trim() || null,
                collab_cta_platform_note: profileFormData.collab_cta_platform_note?.trim() || null,
                collab_brands_count_override: Number(profileFormData.collab_brands_count_override || 0) || null,
                collab_response_hours_override: Number(profileFormData.collab_response_hours_override || 0) || null,
                pricing_min: Number(profileFormData.pricing_min || 0) || null,
                content_niches: Array.isArray(profileFormData.content_niches) ? profileFormData.content_niches : [],
                media_kit_url: profileFormData.media_kit_url?.trim() || null,
                past_brands: (Array.isArray(profileFormData.collab_past_work_items) ? profileFormData.collab_past_work_items : [])
                    .map((item: any) => String(item?.brand || '').trim())
                    .filter(Boolean),
                recent_campaign_types: (Array.isArray(profileFormData.collab_past_work_items) ? profileFormData.collab_past_work_items : [])
                    .map((item: any) => String(item?.campaignType || '').trim())
                    .filter(Boolean),
                collab_past_work_items: (Array.isArray(profileFormData.collab_past_work_items) ? profileFormData.collab_past_work_items : [])
                    .map((item: any, index: number) => ({
                        id: String(item?.id || `past-work-${index + 1}`),
                        brand: String(item?.brand || '').trim(),
                        campaignType: String(item?.campaignType || '').trim(),
                        outcome: String(item?.outcome || '').trim(),
                        proofLabel: String(item?.proofLabel || '').trim() || null,
                    }))
                    .filter((item: any) => item.brand || item.campaignType || item.outcome || item.proofLabel),
                collab_show_packages: profileFormData.collab_show_packages !== false,
                collab_show_trust_signals: profileFormData.collab_show_trust_signals !== false,
                collab_show_audience_snapshot: profileFormData.collab_show_audience_snapshot !== false,
                collab_show_past_work: profileFormData.collab_show_past_work !== false,
                bank_account_name: profileFormData.bank_account_name?.trim() || null,
                bank_upi: profileFormData.bank_upi?.trim() || null,
                deal_templates: packageTemplates.map((template) => ({
                    ...template,
                    name: String(template.name || '').trim() || 'Package',
                    description: String(template.description || '').trim() || null,
                    deliverables: Array.isArray(template.deliverables) ? template.deliverables.filter(Boolean) : [],
                    rate: Number(template.rate || 0) || 0,
                    revision_count: Number(template.revision_count || 0) || 0,
                    turnaround_days: Number(template.turnaround_days || 0) || 0,
                    terms: String(template.terms || '').trim() || null,
                    is_default: Boolean(template.is_default),
                    addons: Array.isArray(template.addons)
                        ? template.addons
                            .map((addon) => ({
                                id: String(addon.id || `addon_${Date.now()}`),
                                label: String(addon.label || '').trim(),
                                price: Number(addon.price || 0) || 0,
                            }))
                            .filter((addon) => addon.label)
                        : [],
                })),
            };

            const { error: coreError } = await (supabase as any)
                .from('profiles')
                .update(corePayload)
                .eq('id', session.user.id);

            if (coreError) {
                console.error('[handleSaveProfile] Core update failed:', {
                    message: coreError.message,
                    code: coreError.code,
                    details: coreError.details,
                    hint: coreError.hint,
                });
                throw coreError;
            }

            // Step 2: Update Instagram handle + collab username together.
            const newHandle = (profileFormData.instagram_handle || '').trim().replace(/^@/, '');
            const currentHandle = (profile?.instagram_handle || '').trim().replace(/^@/, '');
            if (newHandle && newHandle !== currentHandle) {
                const normalizedHandle = newHandle
                    .replace(/\s/g, '')
                    .toLowerCase()
                    .replace(/[^a-z0-9._]/g, '')
                    .trim();

                if (normalizedHandle.length < 3) {
                    toast.warning('Instagram handle must be at least 3 characters.');
                } else {
                const { error: handleError } = await (supabase as any)
                    .from('profiles')
                    .update({
                        instagram_handle: normalizedHandle,
                        username: normalizedHandle,
                    })
                    .eq('id', session.user.id);

                if (handleError) {
                    console.error('[handleSaveProfile] Instagram handle update failed:', {
                        message: handleError.message,
                        code: handleError.code,
                        details: handleError.details,
                        hint: handleError.hint,
                    });
                    // Show specific error for handle (unique constraint, RLS, etc.)
                    const msg = handleError.code === '23505'
                        ? 'That Instagram handle is already taken by another account.'
                        : `Could not update handle: ${handleError.message}`;
                    toast.warning(msg);
                    // Don't rethrow — core save succeeded, only handle failed
                }
                }
            }

            toast.success('Profile saved!');
            triggerHaptic(HapticPatterns.success);
            setProfileSaveState('saved');
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(APP_PROFILE_DRAFT_STORAGE_KEY);
            }
            window.setTimeout(() => setProfileSaveState('idle'), 1800);
            // Refetch the global profile so all UI sections update immediately
            refetchProfile();
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('[handleSaveProfile] Unexpected error:', error);
            toast.error(error?.message || 'Failed to save profile');
            triggerHaptic(HapticPatterns.error);
            setProfileSaveState('idle');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCopyStorefront = async () => {
        try {
            await navigator.clipboard.writeText(storefrontUrl);
            toast.success("Link copied to clipboard!");
            triggerHaptic(HapticPatterns.success);
            setIsCollabLinkCopied(true);
            window.setTimeout(() => setIsCollabLinkCopied(false), 1800);
        } catch (e) {
            toast.error("Failed to copy link");
        }
    };

    const handleShareWhatsApp = () => {
        const text = encodeURIComponent(`Hi! For collaboration proposals, please submit here:\n${storefrontFullUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
        triggerHaptic();
    };

    const handleCopyDMReply = async () => {
        try {
            const template = `Thanks for reaching out!\n\nFor collaboration proposals please submit your campaign here:\ncreatorarmour.com/${username}`;
            await navigator.clipboard.writeText(template);
            toast.success("DM template copied!");
            triggerHaptic(HapticPatterns.success);
        } catch (e) {
            toast.error("Failed to copy template");
        }
    };

    const handleShareStorefront = async () => {
        try {
            const shareData = {
                title: 'Creator Armour Link',
                text: 'Check out my official creator link!',
                url: `https://creatorarmour.com/${username}`
            };
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                triggerHaptic(HapticPatterns.success);
            } else {
                await handleCopyStorefront();
            }
        } catch (e) {
            console.error("Share failed", e);
        }
    };

    const handleSendCreatorOTP = async () => {
        if (!selectedItem?.id || !session?.access_token) {
            toast.error('Session or deal data missing');
            return;
        }

        setIsSendingCreatorOTP(true);
        try {
            const apiBaseUrl = getApiBaseUrl();
            const resp = await fetch(`${apiBaseUrl}/api/otp/send-creator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ dealId: selectedItem.id }),
            });

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${resp.status}`);
            }

            const data = await resp.json();
            if (data.success) {
                toast.success('OTP sent to your email');
                setCreatorSigningStep('verify');
            } else {
                toast.error(data.error || 'Failed to send OTP');
            }
        } catch (error: any) {
            console.error('[MobileDashboard] OTP send error:', error);
            toast.error(error.message || 'Failed to send OTP');
        } finally {
            setIsSendingCreatorOTP(false);
        }
    };

    const handleVerifyCreatorOTP = async () => {
        if (!selectedItem?.id || !session?.access_token || !creatorOTP) return;

        setIsVerifyingCreatorOTP(true);
        try {
            const apiBaseUrl = getApiBaseUrl();
            const resp = await fetch(`${apiBaseUrl}/api/otp/verify-creator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ dealId: selectedItem.id, otp: creatorOTP }),
            });

            const data = await resp.json();
            if (data.success || (data.error && data.error.includes('already been verified'))) {
                if (data.success) toast.success('OTP verified!');
                await handleSignAsCreator();
            } else {
                toast.error(data.error || 'Invalid OTP');
            }
        } catch (error: any) {
            console.error('[MobileDashboard] OTP verify error:', error);
            toast.error(error.message || 'Failed to verify OTP');
        } finally {
            setIsVerifyingCreatorOTP(false);
        }
    };

    const handleSignAsCreator = async () => {
        if (!selectedItem?.id || !session?.access_token) return;

        setIsSigningAsCreator(true);
        try {
            const apiBaseUrl = getApiBaseUrl();
            const resp = await fetch(`${apiBaseUrl}/api/deals/${selectedItem.id}/sign-creator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    signerName: profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Creator',
                    signerEmail: user?.email || profile?.email || '',
                    contractSnapshotHtml: `Contract URL: ${selectedItem.contract_file_url}\nSigned at: ${new Date().toISOString()}`,
                }),
            });

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => ({ error: `Server error: ${resp.status}` }));
                throw new Error(errorData.error || 'Failed to sign contract');
            }

            const data = await resp.json();
            if (data.success) {
                toast.success('Contract signed successfully!');
                triggerHaptic(HapticPatterns.success);
                setShowCreatorSigningModal(false);
                if (onRefresh) await onRefresh();
                setSelectedItem((prev: any) => prev ? { ...prev, status: 'signed' } : null);
            } else {
                toast.error(data.error || 'Failed to sign contract');
            }
        } catch (error: any) {
            console.error('[MobileDashboard] Signing error:', error);
            const msg = error.message || '';
            if (msg.includes('already been signed')) {
                toast.success('Contract already signed!');
                setShowCreatorSigningModal(false);
                if (onRefresh) onRefresh();
            } else {
                toast.error(msg || 'Failed to sign contract');
            }
        } finally {
            setIsSigningAsCreator(false);
        }
    };

    const openDealContractReview = async (deal: any = selectedItem) => {
        const dealId = String(deal?.id || deal?.raw?.id || '').trim();
        if (!dealId || !session?.access_token) {
            toast.error('Contract details unavailable');
            return;
        }

        const directContractUrl =
            deal?.contract_file_url ||
            deal?.signed_contract_url ||
            deal?.safe_contract_url ||
            deal?.raw?.contract_file_url ||
            deal?.raw?.signed_contract_url ||
            deal?.raw?.safe_contract_url ||
            null;

        if (directContractUrl) {
            window.open(directContractUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        try {
            const apiBaseUrl = getApiBaseUrl();
            const resp = await fetch(`${apiBaseUrl}/api/deals/${dealId}/contract-review-link`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok || !data?.viewUrl) {
                throw new Error(data?.error || 'Failed to open contract');
            }
            window.open(data.viewUrl, '_blank', 'noopener,noreferrer');
        } catch (error: any) {
            console.error('[MobileDashboard] Contract review error:', error);
            toast.error(error?.message || 'Failed to open contract');
        }
    };

    const toggleTheme = () => { triggerHaptic(); setTheme(p => p === 'dark' ? 'light' : 'dark'); };

    const handleAccept = async (req: any) => {
        if (!onAcceptRequest) return;
        triggerHaptic();
        setProcessingDeal(req.id);
        try { 
            await onAcceptRequest(req); 
            closeItemDetail();
        } catch (error) {
            console.error("Accept error:", error);
        } finally { 
            setProcessingDeal(null); 
        }
    };

    const [showMenu, setShowMenu] = useState(false);
    const [showBrandDetails, setShowBrandDetails] = useState(false);
    const [notificationsView, setNotificationsView] = useState<'inbox' | 'preferences'>('inbox');
    const [notificationsLastReadAt, setNotificationsLastReadAt] = useState<number>(() => {
        if (typeof window === 'undefined') return 0;
        return Number(window.localStorage.getItem(APP_NOTIFICATIONS_LAST_READ_STORAGE_KEY) || '0') || 0;
    });
    const [storefrontSection, setStorefrontSection] = useState<'profile' | 'packages' | 'audience' | 'proof' | 'settings' | 'analytics'>(() => {
        if (typeof window === 'undefined') return 'profile';
        return (window.localStorage.getItem(APP_STOREFRONT_SECTION_STORAGE_KEY) as 'profile' | 'packages' | 'audience' | 'proof' | 'settings' | 'analytics' | null) || 'profile';
    });
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(APP_STOREFRONT_SECTION_STORAGE_KEY, storefrontSection);
    }, [storefrontSection]);

    const handleAction = (action: string) => {
        triggerHaptic();
        if (action === 'notifications') {
            setActiveTab('profile');
            setActiveSettingsPage('notifications');
            setNotificationsView('inbox');
        }
        else if (action === 'menu') { setShowMenu(true); if (onOpenMenu) onOpenMenu(); }
        else if (action === 'view_all') setActiveTab('collabs');
    };
    const notificationInboxItems = React.useMemo(() => {
        const offerItems = collabRequests.slice(0, 8).map((req: any, index: number) => {
            const timestamp = new Date(req?.updated_at || req?.created_at || Date.now()).getTime();
            return {
                id: `notif-offer-${req?.id || index}`,
                type: 'offer' as const,
                title: `Offer from ${req?.brand_name || 'Brand'}`,
                message: `${req?.collab_type || 'Paid'} collaboration needs your review.`,
                cta: 'Review Offer',
                date: timestamp,
                isUnread: timestamp > notificationsLastReadAt,
                onClick: () => {
                    triggerHaptic();
                    setSelectedItem(req);
                    setSelectedType('offer');
                    setActiveSettingsPage(null);
                    setActiveTab('collabs');
                },
            };
        });

        const dealItems = brandDeals.slice(0, 20).map((deal: any, index: number) => {
            const ux = getCreatorDealCardUX(deal);
            let title = `${deal?.brand_name || 'Brand'} updated`;
            let message = ux.nextStep;
            let cta = 'Open Deal';

            if (ux.needsSignature) {
                title = `Sign contract for ${deal?.brand_name || 'Brand'}`;
                message = 'Contract is ready for your signature.';
                cta = 'Sign Contract';
            } else if (ux.isRevisionRequested) {
                title = `Revision requested by ${deal?.brand_name || 'Brand'}`;
                message = 'Brand asked for changes before approval.';
                cta = 'Submit Revision';
            } else if (ux.isMaking) {
                title = `Deliver content to ${deal?.brand_name || 'Brand'}`;
                message = 'Upload your draft or final content to keep this deal moving.';
                cta = 'Upload Content';
            } else if (ux.isApproved && !ux.isPaymentReleased) {
                title = `Payment pending for ${deal?.brand_name || 'Brand'}`;
                message = 'Content is approved. Confirm payout readiness.';
                cta = 'Confirm Payment';
            } else if (ux.isPaymentReleased || normalizeDealStatus(deal).includes('paid')) {
                title = `Payment received from ${deal?.brand_name || 'Brand'}`;
                message = 'Funds have been released on this collaboration.';
                cta = 'View Payment';
            } else if (normalizeDealStatus(deal).includes('completed')) {
                title = `${deal?.brand_name || 'Brand'} deal completed`;
                message = 'This collaboration is now fully closed.';
                cta = 'View Deal';
            }

            const timestamp = new Date(deal?.updated_at || deal?.created_at || Date.now()).getTime();
            const needsAttention = Boolean(ux.needsCreatorAction) || (ux.isApproved && !ux.isPaymentReleased);

            return {
                id: `notif-deal-${deal?.id || index}`,
                type: needsAttention ? 'action' as const : 'update' as const,
                title,
                message,
                cta,
                date: timestamp,
                isUnread: timestamp > notificationsLastReadAt,
                onClick: () => {
                    triggerHaptic();
                    setSelectedItem(deal);
                    setSelectedType('deal');
                    setActiveSettingsPage(null);
                    setActiveTab('collabs');
                },
            };
        });

        return [...offerItems, ...dealItems]
            .sort((a, b) => b.date - a.date)
            .slice(0, 16);
    }, [brandDeals, collabRequests, notificationsLastReadAt]);
    const unreadNotificationCount = React.useMemo(
        () => notificationInboxItems.filter((item) => item.isUnread).length,
        [notificationInboxItems]
    );
    const actionNotificationCount = React.useMemo(
        () => notificationInboxItems.filter((item) => item.type === 'offer' || item.type === 'action').length,
        [notificationInboxItems]
    );
    const collabsAttentionCount = actionRequiredTotalCount;
    const paymentsAttentionCount = React.useMemo(() => {
        return activeDealsList.filter((deal: any) => {
            const ux = getCreatorDealCardUX(deal);
            return (ux.isApproved && !ux.isPaymentReleased) || (inferCreatorRequiresPayment(deal) && !creatorUpiOnFile);
        }).length + (creatorHasPaidDealsWithoutUpi ? 1 : 0);
    }, [activeDealsList, creatorHasPaidDealsWithoutUpi, creatorUpiOnFile]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(APP_NOTIFICATIONS_LAST_READ_STORAGE_KEY, String(notificationsLastReadAt || 0));
    }, [notificationsLastReadAt]);
    useEffect(() => {
        if (activeSettingsPage !== 'notifications') return;
        const now = Date.now();
        setNotificationsLastReadAt((prev) => (prev >= now ? prev : now));
    }, [activeSettingsPage]);

    const getBrandIcon = (logo?: string, category?: string, name?: string) => {
        const fallback = (cat: string, bName?: string) => {
            const catLower = cat?.toLowerCase() || '';
            const firstLetter = bName?.trim().charAt(0).toUpperCase() || '?';

            // Premium letter-based icon
            if (bName) {
                const char = bName.trim().charAt(0).toUpperCase();
                let color = 'bg-slate-500'; // Default
                const nameLower = bName.toLowerCase();
                if (nameLower.includes('boat')) color = 'bg-gradient-to-br from-violet-600 to-indigo-700';
                else if (nameLower.includes('lenskart')) color = 'bg-gradient-to-br from-emerald-600 to-teal-700';
                else if (nameLower.includes('nykaa')) color = 'bg-gradient-to-br from-pink-600 to-rose-700';
                else if (nameLower.includes('mamaearth')) color = 'bg-gradient-to-br from-teal-600 to-cyan-700';
                else if (char >= 'A' && char <= 'E') color = 'bg-gradient-to-br from-violet-500 to-purple-600';
                else if (char >= 'F' && char <= 'J') color = 'bg-gradient-to-br from-blue-500 to-blue-600';
                else if (char >= 'K' && char <= 'O') color = 'bg-gradient-to-br from-emerald-500 to-teal-600';
                else if (char >= 'P' && char <= 'T') color = 'bg-gradient-to-br from-orange-500 to-amber-600';
                else if (char >= 'U' && char <= 'Z') color = 'bg-gradient-to-br from-pink-500 to-rose-600';

                return (
                    <div className={cn("w-full h-full flex items-center justify-center text-white font-bold text-3xl shadow-inner transition-colors duration-500 rounded-inherit", color)}>
                        {firstLetter}
                    </div>
                );
            }

            if (catLower.includes('fit') || catLower.includes('gym') || catLower.includes('sport')) return <Dumbbell className="w-5 h-5 text-slate-400" />;
            if (catLower.includes('cloth') || catLower.includes('fash') || catLower.includes('beauty') || catLower.includes('skin')) return <Shirt className="w-5 h-5 text-slate-400" />;
            return <Target className="w-5 h-5 text-slate-400" />;
        };

        const normalizeLogoUrl = (value?: string) => {
            const raw = String(value || '').trim();
            if (!raw || raw === 'null' || raw === 'undefined') return '';
            if (/^(data:|blob:)/i.test(raw)) return raw;
            if (/^https?:\/\//i.test(raw)) return raw;
            if (raw.startsWith('//')) return `https:${raw}`;
            if (/^www\./i.test(raw)) return `https://${raw}`;
            // Best-effort for common "domain/path" values.
            if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) return `https://${raw}`;
            return raw; // fallback (might be relative)
        };

        const safeLogo = normalizeLogoUrl(logo);
        if (safeLogo) {
            const isSvg = /\.svg(\?|#|$)/i.test(safeLogo);
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    {isSvg && (
                        <div className={cn("absolute inset-0 z-0", isDark ? "bg-white/90" : "bg-white")} />
                    )}
                    <img
                        src={safeLogo}
                        className="w-full h-full object-contain absolute inset-0 z-10 p-1"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    {fallback(category || '', name)}
                </div>
            );
        }
        return fallback(category || '', name);
    };

    const formatCurrency = (amt: number) => {
        if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)}L`;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
    };

    const renderSettingsPage = () => {
        const reelRate = Math.max(0, Number(profileFormData.avg_rate_reel || 0) || 0);
        const PageHeader = ({ title }: { title: string }) => (
            <div className={cn("px-6 pt-16 pb-6 flex items-center gap-4 bg-transparent")}>
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveSettingsPage(null)}
                    aria-label="Back"
                    className={cn("relative z-10 -m-2 p-4 rounded-full transition-all touch-manipulation", isDark ? "bg-[#1C1C1E] text-white" : "bg-white text-black shadow-sm")}
                >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                </motion.button>
                <h1 className={cn("text-2xl font-black tracking-tight", textColor)}>{title}</h1>
            </div>
        );

        switch (activeSettingsPage) {
            case 'personal':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.x > 50 || velocity.x > 500) {
                                triggerHaptic();
                                setActiveSettingsPage(null);
                            }
                        }}
                        className="pb-20 touch-pan-y"
                    >
                        <PageHeader title="Creator Info" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>Who You Are</p>
                                <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                    This shapes your public creator identity. Brands use it to understand your niche, profile, and fit at a glance.
                                </p>
                            </div>
                            <SectionHeader title="Personal Info" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Full Name</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} value={profileFormData.full_name || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, full_name: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Email Address</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} value={profileFormData.email || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, email: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Phone Number</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} value={profileFormData.phone || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Bio / Headline</p>
                                        <textarea
                                            className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px] resize-none h-20", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}
                                            value={profileFormData.bio || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, bio: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Address</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="House, Street, Area" value={profileFormData.address || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, address: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Pincode / City</p>
                                        <div className="flex gap-2">
                                            <input className={cn("w-24 bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Pincode" value={profileFormData.pincode || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, pincode: e.target.value }))} />
                                            <input className={cn("flex-1 bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="City" value={profileFormData.city || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, city: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>
                            <SectionHeader title="Public Creator Profile" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Instagram Handle</p>
                                        <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            <Instagram className="w-4 h-4 text-pink-500" />
                                            <input className="bg-transparent outline-none font-medium text-[16px] flex-1" value={profileFormData.instagram_handle || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, instagram_handle: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Media Kit URL</p>
                                        <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            <Link2 className="w-4 h-4 text-blue-500" />
                                            <input className="bg-transparent outline-none font-medium text-[16px] flex-1" placeholder="https://..." value={profileFormData.media_kit_url || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, media_kit_url: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>
                            <p className={cn("px-4 text-[12px] opacity-50 leading-relaxed", textColor)}>
                                Brands use this section to understand your niche, profile quality, and public-facing identity.
                            </p>
                            <div className="px-4 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className={cn("text-[11px] font-medium", secondaryTextColor)}>
                                        {profileSaveState === 'saving' ? 'Saving your changes…' : profileSaveState === 'saved' ? 'Saved just now' : 'Draft changes stay on this device until you save'}
                                    </p>
                                    {profileSaveState === 'saved' && (
                                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Save Creator Info'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'collab-preferences':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Collab Preferences" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>How You Work</p>
                                <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                    Set the rules brands should know before they send an offer, from deal type and rate expectations to collaboration availability.
                                </p>
                            </div>
                            <SectionHeader title="Availability" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow
                                    icon={<Handshake />}
                                    iconBg="bg-blue-600"
                                    label="Open for Collaborations"
                                    subtext={profileFormData.open_to_collabs !== false ? "Brands can send you deals" : "New intake is paused"}
                                    isDark={isDark}
                                    textColor={textColor}
                                    rightElement={<ToggleSwitch active={profileFormData.open_to_collabs !== false} onToggle={() => setProfileFormData((p: any) => ({ ...p, open_to_collabs: !p.open_to_collabs }))} isDark={isDark} />}
                                />
                            </SettingsGroup>

                            <SectionHeader title="Budget Expectations" isDark={isDark} />
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { key: 'starter', title: 'Starter', range: '₹2K - ₹5K', sub: 'Micro brands' },
                                    { key: 'standard', title: 'Standard', range: '₹5K - ₹15K', sub: 'Common deals' },
                                    { key: 'premium', title: 'Premium', range: '₹15K+', sub: 'Large campaigns' },
                                ].map((tier) => (
                                    <button
                                        key={tier.key}
                                        onClick={() => setProfileFormData((p: any) => ({ ...p, typical_deal_size: tier.key }))}
                                        className={cn(
                                            "p-4 rounded-2xl border text-left transition-all",
                                            profileFormData.typical_deal_size === tier.key
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : (isDark ? "bg-[#1C1C1E] border-white/5 text-white" : "bg-white border-slate-100 text-black")
                                        )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-sm">{tier.title}</p>
                                            <p className={cn("text-xs font-black", profileFormData.typical_deal_size === tier.key ? "text-white/80" : "text-blue-500")}>{tier.range}</p>
                                        </div>
                                        <p className={cn("text-[10px] uppercase tracking-wider mt-1 opacity-60")}>{tier.sub}</p>
                                    </button>
                                ))}
                            </div>

                            <SectionHeader title="Minimum Budget" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-2">
                                    <p className={cn("text-[12px] font-medium", secondaryTextColor)}>
                                        Offers below this amount are shown as lower-fit on your public collab page.
                                    </p>
                                    <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                        <span className={cn("text-[16px] font-bold", textColor)}>₹</span>
                                        <input
                                            className="bg-transparent outline-none font-medium text-[16px] flex-1"
                                            value={profileFormData.pricing_min || ''}
                                            onChange={e => setProfileFormData((p: any) => ({ ...p, pricing_min: e.target.value }))}
                                            placeholder="5000"
                                        />
                                    </div>
                                </div>
                            </SettingsGroup>

                            <SectionHeader title="Deal Type" isDark={isDark} />
                            <div className="flex gap-2">
                                {['Paid', 'Free products', 'Paid + Product'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setProfileFormData((p: any) => ({ ...p, collaboration_preference: type }))}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all",
                                            (profileFormData.collaboration_preference || 'Hybrid').toLowerCase() === type.toLowerCase()
                                                ? "bg-slate-900 border-slate-900 text-white"
                                                : (isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-500")
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <SectionHeader title="Default Positioning" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Avg. Rate per Reel</p>
                                        <div className="flex items-center gap-2 border-b py-1" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            <span className={cn("text-[16px] font-bold", textColor)}>₹</span>
                                            <input className="bg-transparent outline-none font-medium text-[16px] flex-1" value={profileFormData.avg_rate_reel || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, avg_rate_reel: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Content Niches</p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {(profileFormData.content_niches || ['Fashion', 'Tech', 'Lifestyle']).map((niche: string) => (
                                                <div key={niche} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border", isDark ? "bg-white/5 border-white/10 text-white" : "bg-blue-50 border-blue-100 text-blue-600")}>
                                                    {niche}
                                                </div>
                                            ))}
                                            <button className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-dashed", isDark ? "border-white/20 text-white/40" : "border-black/10 text-black/40")}>
                                                + ADD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>
                            <p className={cn("px-4 text-[12px] opacity-50 leading-relaxed", textColor)}>
                                These defaults help brands understand your usual collaboration style before they create a custom offer.
                            </p>

                            <div className="px-4 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className={cn("text-[11px] font-medium", secondaryTextColor)}>
                                        {profileSaveState === 'saving' ? 'Saving your changes…' : profileSaveState === 'saved' ? 'Saved just now' : 'Draft changes stay on this device until you save'}
                                    </p>
                                    {profileSaveState === 'saved' && (
                                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Update Preferences'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'packages':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Packages" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>What You Sell</p>
                                <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                    These are the collaboration products brands can buy directly. You can edit price here, while your reel-rate anchor remains <span className="font-black">₹{(reelRate || 0).toLocaleString()}</span>.
                                </p>
                            </div>

                            <SectionHeader title="Direct Booking Packages" isDark={isDark} />
                            <div className="grid grid-cols-1 gap-3">
                                {packageTemplates.map((pkg, index) => (
                                    <div
                                        key={pkg.id}
                                        className={cn(
                                            "p-5 rounded-[2rem] border relative overflow-hidden",
                                            pkg.is_default
                                                ? (isDark ? "bg-blue-500/10 border-blue-500/25" : "bg-blue-50 border-blue-200")
                                                : (isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")
                                        )}
                                    >
                                        {pkg.is_default && (
                                            <span className="absolute top-4 right-4 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white">
                                                Most Popular
                                            </span>
                                        )}
                                        <div className="space-y-4">
                                            <div>
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-1", textColor)}>Package Name</p>
                                                <input
                                                    className={cn("w-full bg-transparent border-b py-2 outline-none font-bold text-[18px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}
                                                    value={pkg.name || ''}
                                                    onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))}
                                                />
                                            </div>
                                            <div>
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-1", textColor)}>Description</p>
                                                <textarea
                                                    className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[64px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}
                                                    value={pkg.description || ''}
                                                    onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-1", textColor)}>Price</p>
                                                    <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                                        <span className={cn("text-[16px] font-bold", textColor)}>₹</span>
                                                        <input
                                                            className="bg-transparent outline-none font-bold text-[16px] flex-1"
                                                            value={pkg.rate || ''}
                                                            onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, rate: Number(e.target.value || 0) } : item))}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-1", textColor)}>Turnaround</p>
                                                    <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                                        <input
                                                            className="bg-transparent outline-none font-bold text-[16px] flex-1"
                                                            value={pkg.turnaround_days || ''}
                                                            onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, turnaround_days: Number(e.target.value || 0) } : item))}
                                                        />
                                                        <span className={cn("text-[12px] font-bold opacity-50", textColor)}>days</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-1", textColor)}>Deliverables</p>
                                                    <input
                                                        className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}
                                                        value={(pkg.deliverables || []).join(', ')}
                                                        onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, deliverables: e.target.value.split(',').map((part) => part.trim()).filter(Boolean) } : item))}
                                                        placeholder="Reel, Story"
                                                    />
                                                </div>
                                                <div>
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-1", textColor)}>Revisions</p>
                                                    <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                                        <input
                                                            className="bg-transparent outline-none font-bold text-[16px] flex-1"
                                                            value={pkg.revision_count || ''}
                                                            onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, revision_count: Number(e.target.value || 0) } : item))}
                                                        />
                                                        <span className={cn("text-[12px] font-bold opacity-50", textColor)}>rev</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-1", textColor)}>Terms</p>
                                                <textarea
                                                    className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}
                                                    value={pkg.terms || ''}
                                                    onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, terms: e.target.value } : item))}
                                                    placeholder="Includes 1 revision, brand tag required..."
                                                />
                                            </div>
                                            <div>
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>Add-ons</p>
                                                <div className="space-y-2">
                                                    {(pkg.addons || []).map((addon, addonIndex) => (
                                                        <div key={addon.id} className="flex items-center gap-2">
                                                            <input
                                                                className={cn("flex-1 bg-transparent border-b py-2 outline-none font-medium text-[14px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}
                                                                placeholder="Extra Story"
                                                                value={addon.label || ''}
                                                                onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? {
                                                                    ...item,
                                                                    addons: (item.addons || []).map((currentAddon, currentIndex) => currentIndex === addonIndex ? { ...currentAddon, label: e.target.value } : currentAddon)
                                                                } : item))}
                                                            />
                                                            <div className="flex items-center gap-2 w-28 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                                                <span className={cn("text-[14px] font-bold", textColor)}>₹</span>
                                                                <input
                                                                    className="bg-transparent outline-none font-medium text-[14px] flex-1"
                                                                    placeholder="500"
                                                                    value={addon.price || ''}
                                                                    onChange={(e) => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? {
                                                                        ...item,
                                                                        addons: (item.addons || []).map((currentAddon, currentIndex) => currentIndex === addonIndex ? { ...currentAddon, price: Number(e.target.value || 0) } : currentAddon)
                                                                    } : item))}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? {
                                                                    ...item,
                                                                    addons: (item.addons || []).filter((_, currentIndex) => currentIndex !== addonIndex)
                                                                } : item))}
                                                                className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-red-300" : "text-red-500")}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPackageTemplates((prev) => prev.map((item, itemIndex) => itemIndex === index ? {
                                                            ...item,
                                                            addons: [...(item.addons || []), { id: `addon_${Date.now()}_${itemIndex}`, label: '', price: 0 }]
                                                        } : item))}
                                                        className={cn("w-full py-3 rounded-2xl border border-dashed text-[11px] font-black uppercase tracking-widest transition-all", isDark ? "border-white/15 text-white/70 bg-white/5" : "border-slate-300 text-slate-600 bg-slate-50")}
                                                    >
                                                        + Add Add-on
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPackageTemplates((prev) => prev.map((item, itemIndex) => ({ ...item, is_default: itemIndex === index })))}
                                                className={cn(
                                                    'w-full py-3 rounded-2xl border text-[12px] font-black uppercase tracking-widest transition-all',
                                                    pkg.is_default
                                                        ? (isDark ? 'bg-blue-500/15 border-blue-400/30 text-blue-200' : 'bg-blue-600 border-blue-600 text-white')
                                                        : (isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-700')
                                                )}
                                            >
                                                {pkg.is_default ? 'Most Popular Package' : 'Mark as Most Popular'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className={cn("px-4 text-[12px] opacity-50 leading-relaxed", textColor)}>
                                Use clear package names, pricing, deliverables, turnaround, revisions, and terms so a brand can decide quickly.
                            </p>
                            <div className="px-4 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className={cn("text-[11px] font-medium", secondaryTextColor)}>
                                        {profileSaveState === 'saving' ? 'Saving your changes…' : profileSaveState === 'saved' ? 'Saved just now' : 'Draft changes stay on this device until you save'}
                                    </p>
                                    {profileSaveState === 'saved' && (
                                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Save Packages'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'payouts':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Payout Methods" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>How You Get Paid</p>
                                <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                    Add payout details so approved deals can move faster and brands know where to release collaboration payments.
                                </p>
                            </div>
                            <SectionHeader title="Primary Payout Details" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Account holder name</p>
                                        <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            <Landmark className="w-4 h-4 text-blue-500" />
                                            <input
                                                className="bg-transparent outline-none font-medium text-[16px] flex-1"
                                                placeholder="Your payout name"
                                                value={profileFormData.bank_account_name || ''}
                                                onChange={(e) => setProfileFormData((p: any) => ({ ...p, bank_account_name: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>UPI ID</p>
                                            <span className="text-[10px] font-black text-emerald-500">PRIMARY</span>
                                        </div>
                                        <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            <Smartphone className="w-4 h-4 text-emerald-500" />
                                            <input
                                                className="bg-transparent outline-none font-medium text-[16px] flex-1"
                                                placeholder="yourname@upi"
                                                value={profileFormData.bank_upi || ''}
                                                onChange={(e) => setProfileFormData((p: any) => ({ ...p, bank_upi: e.target.value }))}
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                            />
                                        </div>
                                        <p className={cn("text-[12px] font-medium", secondaryTextColor)}>
                                            Brands use this UPI ID when releasing collaboration payments.
                                        </p>
                                    </div>
                                </div>
                            </SettingsGroup>
                            <p className={cn("px-4 text-[12px] opacity-50 leading-relaxed", textColor)}>
                                This is where collaboration money goes. Keep it updated so approved deals can be paid without delays.
                            </p>
                            <div className="px-4 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className={cn("text-[11px] font-medium", secondaryTextColor)}>
                                        {profileSaveState === 'saving' ? 'Saving your changes…' : profileSaveState === 'saved' ? 'Saved just now' : 'Draft changes stay on this device until you save'}
                                    </p>
                                    {profileSaveState === 'saved' && (
                                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Save Payout Details'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'verification':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Armour Verification" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-8 rounded-[2.5rem] relative overflow-hidden", isDark ? "bg-[#1C1C1E] border border-[#2C2C2E]" : "bg-white border-[#E5E5EA] shadow-sm")}>
                                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                                    <ShieldCheck className="w-9 h-9 text-white" />
                                </div>
                                <h3 className={cn("text-2xl font-black tracking-tight mb-2", textColor)}>Verified Creator</h3>
                                <p className={cn("text-sm opacity-50 leading-relaxed mb-6", textColor)}>This is your trust layer. Brands see your verified status and can book with more confidence.</p>
                                <div className="flex flex-col gap-2">
                                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", isDark ? "bg-white/5" : "bg-slate-50")}>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span className={cn("text-xs font-bold", textColor)}>Identity Secured</span>
                                    </div>
                                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", isDark ? "bg-white/5" : "bg-slate-50")}>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span className={cn("text-xs font-bold", textColor)}>Instagram Authenticated</span>
                                    </div>
                                </div>
                                <ShieldCheck className="absolute -right-10 -bottom-10 w-48 h-48 opacity-[0.03] text-blue-500" />
                            </div>
                            <p className={cn("px-4 text-[12px] opacity-50 leading-relaxed", textColor)}>
                                Verification improves trust, reduces friction, and helps brands feel confident about proceeding.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'earnings':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Earnings & History" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>What You Earned</p>
                                <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                    Track your collaboration income, payout history, and overall revenue performance in one place.
                                </p>
                            </div>
                            <div className={cn("p-6 rounded-[2.5rem] bg-slate-900 border border-white/10 text-white")}>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50 mb-4">Total Revenue Generated</p>
                                <div className="text-4xl font-black font-outfit mb-6">₹{allTimeRevenue.toLocaleString()}</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-bold opacity-40 mb-1">THIS YEAR</p>
                                        <p className="text-lg font-bold">₹{yearlyRevenue.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-bold opacity-40 mb-1">LAST MONTH</p>
                                        <p className="text-lg font-bold text-emerald-400">₹{monthlyRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <SectionHeader title="Financial Reports" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow icon={<FileText />} iconBg="bg-blue-500" label="Invoices" subtext="Download monthly summaries" isDark={isDark} textColor={textColor} hasChevron />
                                <SettingsRow icon={<Download />} iconBg="bg-emerald-500" label="Payout Statements" subtext="Detailed breakdown of fees" isDark={isDark} textColor={textColor} hasChevron />
                            </SettingsGroup>
                        </div>
                    </motion.div>
                );
            case 'collab-link': {
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-32 touch-pan-y">
                        <PageHeader title="Your Collab Page" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>Configure Store</p>
                                <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                    This is your creator storefront. Keep it focused on what brands can buy, why they can trust you, and how they should proceed.
                                </p>
                            </div>
                            <div className={cn("rounded-[1.75rem] border p-2", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'profile', label: 'Profile' },
                                        { key: 'packages', label: 'Packages' },
                                        { key: 'audience', label: 'Audience' },
                                        { key: 'proof', label: 'Proof' },
                                        { key: 'settings', label: 'Page Settings' },
                                        { key: 'analytics', label: 'Performance' },
                                    ].map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setStorefrontSection(item.key as any)}
                                            className={cn(
                                                "rounded-2xl px-3 py-3 text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98]",
                                                storefrontSection === item.key
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                    : (isDark ? "text-white/65 bg-white/5" : "text-slate-600 bg-slate-50")
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {storefrontSection === 'profile' && (
                                <>
                                    <SectionHeader title="Profile" isDark={isDark} />
                                    <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40 mb-2", textColor)}>Store Header</p>
                                        <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                            Edit the first impression brands get when they open your storefront. Keep this section short, clear, and trust-building.
                                        </p>
                                    </div>
                                    <SettingsGroup isDark={isDark}>
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Public Category</p>
                                                <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Lifestyle creator" value={profileFormData.creator_category || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, creator_category: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Public Intro</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[64px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Write the short positioning line brands should see first." value={profileFormData.collab_intro_line || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_intro_line: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Tagline</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Example: Beauty creator for metro millennial women." value={profileFormData.collab_cta_platform_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_cta_platform_note: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Audience Region</p>
                                                <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="NCR (Delhi Region)" value={profileFormData.collab_region_label || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_region_label: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Audience Fit Text</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Works best for targeted audience campaigns." value={profileFormData.collab_audience_fit_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_audience_fit_note: e.target.value }))} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Response Time</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="3" value={profileFormData.collab_response_hours_override || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_response_hours_override: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Completed Collabs</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="12" value={profileFormData.collab_brands_count_override || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_brands_count_override: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Average Views</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="12000" value={profileFormData.avg_reel_views_manual || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, avg_reel_views_manual: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Reliability %</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="98%" value={profileFormData.collab_engagement_confidence_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_engagement_confidence_note: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Media Kit Link</p>
                                                <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="https://..." value={profileFormData.media_kit_url || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, media_kit_url: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Portfolio Link</p>
                                                <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="https://portfolio..." value={profileFormData.collab_cta_dm_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_cta_dm_note: e.target.value }))} />
                                            </div>
                                        </div>
                                    </SettingsGroup>
                                </>
                            )}

                            {storefrontSection === 'packages' && (
                                <>
                                    <SectionHeader title="Packages" isDark={isDark} />
                                    <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40 mb-2", textColor)}>Services</p>
                                        <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                            Keep package editing separate from audience and proof. Brands should understand what they can buy in seconds.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        {packageTemplates.slice(0, 4).map((pkg, index) => (
                                            <div key={pkg.id || index} className={cn("p-4 rounded-[1.75rem] border flex items-center justify-between gap-4", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                                <div className="min-w-0">
                                                    <p className={cn("text-[15px] font-black tracking-tight", textColor)}>{pkg.name || `Package ${index + 1}`}</p>
                                                    <p className={cn("text-[12px] mt-1", secondaryTextColor)}>{Array.isArray(pkg.deliverables) && pkg.deliverables.length > 0 ? pkg.deliverables.join(' + ') : 'Deliverables not set'}</p>
                                                    <p className={cn("text-[11px] mt-1 font-semibold", secondaryTextColor)}>{Number(pkg.turnaround_days || 0) > 0 ? `${pkg.turnaround_days} days` : 'Turnaround not set'}</p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className={cn("text-[18px] font-black font-outfit", textColor)}>₹{Number(pkg.rate || 0).toLocaleString('en-IN')}</p>
                                                    <button type="button" onClick={() => setActiveSettingsPage('packages')} className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Edit</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {storefrontSection === 'audience' && (
                                <>
                                    <SectionHeader title="Audience" isDark={isDark} />
                                    <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40 mb-2", textColor)}>Audience Snapshot</p>
                                        <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                            Fill this manually for now. This tab should answer who you reach, where they are, and why the audience is relevant.
                                        </p>
                                    </div>
                                    <SettingsGroup isDark={isDark}>
                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Followers</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="10200" value={profileFormData.instagram_followers || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, instagram_followers: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Avg Views</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="12000" value={profileFormData.avg_reel_views_manual || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, avg_reel_views_manual: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Engagement Rate</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="7.5%" value={profileFormData.collab_engagement_confidence_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_engagement_confidence_note: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Age Range</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="18-24" value={profileFormData.audience_age_range || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, audience_age_range: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Top Cities</p>
                                                <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Delhi, Noida, Gurgaon" value={profileFormData.top_cities || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, top_cities: e.target.value }))} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Gender Split</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="70 women" value={profileFormData.audience_gender_split || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, audience_gender_split: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Languages</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Hindi, English" value={profileFormData.primary_audience_language || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, primary_audience_language: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Audience Description</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="High-intent metro audience for lifestyle and beauty campaigns." value={profileFormData.collab_audience_relevance_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_audience_relevance_note: e.target.value }))} />
                                            </div>
                                        </div>
                                    </SettingsGroup>
                                </>
                            )}

                            {storefrontSection === 'proof' && (
                                <>
                                    <SectionHeader title="Proof" isDark={isDark} />
                                    <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40 mb-2", textColor)}>Trust Layer</p>
                                        <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                            Use proof to reduce doubt. Add delivery reliability, response behavior, niches, and past campaigns brands can evaluate quickly.
                                        </p>
                                    </div>
                                    <SettingsGroup isDark={isDark}>
                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Completed Collabs</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="12" value={profileFormData.collab_brands_count_override || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_brands_count_override: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Response Hours</p>
                                                    <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="3" value={profileFormData.collab_response_hours_override || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_response_hours_override: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Reliability / Delivery Note</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Reliable delivery across past collaborations." value={profileFormData.collab_delivery_reliability_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_delivery_reliability_note: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Response Behavior</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Most brands receive a response within the same day." value={profileFormData.collab_response_behavior_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_response_behavior_note: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Trust CTA Text</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Creator notified instantly — no DM required." value={profileFormData.collab_cta_trust_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_cta_trust_note: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Public Niches</p>
                                                <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Lifestyle, Beauty, Food" value={Array.isArray(profileFormData.content_niches) ? profileFormData.content_niches.join(', ') : ''} onChange={e => setProfileFormData((p: any) => ({ ...p, content_niches: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
                                            </div>
                                        </div>
                                    </SettingsGroup>
                                    <SettingsGroup isDark={isDark}>
                                        <div className="p-4 space-y-4">
                                            <p className={cn("text-[12px] font-medium", secondaryTextColor)}>Past collaborations and case-study proof cards.</p>
                                            {(Array.isArray(profileFormData.collab_past_work_items) ? profileFormData.collab_past_work_items : []).map((item: any, index: number) => (
                                                <div key={item.id || index} className={cn("p-4 rounded-[1.5rem] border space-y-3", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80")}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40", textColor)}>Proof Card {index + 1}</p>
                                                        <button type="button" onClick={() => setProfileFormData((p: any) => ({ ...p, collab_past_work_items: (p.collab_past_work_items || []).filter((_: any, itemIndex: number) => itemIndex !== index) }))} className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-red-300" : "text-red-500")}>Remove</button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[15px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Brand name" value={item.brand || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_past_work_items: (p.collab_past_work_items || []).map((current: any, currentIndex: number) => currentIndex === index ? { ...current, brand: e.target.value } : current) }))} />
                                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[15px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Campaign type" value={item.campaignType || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_past_work_items: (p.collab_past_work_items || []).map((current: any, currentIndex: number) => currentIndex === index ? { ...current, campaignType: e.target.value } : current) }))} />
                                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[15px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Proof label" value={item.proofLabel || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_past_work_items: (p.collab_past_work_items || []).map((current: any, currentIndex: number) => currentIndex === index ? { ...current, proofLabel: e.target.value } : current) }))} />
                                                        <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[64px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Outcome or result brands should notice" value={item.outcome || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_past_work_items: (p.collab_past_work_items || []).map((current: any, currentIndex: number) => currentIndex === index ? { ...current, outcome: e.target.value } : current) }))} />
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => setProfileFormData((p: any) => ({ ...p, collab_past_work_items: [...(p.collab_past_work_items || []), { id: `past-work-${Date.now()}`, brand: '', campaignType: '', outcome: '', proofLabel: '' }] }))} className={cn("w-full py-3 rounded-2xl border border-dashed text-[11px] font-black uppercase tracking-widest transition-all", isDark ? "border-white/15 text-white/70 bg-white/5" : "border-slate-300 text-slate-600 bg-slate-50")}>+ Add Proof Card</button>
                                        </div>
                                    </SettingsGroup>
                                </>
                            )}

                            {storefrontSection === 'settings' && (
                                <>
                                    <SectionHeader title="Page Settings" isDark={isDark} />
                                    <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40 mb-2", textColor)}>Display</p>
                                        <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                            This tab controls storefront visibility and buying behavior. Keep it limited to toggles, CTA copy, budget rules, and your public link.
                                        </p>
                                    </div>
                                    <SettingsGroup isDark={isDark}>
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Minimum Budget</p>
                                                <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="5000" value={profileFormData.pricing_min || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, pricing_min: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Primary CTA Text</p>
                                                <textarea className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[14px] resize-none min-h-[56px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Send campaign details to get a package or custom quote." value={profileFormData.collab_cta_trust_note || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, collab_cta_trust_note: e.target.value }))} />
                                            </div>
                                            {[
                                                { key: 'packages', label: 'Show Packages', subtext: 'Display direct booking packages first' },
                                                { key: 'trust', label: 'Show Trust Section', subtext: 'Display trust and proof blocks' },
                                                { key: 'audience', label: 'Show Audience Snapshot', subtext: 'Display audience fit and audience data' },
                                                { key: 'pastWork', label: 'Show Past Work', subtext: 'Display case studies and collaborations' },
                                            ].map((item) => (
                                                <SettingsRow key={item.key} icon={<Eye />} iconBg="bg-slate-500" label={item.label} subtext={item.subtext} isDark={isDark} textColor={textColor} rightElement={<ToggleSwitch active={item.key === 'packages' ? profileFormData.collab_show_packages !== false : item.key === 'trust' ? profileFormData.collab_show_trust_signals !== false : item.key === 'audience' ? profileFormData.collab_show_audience_snapshot !== false : profileFormData.collab_show_past_work !== false} onToggle={() => setProfileFormData((p: any) => ({ ...p, [item.key === 'packages' ? 'collab_show_packages' : item.key === 'trust' ? 'collab_show_trust_signals' : item.key === 'audience' ? 'collab_show_audience_snapshot' : 'collab_show_past_work']: !(item.key === 'packages' ? p.collab_show_packages !== false : item.key === 'trust' ? p.collab_show_trust_signals !== false : item.key === 'audience' ? p.collab_show_audience_snapshot !== false : p.collab_show_past_work !== false) }))} isDark={isDark} />} />
                                            ))}
                                        </div>
                                    </SettingsGroup>
                                    <div className={cn("p-5 rounded-[2rem] border space-y-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40", textColor)}>Collab Link</p>
                                                <p className={cn("text-[15px] font-bold mt-1", textColor)}>creatorarmour.com/{username}</p>
                                            </div>
                                            <button onClick={() => { const link = `${window.location.origin}/${username}`; navigator.clipboard.writeText(link); toast.success('Link copied'); triggerHaptic(); }} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Copy Link</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {storefrontSection === 'analytics' && (
                                <>
                                    <SectionHeader title="Performance" isDark={isDark} />
                                    <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40 mb-2", textColor)}>Performance</p>
                                        <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                            Analytics stays separate from editing. Use it to track how the storefront performs without turning the editor into an analytics page.
                                        </p>
                                    </div>
                                    <div className={cn("p-5 rounded-[2rem] border space-y-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}>
                                        {isLoadingCollabAnalytics ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {[0, 1, 2].map((item) => (
                                                    <div key={item} className={cn("rounded-xl border px-3 py-3", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                                        <div className="skeleton h-3 w-12 rounded-full" />
                                                        <div className="skeleton mt-3 h-5 w-14 rounded-lg" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className={cn("rounded-xl border px-3 py-3", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", textColor)}>Views</p>
                                                    <p className={cn("text-[16px] font-black mt-1", textColor)}>{collabViews}</p>
                                                </div>
                                                <div className={cn("rounded-xl border px-3 py-3", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", textColor)}>Offers</p>
                                                    <p className={cn("text-[16px] font-black mt-1", textColor)}>{collabRequestCount}</p>
                                                </div>
                                                <div className={cn("rounded-xl border px-3 py-3", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", textColor)}>Conversion</p>
                                                    <p className={cn("text-[16px] font-black mt-1", textColor)}>{collabConversion.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        )}
                                        <p className={cn("text-[12px] font-medium leading-relaxed", secondaryTextColor)}>
                                            Analytics stays separate from editing so the storefront editor stays focused and lighter.
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="px-4 pt-2">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className={cn("text-[11px] font-medium", secondaryTextColor)}>
                                        {profileSaveState === 'saving' ? 'Saving your changes…' : profileSaveState === 'saved' ? 'Saved just now' : 'Draft changes stay on this device until you save'}
                                    </p>
                                    {profileSaveState === 'saved' && (
                                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Save Collab Page'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            }
            case 'dark-mode':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Appearance" />
                        <div className="px-4 space-y-6">
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow
                                    icon={isDark ? <Sun /> : <Moon />} iconBg="bg-slate-500"
                                    label="Dark Mode"
                                    subtext={isDark ? "Always On" : "Off"}
                                    isDark={isDark} textColor={textColor}
                                    rightElement={<ToggleSwitch active={isDark} onToggle={toggleTheme} isDark={isDark} />}
                                />
                            </SettingsGroup>
                            <p className={cn("px-4 text-[13px] opacity-40 leading-relaxed", textColor)}>Choose how Creator Armour looks on your device.</p>
                        </div>
                    </motion.div>
                );
            case 'notifications':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Notifications" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-5 rounded-[2rem] border", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40 mb-2", textColor)}>Notification Center</p>
                                        <p className={cn("text-[14px] font-semibold leading-relaxed", textColor)}>
                                            Track new offers, contract actions, approvals, and payout updates without leaving the app.
                                        </p>
                                    </div>
                                    <div className={cn("rounded-2xl px-3 py-2 text-right border shrink-0", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-45", textColor)}>Unread</p>
                                        <p className={cn("text-[18px] font-black mt-1", textColor)}>{unreadNotificationCount}</p>
                                    </div>
                                </div>
                                <div className={cn("mt-4 flex p-1 rounded-2xl", isDark ? "bg-white/5" : "bg-slate-100")}>
                                    {[
                                        { key: 'inbox', label: `Inbox ${actionNotificationCount > 0 ? `(${actionNotificationCount})` : ''}` },
                                        { key: 'preferences', label: 'Preferences' },
                                    ].map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic();
                                                setNotificationsView(item.key as 'inbox' | 'preferences');
                                            }}
                                            className={cn(
                                                "flex-1 rounded-xl py-3 text-[11px] font-black uppercase tracking-widest transition-all",
                                                notificationsView === item.key
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                    : cn("opacity-65", textColor)
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {notificationsView === 'inbox' ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <SectionHeader title="Inbox" isDark={isDark} />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic();
                                                setNotificationsLastReadAt(Date.now());
                                                toast.success('All notifications marked as read');
                                            }}
                                            className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-blue-300" : "text-blue-600")}
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {notificationInboxItems.length > 0 ? notificationInboxItems.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={item.onClick}
                                                className={cn(
                                                    "w-full rounded-[1.6rem] border p-4 text-left transition-all active:scale-[0.99]",
                                                    isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={cn(
                                                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                                        item.type === 'offer'
                                                            ? "bg-blue-500/15 text-blue-500"
                                                            : item.type === 'action'
                                                                ? "bg-amber-500/15 text-amber-500"
                                                                : "bg-emerald-500/15 text-emerald-500"
                                                    )}>
                                                        {item.type === 'offer' ? <Mail className="h-4 w-4" /> : item.type === 'action' ? <Bell className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className={cn("text-[13px] font-bold leading-snug", textColor)}>{item.title}</p>
                                                            {item.isUnread && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />}
                                                        </div>
                                                        <p className={cn("mt-1 text-[12px] leading-relaxed", secondaryTextColor)}>{item.message}</p>
                                                        <div className="mt-3 flex items-center justify-between gap-3">
                                                            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-45", textColor)}>
                                                                {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-white/5 text-white/80" : "bg-slate-100 text-slate-700")}>
                                                                {item.cta}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )) : (
                                            <div className={cn("rounded-[1.6rem] border p-6 text-center", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                                <Bell className={cn("mx-auto h-8 w-8 opacity-25", textColor)} />
                                                <p className={cn("mt-3 text-[13px] font-semibold", textColor)}>No notifications yet</p>
                                                <p className={cn("mt-1 text-[12px]", secondaryTextColor)}>New offers and deal updates will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <SectionHeader title="Deal Alerts" isDark={isDark} />
                                    <SettingsGroup isDark={isDark}>
                                        <SettingsRow
                                            icon={<Bell />} iconBg="bg-blue-500"
                                            label="Push Notifications"
                                            subtext={isPushSubscribed ? "Active on this device" : "Receive instant deal alerts"}
                                            isDark={isDark} textColor={textColor}
                                            rightElement={
                                                <ToggleSwitch
                                                    active={isPushSubscribed}
                                                    onToggle={async () => {
                                                        triggerHaptic();
                                                        if (isPushSubscribed) {
                                                            toast.info("To disable, please use your browser settings.");
                                                        } else {
                                                            if (!isPushSupported) {
                                                                toast.error("Push notifications aren't supported on this browser.");
                                                                return;
                                                            }
                                                            if (!hasVapidKey) {
                                                                toast.error("Notifications aren't configured yet.");
                                                                return;
                                                            }
                                                            if (pushPermission === 'denied') {
                                                                toast.error("Notifications are blocked. Enable them in browser settings.");
                                                                return;
                                                            }
                                                            if (isIOSNeedsInstall) {
                                                                setShowPushInstallGuide(true);
                                                                return;
                                                            }

                                                            const res = await enableNotifications();
                                                            if (res.success) {
                                                                toast.success("Push notifications enabled!");
                                                            } else {
                                                                const reason = String(res.reason || '');
                                                                const r = reason.toLowerCase();
                                                                if (r === 'default') toast.error("Permission not granted.");
                                                                else if (r === 'denied') toast.error("Permission denied in browser settings.");
                                                                else if (r.includes('missing_vapid_key')) toast.error("Notifications aren't configured yet.");
                                                                else toast.error("Failed to enable push alerts.", { description: reason || undefined });
                                                            }
                                                        }
                                                    }}
                                                    isDark={isDark}
                                                />
                                            }
                                        />
                                        {isPushSubscribed && (
                                            <button
                                                onClick={async () => {
                                                    triggerHaptic();
                                                    const res = await sendTestPush();
                                                    if (res.success) toast.success("Test notification sent!");
                                                    else toast.error("Test push failed.", { description: res.reason || 'Unknown reason' });
                                                }}
                                                className={cn("w-full py-3 text-[11px] font-black uppercase tracking-wider text-blue-500 text-center", isPushBusy && "opacity-50")}
                                                disabled={isPushBusy}
                                            >
                                                {isPushBusy ? "Sending..." : "Send Test Notification"}
                                            </button>
                                        )}
                                    </SettingsGroup>
                                    <div className={cn("p-4 rounded-2xl border flex items-start justify-between gap-3", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                        <div className="min-w-0">
                                            <p className={cn("text-[12px] font-black uppercase tracking-widest opacity-60", textColor)}>Status</p>
                                            <p className={cn("text-[12px] mt-1 opacity-70", textColor)}>
                                                Supported: <span className={cn("font-semibold", textColor)}>{isPushSupported ? 'Yes' : 'No'}</span>
                                                {'  '}• Permission: <span className={cn("font-semibold", textColor)}>{pushPermission}</span>
                                                {'  '}• Subscribed: <span className={cn("font-semibold", textColor)}>{isPushSubscribed ? 'Yes' : 'No'}</span>
                                            </p>
                                            {isIOSNeedsInstall && (
                                                <p className={cn("text-[12px] mt-1", isDark ? "text-amber-200/80" : "text-amber-700")}>
                                                    iOS requires “Add to Home Screen” for push.
                                                </p>
                                            )}
                                            {!hasVapidKey && (
                                                <p className={cn("text-[12px] mt-1", isDark ? "text-amber-200/80" : "text-amber-700")}>
                                                    Missing VAPID public key in frontend env.
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                triggerHaptic();
                                                await refreshPushStatus();
                                                toast.success("Notification status refreshed");
                                            }}
                                            className={cn(
                                                "h-10 px-4 rounded-xl border text-[12px] font-bold transition-all active:scale-[0.99] shrink-0",
                                                isDark ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                    <div className={cn("p-4 rounded-2xl flex items-start gap-3", isDark ? "bg-amber-500/5 text-amber-500/80" : "bg-amber-50 text-amber-600")}>
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p className="text-[11px] leading-relaxed font-medium">
                                            We use push notifications to alert you about new contracts and emergency payment updates.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                );
            case 'logout':
                triggerHaptic();
                signOutMutation.mutate?.();
                setActiveSettingsPage(null);
                setActiveTab('dashboard');
                return null;
            default:
                return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] px-10 text-center">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-6">
                            <Clock className="w-10 h-10 text-blue-500 opacity-40" />
                        </div>
                        <h3 className={cn("text-xl font-bold mb-2", textColor)}>Refining Module</h3>
                        <p className={cn("opacity-40 text-sm leading-relaxed mb-8", textColor)}>We're fine-tuning this control center for your creator business.</p>
                        <button
                            onClick={() => setActiveSettingsPage(null)}
                            className="bg-blue-600 text-white font-black px-10 py-4 rounded-2xl active:scale-95 transition-all text-[13px] uppercase tracking-widest"
                        >
                            Back To Hub
                        </button>
                    </div>
                );
        }
    };

    const upcomingCampaigns = brandDeals

        .filter(d => d.status === 'Active' || d.status === 'confirmed')
        .map(d => ({
            id: d.id,
            title: d.campaign_name || d.title || 'Brand Project',
            date: d.due_date ? new Date(d.due_date).toLocaleDateString() : 'TBD',
            status: d.status
        }))
        .slice(0, 3);

    const closeItemDetail = () => {
        triggerHaptic();
        setShowItemMenu(false);
        setSelectedItem(null);
        setSelectedType(null);
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = lastListScrollTopRef.current;
            }
        });
    };

    return (
        <div
            className={cn('fixed inset-0 z-[1000] flex justify-center overflow-hidden font-sans selection:bg-emerald-500/25')}
            style={{ backgroundColor: bgColor }}
        >
            {isDark ? (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
                    <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-emerald-400/20 rounded-full blur-[140px]" />
                    <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-sky-500/18 rounded-full blur-[160px]" />
                    <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-emerald-500/12 rounded-full blur-[170px]" />
                </div>
            ) : (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(55%_45%_at_95%_10%,rgba(14,165,233,0.16),transparent_60%)]" />
                </div>
            )}
            <div
                className={cn(
                    'w-full md:max-w-3xl mx-auto relative z-10 h-[100dvh] flex flex-col transition-colors duration-300 md:border-x bg-transparent',
                    isDark ? 'md:border-[#1F2937] text-slate-200' : 'md:border-slate-200 text-slate-900'
                )}
            >
                {/* Sidebar Drawer */}
                <PremiumDrawer
                    open={showMenu}
                    onClose={() => setShowMenu(false)}
                    onNavigate={(path) => { navigate(path); setShowMenu(false); }}
                    onSetActiveTab={(tab) => { setShowMenu(false); }}
                    onLogout={() => { setShowMenu(false); if (onLogout) onLogout(); }}
                    activeItem={activeTab}
                    counts={{ messages: pendingOffersCount }}
                />

                {/* Pull to Refresh */}
                <div
                    className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-[110]"
                    style={{ transform: `translateY(${pullDistance - 40}px)`, opacity: pullDistance > 10 ? 1 : 0 }}
                >
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg border', isDark ? 'bg-[#121826] border-[#1F2937]' : 'bg-white border-slate-200')}>
                        {isRefreshingProp
                            ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            : <RefreshCw className="w-5 h-5 text-slate-400" style={{ transform: `rotate(${pullDistance * 6}deg)` }} />
                        }
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onScroll={e => { if (e.currentTarget.scrollTop > 10 && pullDistance > 0) { setPullDistance(0); setStartY(0); } }}
                    className="flex-1 overflow-y-auto overflow-x-hidden pb-[100px] scrollbar-hide"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div style={{ height: isRefreshingProp ? '60px' : '0' }} className="transition-all duration-300" />

                    {/* ─── DASHBOARD TAB ─── */}
                    {activeTab === 'dashboard' && (
                        <>
                            {/* Command Header */}
                            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                                <div className="flex items-center justify-between mb-8">
                                    {/* Left: Sidebar Menu */}
                                    <button onClick={() => handleAction('menu')} className={cn("p-1.5 -ml-1.5 rounded-full transition-all active:scale-95", secondaryTextColor)}>
                                        <Menu className="w-6 h-6" strokeWidth={1.5} />
                                    </button>

                                    {/* Center: Wordmark */}
                                    <div className="flex items-center gap-1.5 font-semibold text-[16px] tracking-tight">
                                        <ShieldCheck className={cn("w-4 h-4", isDark ? "text-white" : "text-slate-900")} />
                                        <span className={textColor}>CreatorArmour</span>
                                    </div>

                                    {/* Right: Actions & Avatar */}
                                    <div className="flex items-center gap-2">
                                        {/* Dark / Light toggle */}
                                        <motion.button
                                            onClick={() => { triggerHaptic(); setTheme(t => t === 'dark' ? 'light' : 'dark'); }}
                                            whileTap={{ scale: 0.92 }}
                                            className={cn(
                                                "flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all duration-300",
                                                isDark
                                                    ? "bg-slate-800 border-slate-700 text-amber-400"
                                                    : "bg-slate-100 border-slate-200 text-slate-600"
                                            )}
                                        >
                                            <AnimatePresence mode="wait" initial={false}>
                                                {isDark ? (
                                                    <motion.span key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                                        <Moon className="w-3.5 h-3.5" />
                                                    </motion.span>
                                                ) : (
                                                    <motion.span key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                                        <Sun className="w-3.5 h-3.5" />
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            <span className="text-[10px] font-bold tracking-wide">{isDark ? 'Dark' : 'Light'}</span>
                                        </motion.button>

                                        {/* Bell */}
                                        <button onClick={() => handleAction('notifications')} className={cn('relative', secondaryTextColor)}>
                                            <Bell className="w-5 h-5" />
                                            {unreadNotificationCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 text-[8px] font-black flex items-center justify-center text-white" style={{ borderColor: bgColor }}>
                                                    {Math.min(unreadNotificationCount, 9)}
                                                </span>
                                            )}
                                        </button>

                                        {/* Avatar */}
                                        <button onClick={() => setActiveTab('profile')} className={cn("w-8 h-8 rounded-full border overflow-hidden transition-all active:scale-95", borderColor)}>
                                            <img
                                                src={avatarUrl}
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).onerror = null;
                                                    (e.currentTarget as HTMLImageElement).src = avatarFallbackUrl;
                                                }}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Greeting / Status */}
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                    <div className="flex items-center justify-between">
                                        <h1 className={cn('text-[18px] font-semibold tracking-tight', textColor)}>
                                            Your Deals
                                        </h1>
                                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full", isDark ? "bg-emerald-500/10" : "bg-emerald-50")}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] uppercase font-bold tracking-[0.06em] text-emerald-600 dark:text-emerald-400">Active</span>
                                        </div>
                                    </div>
                                    <p className={cn('text-[15px] font-semibold mt-0', isDark ? "text-white/70" : "text-slate-600")}>
                                        @{username}
                                    </p>
                                </motion.div>
                            </div>

                            {shouldShowPushPrompt && (
                                <div className="px-5 mb-6">
                                    <div className={cn("p-5 rounded-[2rem] border relative overflow-hidden", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-200 shadow-sm")}>
                                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                                        <div className="flex items-start gap-3">
                                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-emerald-500/15" : "bg-emerald-50")}>
                                                <Bell className={cn("w-5 h-5", isDark ? "text-emerald-300" : "text-emerald-600")} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn("text-[14px] font-bold tracking-tight", textColor)}>Enable Deal Alerts</p>
                                                <p className={cn("text-[12px] mt-1 opacity-60 leading-relaxed", textColor)}>
                                                    Get instant notifications when a brand sends you a collaboration request.
                                                </p>
                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            triggerHaptic();
                                                            if (isIOSNeedsInstall) {
                                                                setShowPushInstallGuide(true);
                                                                return;
                                                            }
                                                            if ((pushPermission as string) === 'denied') {
                                                                toast.error("Notifications are blocked. Enable them in browser settings.");
                                                                return;
                                                            }
                                                            const res = await enableNotifications();
                                                            if (res.success) toast.success("Push notifications enabled!");
                                                            else toast.error("Couldn’t enable notifications.", { description: res.reason || 'Unknown reason' });
                                                        }}
                                                        className="flex-1 h-11 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all bg-emerald-600 text-white hover:bg-emerald-500"
                                                    >
                                                        Enable
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            dismissPushPrompt();
                                                        }}
                                                        className={cn(
                                                            "h-11 px-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all",
                                                            isDark ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        Not now
                                                    </button>
                                                </div>
                                                {isIOSNeedsInstall && (
                                                    <p className={cn("text-[11px] mt-3", isDark ? "text-amber-200/80" : "text-amber-700")}>
                                                        iPhone/iPad: install to Home Screen first (no “Allow” popup will show in a Safari tab).
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State vs Normal Metrics */}
                            {activeDealsCount === 0 && pendingOffersCount === 0 && monthlyRevenue === 0 && collabRequests.length === 0 ? (
                                <>
                                    {/* Empty State Hero */}
                                    <div className="px-5 mb-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "p-5 md:p-6 rounded-[2.5rem] border relative overflow-hidden",
                                                isDark ? "bg-gradient-to-br from-blue-900/30 via-[#1C1C1E] to-[#1C1C1E] border-[#2C2C2E]" : "bg-gradient-to-br from-blue-50/80 via-white to-white border-blue-100 shadow-xl shadow-blue-500/5"
                                            )}
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                                <Zap className="w-20 h-20 text-blue-500" />
                                            </div>
                                            <h2 className={cn("text-[22px] font-black mb-1 tracking-tight font-outfit", textColor)}>Your Collaboration Page Is Live</h2>
                                            <p className={cn("text-[13px] font-medium mb-5 leading-relaxed opacity-70", textColor)}>
                                                Brands can now send you structured collaboration offers.<br />
                                                Share your Collab Link to start receiving deals.
                                            </p>

                                            {/* Beautiful Collab Link Card */}
                                            <div className={cn("p-3.5 rounded-3xl border mb-4", isDark ? "bg-black/30 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", textColor)}>Your Collab Link</p>
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Brands submit offers here</span>
                                                    </div>
                                                </div>

                                                <div className={cn("px-4 py-3.5 rounded-2xl font-mono text-[13px] border mb-2.5 overflow-x-auto whitespace-nowrap", isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}>
                                                    creatorarmour.com/{profile?.handle || username || 'creator'}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            handleCopyStorefront();
                                                        }}
                                                        className={cn(
                                                            "flex-1 h-12 rounded-2xl flex items-center justify-center border font-black text-white text-[12px] shadow-lg active:scale-95 transition-all whitespace-nowrap",
                                                            isCollabLinkCopied
                                                                ? "bg-emerald-600 border-emerald-500 shadow-emerald-500/20"
                                                                : "bg-blue-600 border-blue-500 shadow-blue-500/20"
                                                        )}
                                                    >
                                                        {isCollabLinkCopied ? 'Copied' : 'Copy Link'}
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`/${profile?.handle || username || 'creator'}`, '_blank')}
                                                        className={cn("flex-1 h-12 rounded-2xl flex items-center justify-center border font-bold text-[12px] active:scale-95 transition-all whitespace-nowrap", isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-700")}
                                                    >
                                                        Preview Page
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Where to Share Guide */}
                                            <div className={cn("p-3.5 rounded-3xl border mb-1", isDark ? "bg-black/30 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                                <p className={cn("text-[11px] font-bold mb-3", textColor)}>Where to share your Collab Link</p>
                                                <div className="grid grid-cols-2 gap-2.5 mb-4">
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Instagram Bio</span></div>
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Brand DMs</span></div>
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Email signature</span></div>
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Linktree</span></div>
                                                </div>

                                                <div className={cn("p-3 rounded-2xl border text-[11px] font-medium leading-relaxed", isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-slate-50 border-slate-200 text-slate-600")}>
                                                    <span className="opacity-50 text-[10px] uppercase font-bold tracking-widest block mb-1">Example DM Reply:</span>
                                                    "Please submit campaign details here:<br />
                                                    creatorarmour.com/{profile?.handle || username || 'creator'}"
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>


                                </>
                            ) : (
                                <>
                                    <div className="px-5 mb-8 space-y-6">

                                        {/* ─── LIFECYCLE FOCUS BANNER ─── */}
                                        {(() => {
                                            const banners: Record<string, { emoji: string; title: string; desc: string; cta: string; onClick: () => void }> = {
                                                new: { emoji: '🚀', title: 'Set up your collab page', desc: 'Add your intro, pricing and share your link to start getting offers.', cta: 'Complete Profile', onClick: () => setActiveTab('profile') },
                                                priced: { emoji: '📢', title: 'Share your collab link', desc: 'Your pricing is set. Share your link with brands to get your first offer.', cta: 'Copy Link', onClick: handleCopyStorefront },
                                                link_shared: { emoji: '📊', title: 'Waiting for your first offer', desc: 'Keep sharing your link. Brands are discovering your collab page.', cta: 'View Collab Page', onClick: () => window.open(`/${profile?.handle || username}`, '_blank') },
                                            };
                                            const banner = banners[creatorStage];
                                            if (!banner) return null;
                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={cn(
                                                        "rounded-[1.75rem] border px-5 py-4 flex items-center gap-4",
                                                        isDark ? "bg-blue-500/10 border-blue-400/20" : "bg-blue-50 border-blue-100"
                                                    )}
                                                >
                                                    <span className="text-2xl flex-shrink-0">{banner.emoji}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-[13px] font-black", textColor)}>{banner.title}</p>
                                                        <p className={cn("text-[11px] mt-0.5 opacity-70", textColor)}>{banner.desc}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => { triggerHaptic(); banner.onClick(); }}
                                                        className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                                                    >
                                                        {banner.cta}
                                                    </button>
                                                </motion.div>
                                            );
                                        })()}

                                        {/* ─── ACTION REQUIRED ─── */}
                                        <div ref={actionRequiredRef} className={cn("rounded-[2rem] border p-5 shadow-sm", cardBgColor, borderColor)}>
                                            <div className="flex items-start justify-between gap-4 mb-5">
                                                <div>
                                                    <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-45", textColor)}>Your Turn</p>
                                                    <h2 className={cn("text-[22px] leading-[1.05] font-black tracking-tight mt-1", textColor)}>Deals waiting on you</h2>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        setActiveTab('collabs');
                                                        setCollabSubTab('pending');
                                                    }}
                                                    className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white active:scale-95 transition-all"
                                                >
                                                    Open Inbox {collabsAttentionCount > 0 ? `(${collabsAttentionCount})` : ''}
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {isDashboardRefreshing ? Array.from({ length: 3 }).map((_, index) => (
                                                    <div key={`action-skeleton-${index}`} className={cn("w-full rounded-[1.5rem] border px-4 py-4", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="skeleton h-4 w-32 rounded-xl" />
                                                                <div className="skeleton mt-2 h-3 w-44 rounded-full" />
                                                            </div>
                                                            <div className="skeleton h-9 w-24 rounded-xl" />
                                                        </div>
                                                    </div>
                                                )) : dashboardActionItems.length > 0 ? dashboardActionItems.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={item.onClick}
                                                        className={cn("w-full rounded-[1.55rem] border px-4 py-4 text-left transition-all active:scale-[0.99] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", isDark ? "border-white/10 bg-white/[0.035]" : "border-slate-200 bg-slate-50")}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn(
                                                                        "h-2.5 w-2.5 rounded-full shrink-0",
                                                                        item.tone === 'red' ? "bg-red-500" :
                                                                        item.tone === 'amber' ? "bg-amber-400" :
                                                                        item.tone === 'emerald' ? "bg-emerald-500" :
                                                                        "bg-blue-500"
                                                                    )} />
                                                                    <p className={cn("text-[15px] font-black tracking-tight", textColor)}>{item.title}</p>
                                                                </div>
                                                                <p className={cn("mt-2 text-[12px] leading-relaxed", secondaryTextColor)}>{item.subtitle}</p>
                                                            </div>
                                                            <span className={cn(
                                                                "shrink-0 rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em]",
                                                                item.tone === 'red' ? "bg-red-600 text-white" :
                                                                item.tone === 'amber' ? "bg-amber-500 text-white" :
                                                                item.tone === 'emerald' ? "bg-emerald-600 text-white" :
                                                                "bg-blue-600 text-white"
                                                            )}>
                                                                {item.cta}
                                                            </span>
                                                        </div>
                                                    </button>
                                                )) : (
                                                    <div className={cn("rounded-[1.5rem] border px-4 py-5 text-center", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                                        <p className={cn("text-[14px] font-semibold", textColor)}>No urgent actions right now.</p>
                                                        <p className={cn("mt-1 text-[12px]", secondaryTextColor)}>New offers and deal tasks will appear here first.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn("rounded-[2rem] border p-5 shadow-sm", cardBgColor, borderColor)}>
                                            <div className="flex items-start justify-between gap-4 mb-5">
                                                <div>
                                                    <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-45", textColor)}>Active Deals</p>
                                                    <h2 className={cn("text-[22px] leading-[1.05] font-black tracking-tight mt-1", textColor)}>Current collaborations</h2>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        setActiveTab('collabs');
                                                        setCollabSubTab('active');
                                                    }}
                                                    className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-blue-300" : "text-blue-600")}
                                                >
                                                    View All {activeDealsCount > 0 ? `(${activeDealsCount})` : ''}
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {activeDealsList.slice(0, 4).map((deal: any, idx: number) => {
                                                    const ux = getCreatorDealCardUX(deal);
                                                    const stages = ['Offer', 'Contract', 'Create', 'Deliver', 'Review', 'Paid'];
                                                    const progressPercent = Math.min(100, Math.max(12, Math.round((ux.progressStep / stages.length) * 100)));
                                                    return (
                                                        <button
                                                            key={deal?.id || idx}
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                setSelectedItem(deal);
                                                                setSelectedType('deal');
                                                            }}
                                                            className={cn("w-full rounded-[1.55rem] border px-4 py-4 text-left transition-all active:scale-[0.99] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", isDark ? "border-white/10 bg-white/[0.035]" : "border-slate-200 bg-white")}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className={cn("text-[15px] font-black tracking-tight", textColor)}>{deal?.brand_name || 'Brand collaboration'}</p>
                                                                    <p className={cn("mt-1.5 text-[12px]", secondaryTextColor)}>
                                                                        ₹{Number(deal?.deal_amount || 0).toLocaleString('en-IN')} • {Array.isArray(deal?.deliverables) ? deal.deliverables.join(', ') : (deal?.deliverables || 'Deliverables pending')}
                                                                    </p>
                                                                    <p className={cn("mt-1 text-[12px]", secondaryTextColor)}>
                                                                        Deadline: {deal?.due_date || deal?.deadline ? new Date(deal?.due_date || deal?.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Not set'}
                                                                    </p>
                                                                </div>
                                                                <span className={cn("shrink-0 rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em]", isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700")}>
                                                                    {ux.cta}
                                                                </span>
                                                            </div>
                                                            <div className="mt-4">
                                                                <div className={cn("h-2.5 w-full rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-slate-100")}>
                                                                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" style={{ width: `${progressPercent}%` }} />
                                                                </div>
                                                                <div className="mt-2.5 flex items-center justify-between gap-1">
                                                                    {stages.map((stage, stageIndex) => (
                                                                        <span key={stage} className={cn("text-[8px] font-black uppercase tracking-[0.14em]", stageIndex + 1 <= ux.progressStep ? (isDark ? "text-white/85" : "text-slate-800") : secondaryTextColor)}>
                                                                            {stage}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className={cn("rounded-[2rem] border p-5 shadow-sm", cardBgColor, borderColor)}>
                                                <div className="flex items-start justify-between gap-4 mb-5">
                                                    <div>
                                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-45", textColor)}>Collab Page</p>
                                                        <h2 className={cn("text-[20px] font-black tracking-tight mt-1", textColor)}>Performance</h2>
                                                    </div>
                                                    <button type="button" onClick={handleCopyStorefront} className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white active:scale-95 transition-all">
                                                        Share Collab Link
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className={cn("rounded-[1.35rem] border px-3 py-3.5", isDark ? "border-white/10 bg-white/[0.035]" : "border-slate-200 bg-slate-50")}>
                                                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-45", textColor)}>Views</p>
                                                        <p className={cn("mt-1.5 text-[20px] font-black", textColor)}>{collabViews}</p>
                                                        <p className={cn("text-[10px]", secondaryTextColor)}>Last 7 days</p>
                                                    </div>
                                                    <div className={cn("rounded-[1.35rem] border px-3 py-3.5", isDark ? "border-white/10 bg-white/[0.035]" : "border-slate-200 bg-slate-50")}>
                                                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-45", textColor)}>Offers</p>
                                                        <p className={cn("mt-1.5 text-[20px] font-black", textColor)}>{collabRequestCount}</p>
                                                        <p className={cn("text-[10px]", secondaryTextColor)}>Total received</p>
                                                    </div>
                                                    <div className={cn("rounded-[1.35rem] border px-3 py-3.5", isDark ? "border-white/10 bg-white/[0.035]" : "border-slate-200 bg-slate-50")}>
                                                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-45", textColor)}>Conversion</p>
                                                        <p className={cn("mt-1.5 text-[20px] font-black", textColor)}>{collabConversion.toFixed(1)}%</p>
                                                        <p className={cn("text-[10px]", secondaryTextColor)}>Views → Offers</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={handleCopyStorefront}
                                                        className={cn(
                                                            "h-12 rounded-xl flex items-center justify-center border font-black text-white text-[11px] shadow-lg active:scale-95 transition-all whitespace-nowrap",
                                                            isCollabLinkCopied
                                                                ? "bg-emerald-600 border-emerald-500 shadow-emerald-500/20"
                                                                : "bg-blue-600 border-blue-500 shadow-blue-500/20"
                                                        )}
                                                    >
                                                        {isCollabLinkCopied ? '✓ Copied' : 'Copy Link'}
                                                    </button>
                                                    <button
                                                        onClick={handleShareWhatsApp}
                                                        className={cn("h-12 rounded-xl flex items-center justify-center border font-bold text-[11px] active:scale-95 transition-all whitespace-nowrap", isDark ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700")}
                                                    >
                                                        WhatsApp
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`/${profile?.handle || username || 'creator'}`, '_blank')}
                                                        className={cn("h-12 rounded-xl flex items-center justify-center border font-bold text-[11px] active:scale-95 transition-all whitespace-nowrap", isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-700")}
                                                    >
                                                        Preview
                                                    </button>
                                                </div>
                                            </div>

                                            <CreatorProgressiveChecklist
                                                profile={profile}
                                                offersReceived={stats?.totalOffersReceived || profile?.offers_received || 0}
                                                offersAccepted={brandDeals.length}
                                                totalDeals={brandDeals.length}
                                                completedDeals={stats?.completedDeals || 0}
                                                totalEarnings={stats?.totalEarnings || 0}
                                                storefrontViews={stats?.storefrontViews || profile?.storefront_views || 0}
                                            />

                                            <div className={cn("rounded-[2rem] border p-5 shadow-sm", cardBgColor, borderColor)}>
                                                <div className="flex items-start justify-between gap-4 mb-5">
                                                    <div>
                                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-45", textColor)}>Growth</p>
                                                        <h2 className={cn("text-[20px] font-black tracking-tight mt-1", textColor)}>Where to share</h2>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2.5 mb-4">
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Instagram Bio</span></div>
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Brand DMs</span></div>
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Email signature</span></div>
                                                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className={cn("text-[11px] font-medium opacity-80", textColor)}>Linktree & Whatsapp</span></div>
                                                </div>
                                                <div className={cn("p-3 rounded-2xl border text-[11px] font-medium leading-relaxed relative", isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-slate-50 border-slate-200 text-slate-600")}>
                                                    <span className="opacity-50 text-[10px] uppercase font-bold tracking-widest block mb-1">Example DM Reply:</span>
                                                    "Hi! I'd love to collaborate. Please submit campaign details here:<br />
                                                    <span className="text-blue-500 dark:text-blue-400 font-mono mt-1 inline-block">creatorarmour.com/{profile?.handle || username || 'creator'}</span>"
                                                </div>
                                            </div>

                                            <div className={cn("rounded-[2rem] border p-5 shadow-sm", cardBgColor, borderColor)}>
                                                <div className="flex items-start justify-between gap-4 mb-5">
                                                    <div>
                                                        <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-45", textColor)}>Recent Activity</p>
                                                        <h2 className={cn("text-[20px] font-black tracking-tight mt-1", textColor)}>Latest timeline</h2>
                                                    </div>
                                                    <div className={cn("rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]", bookingReadinessScore >= 80 ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500")}>
                                                        {bookingReadinessScore}% ready
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {isDashboardRefreshing ? Array.from({ length: 4 }).map((_, index) => (
                                                        <div key={`activity-skeleton-${index}`} className="flex items-start gap-3">
                                                            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-600/30 shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="skeleton h-4 w-40 rounded-xl" />
                                                                <div className="skeleton mt-2 h-3 w-24 rounded-full" />
                                                            </div>
                                                        </div>
                                                    )) : recentActivityItems.map((item) => (
                                                        <div key={item.id} className="flex items-start gap-3">
                                                            <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
                                                            <div className="min-w-0">
                                                                <p className={cn("text-[13px] font-semibold leading-snug", textColor)}>{item.title}</p>
                                                                <p className={cn("text-[11px] mt-1 uppercase tracking-[0.14em]", secondaryTextColor)}>{item.meta}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ─── COLLABS TAB ─── */}
                    {activeTab === 'collabs' && (
                        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {/* Toggle Header */}
                            <div className={cn(
                                "sticky top-0 z-20 -mx-5 px-5 pt-2 pb-4 mb-6",
                                isDark ? "bg-[#061318]/70 backdrop-blur-xl border-b border-white/10" : "bg-white/80 backdrop-blur-xl border-b border-slate-100"
                            )}>
                                <div className={cn("flex p-1.5 rounded-2xl", isDark ? "bg-white/5" : "bg-slate-100")}>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            setCollabSubTab('pending');
                                            const next = new URLSearchParams(searchParams);
                                            next.set('tab', 'collabs');
                                            next.set('subtab', 'pending');
                                            next.delete('requestId');
                                            setSearchParams(next, { replace: true });
                                        }}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                            collabSubTab === 'pending'
                                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                                : cn("opacity-70", textColor)
                                        )}
                                    >
                                        Awaiting You ({actionRequiredTotalCount})
                                    </button>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            setCollabSubTab('active');
                                            const next = new URLSearchParams(searchParams);
                                            next.set('tab', 'collabs');
                                            next.set('subtab', 'active');
                                            next.delete('requestId');
                                            setSearchParams(next, { replace: true });
                                        }}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                            collabSubTab === 'active'
                                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                                : cn("opacity-70", textColor)
                                        )}
                                    >
                                        In Progress ({activeDealsCount})
                                    </button>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            setCollabSubTab('completed');
                                            const next = new URLSearchParams(searchParams);
                                            next.set('tab', 'collabs');
                                            next.set('subtab', 'completed');
                                            next.delete('requestId');
                                            setSearchParams(next, { replace: true });
                                        }}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                            collabSubTab === 'completed'
                                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                                : cn("opacity-70", textColor)
                                        )}
                                    >
                                        Closed ({completedDealsCount})
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {collabSubTab === 'active' ? (
                                    <motion.div
                                        key="active"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className={cn("p-6 rounded-2xl border mb-6", cardBgColor, borderColor)}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className={cn("text-xl font-bold", textColor)}>Active Collabs</h2>
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold">
                                                {activeDealsCount} Active
                                            </span>
                                        </div>

                                        {activeDealsCount > 0 ? (
                                            <div className="space-y-4">
                                                {(() => {
                                                    const insights = activeDealsList.slice(0, 50).reduce(
                                                        (acc: any, deal: any) => {
                                                            const ux = getCreatorDealCardUX(deal);
                                                            if (ux.needsSignature) acc.signature += 1;
                                                            if (ux.isRevisionRequested) acc.revision += 1;
                                                            if (ux.needsUpload) acc.upload += 1;
                                                            if (ux.needsPaymentConfirmation) acc.payment += 1;
                                                            if (ux.urgencyLevel === 'critical' && !String(deal?.status || '').toLowerCase().includes('completed')) acc.risk += 1;
                                                            return acc;
                                                        },
                                                        { signature: 0, revision: 0, upload: 0, payment: 0, risk: 0 }
                                                    );

                                                    const items: Array<{ label: string; count: number; tone: 'amber' | 'red' | 'blue' | 'emerald' }> = [
                                                        { label: 'Signatures pending', count: insights.signature, tone: 'amber' },
                                                        { label: 'Revisions requested', count: insights.revision, tone: 'red' },
                                                        { label: 'Uploads pending', count: insights.upload, tone: 'blue' },
                                                        { label: 'Payment confirmations', count: insights.payment, tone: 'emerald' },
                                                    ].filter((x) => x.count > 0);

                                                    if (items.length === 0) return null;

                                                    return (
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                const firstRisk = brandDeals.find((d: any) => {
                                                                    const ux = getCreatorDealCardUX(d);
                                                                    return ux.urgencyLevel === 'critical' && !String(d?.status || '').toLowerCase().includes('completed');
                                                                });
                                                                const firstSig = brandDeals.find((d: any) => getCreatorDealCardUX(d).needsSignature);
                                                                const firstRev = brandDeals.find((d: any) => getCreatorDealCardUX(d).isRevisionRequested);
                                                                const firstDraft = brandDeals.find((d: any) => getCreatorDealCardUX(d).isMaking);
                                                                const target = firstRisk || firstSig || firstRev || firstDraft;
                                                                if (target) {
                                                                    setSelectedItem(target);
                                                                    setSelectedType('deal');
                                                                }
                                                            }}
                                                            className={cn("mb-1 rounded-[1.6rem] border px-4 py-4 transition-all active:scale-[0.99]", cardBgColor, borderColor)}
                                                        >
                                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                                <p className={cn("text-[11px] font-black uppercase tracking-[0.24em] opacity-60", textColor)}>Needs Attention</p>
                                                                <div className="flex items-center gap-2">
                                                                    {items.slice(0, 2).map((it) => {
                                                                        const toneCls =
                                                                            it.tone === 'amber'
                                                                                ? (isDark ? "bg-amber-500/10 text-amber-200 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-200")
                                                                                : it.tone === 'red'
                                                                                    ? (isDark ? "bg-red-500/10 text-red-200 border-red-500/20" : "bg-red-50 text-red-800 border-red-200")
                                                                                    : it.tone === 'emerald'
                                                                                        ? (isDark ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20" : "bg-emerald-50 text-emerald-800 border-emerald-200")
                                                                                        : (isDark ? "bg-blue-500/10 text-blue-200 border-blue-500/20" : "bg-blue-50 text-blue-800 border-blue-200");
                                                                        return (
                                                                            <span key={it.label} className={cn("rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]", toneCls)}>
                                                                                {it.count} {it.label}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {insights.risk > 0 && (
                                                                        <span
                                                                            className={cn(
                                                                                "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                                                                                isDark ? "bg-red-500/10 text-red-300 border-red-500/20" : "bg-red-50 text-red-700 border-red-200"
                                                                            )}
                                                                        >
                                                                            {insights.risk} At Risk
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                {creatorHasPaidDealsWithoutUpi && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            setActiveTab('profile');
                                                            setActiveSettingsPage('payouts');
                                                        }}
                                                        className={cn("w-full rounded-[1.4rem] border px-4 py-3 text-left transition-all active:scale-[0.99]", isDark ? "border-amber-400/20 bg-amber-500/10" : "border-amber-200 bg-amber-50")}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", isDark ? "text-amber-200" : "text-amber-700")} />
                                                            <div>
                                                                <p className={cn("text-[12px] font-black uppercase tracking-[0.18em]", isDark ? "text-amber-100" : "text-amber-800")}>
                                                                    Add UPI To Get Paid
                                                                </p>
                                                                <p className={cn("mt-1 text-[12px] font-semibold leading-relaxed", isDark ? "text-amber-100/85" : "text-amber-900/80")}>
                                                                    You have paid collaborations. Add your UPI ID before brands release payment.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )}
                                                {activeDealsList.slice(0, 10).map((deal: any, idx: number) => {
                                                    const ux = getCreatorDealCardUX(deal);
                                                    const obligationBadges = getCreatorObligationBadges(deal);

                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            whileTap={{ scale: 0.98 }}
                                                            onTap={() => {
                                                                console.log("Card tapped: active deal", deal);
                                                                triggerHaptic();
                                                                setSelectedItem(deal);
                                                                setSelectedType('deal');
                                                            }}
                                                            className={cn(
                                                                "rounded-[1.8rem] border px-4 py-4 transition-all duration-200 group active:scale-[0.99] hover:-translate-y-[1px] relative cursor-pointer",
                                                                borderColor,
                                                                isDark ? "bg-white/5 active:bg-white/10" : "bg-white shadow-sm active:bg-slate-50"
                                                            )}
                                                        >
                                                            {(() => {
                                                                const budget = Number(deal?.deal_amount || deal?.exact_budget || 0);
                                                                const dueText = ux.daysUntilDue === null
                                                                    ? null
                                                                    : ux.daysUntilDue < 0
                                                                        ? `Overdue ${Math.abs(ux.daysUntilDue)}d`
                                                                        : `Due in ${ux.daysUntilDue}d`;
                                                                const dueTone =
                                                                    ux.urgencyLevel === 'critical'
                                                                        ? (isDark ? "text-red-200" : "text-red-700")
                                                                        : ux.urgencyLevel === 'warning'
                                                                            ? (isDark ? "text-amber-200" : "text-amber-700")
                                                                            : (isDark ? "text-orange-200" : "text-orange-700");
                                                                const cta = getDealPrimaryCta({ role: 'creator', deal });

                                                                const statusSentence =
                                                                    ux.needsSignature
                                                                        ? 'Signature required to start'
                                                                        : ux.isRevisionRequested
                                                                            ? 'Revision requested by brand'
                                                                            : ux.needsUpload
                                                                                ? 'Creator can upload content now'
                                                                                : ux.stageKey === 'deliver'
                                                                                    ? 'Content delivered and under review'
                                                                                    : ux.needsPaymentConfirmation
                                                                                        ? 'Payment confirmation pending'
                                                                                        : ux.stageKey === 'paid'
                                                                                            ? 'Payment completed'
                                                                                            : 'Contract signed — creator can start work';
                                                                const contractSigned =
                                                                    !ux.needsSignature &&
                                                                    (ux.rawStatus.includes('fully_executed') ||
                                                                        ux.rawStatus === 'signed' ||
                                                                        ux.rawStatus.includes('content_') ||
                                                                        ux.rawStatus.includes('payment_released') ||
                                                                        ux.rawStatus.includes('completed'));

                                                                return (
                                                                    <>
                                                                        <div className="mb-3 flex items-start justify-between gap-3">
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-sm">
                                                                                    {getBrandIcon(
                                                                                        deal.brand_logo || deal.brand_logo_url || deal.logo_url || deal.raw?.brand_logo || deal.raw?.brand_logo_url || (deal as any).brand?.logo_url,
                                                                                        deal.category,
                                                                                        deal.brand_name
                                                                                    )}
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <h4 className={cn("text-[15px] font-black tracking-tight truncate", textColor)}>{deal.brand_name}</h4>
                                                                                    <p className={cn("text-[11px] font-semibold mt-0.5 truncate", secondaryTextColor)}>{deal.category || 'Collaboration'}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right shrink-0">
                                                                                <p className={cn("text-[18px] font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                                                    {budget > 0 ? `₹${budget.toLocaleString()}` : '—'}
                                                                                </p>
                                                                                {dueText && (
                                                                                    <p className={cn("text-[11px] font-bold mt-1 flex items-center justify-end gap-1.5", dueTone)}>
                                                                                        <Clock className="w-3.5 h-3.5" />
                                                                                        {dueText}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center justify-between gap-3 mb-2">
                                                                            <p className={cn("text-[12px] font-semibold truncate", secondaryTextColor)}>
                                                                                {String(deal.collab_type || 'Collaboration')}
                                                                            </p>
                                                                            <span className={cn(
                                                                                "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                                                                                ux.stageKey === 'paid'
                                                                                    ? (isDark ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-800")
                                                                                    : ux.needsCreatorAction
                                                                                        ? (isDark ? "border-amber-500/25 bg-amber-500/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800")
                                                                                        : (isDark ? "border-white/10 bg-white/5 text-white/70" : "border-slate-200 bg-slate-50 text-slate-700")
                                                                            )}>
                                                                                {ux.stagePill}
                                                                            </span>
                                                                        </div>

                                                                        <p className={cn(
                                                                            "mb-3 text-[14px] font-bold leading-snug",
                                                                            ux.needsSignature
                                                                                ? (isDark ? "text-amber-200" : "text-amber-700")
                                                                                : ux.isRevisionRequested
                                                                                    ? (isDark ? "text-red-200" : "text-red-700")
                                                                                    : contractSigned
                                                                                    ? (isDark ? "text-emerald-200" : "text-emerald-700")
                                                                                    : (isDark ? "text-white/70" : "text-slate-600")
                                                                        )}>
                                                                            {statusSentence}
                                                                        </p>

                                                                        <div className="mb-3 flex flex-wrap gap-2">
                                                                            {obligationBadges.slice(0, 2).map((badge) => (
                                                                                <span
                                                                                    key={badge}
                                                                                    className={cn(
                                                                                        "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                                                                                        isDark ? "border-white/10 bg-white/5 text-white/80" : "border-slate-200 bg-slate-50 text-slate-700"
                                                                                    )}
                                                                                >
                                                                                    {badge}
                                                                                </span>
                                                                            ))}
                                                                        </div>

                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <div className="flex flex-1 items-center gap-1.5">
                                                                                {Array.from({ length: 6 }).map((_, i) => (
                                                                                    <span
                                                                                        key={i}
                                                                                        className={cn(
                                                                                            "h-1.5 flex-1 rounded-full",
                                                                                            i < ux.progressStep
                                                                                                ? (isDark ? "bg-emerald-400/80" : "bg-emerald-500")
                                                                                                : (isDark ? "bg-white/10" : "bg-slate-200")
                                                                                        )}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.16em]", secondaryTextColor)}>
                                                                                {ux.stagePill}
                                                                            </span>
                                                                        </div>

	                                                                        <button
	                                                                            type="button"
	                                                                            onPointerDown={(e) => e.stopPropagation()}
	                                                                            onClick={(e) => {
	                                                                                e.stopPropagation();
	                                                                                triggerHaptic();
	                                                                                setSelectedItem(deal);
	                                                                                setSelectedType('deal');
	                                                                            }}
	                                                                            disabled={cta.disabled}
	                                                                            className={cn(
	                                                                                "mt-4 h-12 w-full rounded-[1.2rem] text-[14px] font-black transition active:scale-[0.98]",
	                                                                                ux.stageKey === 'paid'
	                                                                                    ? (isDark ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500")
	                                                                                    : ux.needsSignature
	                                                                                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
	                                                                                        : ux.isRevisionRequested
	                                                                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
	                                                                                            : "bg-gradient-to-r from-emerald-500 to-blue-500 text-white",
	                                                                                cta.disabled && "opacity-60 cursor-not-allowed active:scale-100"
	                                                                            )}
	                                                                        >
	                                                                            {ux.cta}
	                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Briefcase className={cn("w-12 h-12 mx-auto mb-3 opacity-20", isDark ? "text-white" : "text-slate-900")} />
                                                <p className={cn("text-sm", secondaryTextColor)}>No active deals yet.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : collabSubTab === 'completed' ? (
                                    <motion.div
                                        key="completed"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className={cn("p-6 rounded-2xl border mb-6", cardBgColor, borderColor)}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className={cn("text-xl font-bold", textColor)}>Completed</h2>
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold">
                                                {completedDealsCount} Closed
                                            </span>
                                        </div>

                                        {completedDealsCount > 0 ? (
                                            <div className="space-y-4">
                                                {completedDealsList.slice(0, 10).map((deal: any, idx: number) => {
                                                    const ux = getCreatorDealCardUX(deal);
                                                    const obligationBadges = getCreatorObligationBadges(deal);
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            whileTap={{ scale: 0.98 }}
                                                            onTap={() => {
                                                                triggerHaptic();
                                                                setSelectedItem(deal);
                                                                setSelectedType('deal');
                                                            }}
                                                            className={cn(
                                                                "p-4 rounded-2xl border transition-all duration-200 group active:scale-[0.99] relative cursor-pointer",
                                                                borderColor,
                                                                isDark ? "bg-white/5 active:bg-white/10" : "bg-white shadow-sm active:bg-slate-50"
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-sm">
                                                                        {getBrandIcon(deal.brand_logo || deal.brand_logo_url || deal.logo_url || deal.raw?.brand_logo || deal.raw?.brand_logo_url || (deal as any).brand?.logo_url, deal.category, deal.brand_name)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className={cn("text-[15px] font-bold tracking-tight truncate", textColor)}>{deal.brand_name}</h4>
                                                                        <span className={cn("text-[10px] uppercase font-black tracking-widest opacity-40 mt-0.5", textColor)}>{deal.category || 'Brand'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 pl-3">
                                                                    <div className={cn("text-[17px] font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                                        ₹{(deal.deal_amount || deal.exact_budget || 0).toLocaleString()}
                                                                    </div>
                                                                    <p className={cn("text-[8px] font-black uppercase tracking-widest opacity-40 mt-1.5", isDark ? "text-slate-300" : "text-slate-500")}>Earned</p>
                                                                </div>
                                                            </div>

                                                            <div className={cn("text-[11px] font-semibold", isDark ? "text-emerald-300" : "text-emerald-700")}>
                                                                ✅ Completed
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {obligationBadges.map((badge) => (
                                                                    <span
                                                                        key={badge}
                                                                        className={cn(
                                                                            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]",
                                                                            isDark ? "border-white/10 bg-white/5 text-white/80" : "border-slate-200 bg-slate-50 text-slate-700"
                                                                        )}
                                                                    >
                                                                        {badge}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    triggerHaptic();
                                                                    setSelectedItem(deal);
                                                                    setSelectedType('deal');
                                                                }}
                                                                className={cn(
                                                                    "mt-4 w-full h-12 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95",
                                                                    isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                                                                )}
                                                            >
                                                                {ux.cta || 'View Summary'}
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <CheckCircle2 className={cn("w-12 h-12 mx-auto mb-3 opacity-20", isDark ? "text-white" : "text-slate-900")} />
                                                <p className={cn("text-sm", secondaryTextColor)}>No completed deals yet.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="pending"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        {actionRequiredTotalCount > 0 ? (
                                            <div className="space-y-4">
                                                {actionRequiredDealsList.map((deal: any, idx: number) => {
                                                    const ux = getCreatorDealCardUX(deal);
                                                    const cta = getDealPrimaryCta({ role: 'creator', deal });
                                                    return (
                                                        <motion.div
                                                            key={`deal-action-${String(deal?.id || idx)}`}
                                                            whileTap={{ scale: 0.985 }}
                                                            onTap={() => {
                                                                triggerHaptic();
                                                                setSelectedItem(deal);
                                                                setSelectedType('deal');
                                                            }}
                                                            className={cn(
                                                                "p-4 rounded-2xl border transition-all duration-300 group active:scale-[0.99] relative cursor-pointer",
                                                                borderColor,
                                                                isDark
                                                                    ? "bg-[#111827]/40 hover:bg-[#111827]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                                                    : "bg-white shadow-sm hover:shadow-md active:bg-slate-50"
                                                            )}
                                                        >
                                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                <span
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                                                        isDark ? "bg-amber-500/10 text-amber-200 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-200"
                                                                    )}
                                                                >
                                                                    <AlertTriangle className={cn("w-3.5 h-3.5", isDark ? "text-amber-200" : "text-amber-700")} strokeWidth={3} />
                                                                    Action required
                                                                </span>
                                                            </div>
                                                            <div className="flex items-start justify-between mb-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300">
                                                                        {getBrandIcon(
                                                                            deal.brand_logo || deal.brand_logo_url || deal.logo_url || deal.raw?.brand_logo || deal.raw?.brand_logo_url || (deal as any).brand?.logo_url,
                                                                            deal.category,
                                                                            deal.brand_name
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className={cn("text-[15px] font-bold tracking-tight", textColor)}>{deal.brand_name || 'Brand'}</h4>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <span className={cn("text-[12px] font-semibold opacity-70", secondaryTextColor)}>{ux.nextStep}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 pl-3">
                                                                    <div className={cn("text-[17px] font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                                        ₹{Number(deal.deal_amount || 0).toLocaleString()}
                                                                    </div>
                                                                    <p className={cn("text-[8px] font-black uppercase tracking-widest opacity-40 mt-1.5", isDark ? "text-slate-300" : "text-slate-500")}>Campaign budget</p>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    triggerHaptic();
                                                                    setSelectedItem(deal);
                                                                    setSelectedType('deal');
                                                                }}
                                                                disabled={cta.disabled}
                                                                className={cn(
                                                                    "h-11 w-full rounded-[16px] text-[12px] font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5",
                                                                    dealPrimaryCtaButtonClass(cta.tone),
                                                                    cta.disabled ? "opacity-60" : ""
                                                                )}
                                                            >
                                                                {cta.label}
                                                                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
		                                                {collabRequests.slice(0, 10).map((req: any, idx: number) => {
		                                                    const expiresDays = 2 + (idx % 3);
		                                                    const sentAt = req.created_at || req.raw?.created_at || null;
		                                                    const sentHours = sentAt ? Math.max(0, Math.round((Date.now() - new Date(sentAt).getTime()) / 3600000)) : null;
		                                                    const sentText = sentHours !== null && Number.isFinite(sentHours) ? `Sent ${sentHours}h ago` : null;
	                                                    const amount = req.deal_amount || req.exact_budget || (idx === 0 ? 8000 : idx === 1 ? 15000 : idx === 2 ? 12000 : 5000);

	                                                    const expTone =
	                                                        expiresDays <= 1
	                                                            ? 'danger'
	                                                            : expiresDays <= 2
	                                                                ? 'danger'
	                                                                : expiresDays <= 4
	                                                                    ? 'warn'
	                                                                    : 'neutral';

	                                                    return (
	                                                        <motion.div
	                                                            key={idx}
	                                                            whileTap={{ scale: 0.983 }}
	                                                            onTap={() => {
	                                                                console.log("Card tapped: pending offer", req);
	                                                                triggerHaptic();
	                                                                setSelectedItem(req);
                                                                setSelectedType('offer');
                                                            }}
                                                            className={cn(
                                                                "p-4 rounded-2xl border transition-all duration-300 group active:scale-[0.99] relative cursor-pointer",
                                                                borderColor,
	                                                                isDark
	                                                                    ? "bg-[#111827]/40 hover:bg-[#111827]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
	                                                                    : "bg-white shadow-sm hover:shadow-md active:bg-slate-50"
	                                                            )}
	                                                        >
	                                                            <div className="flex flex-wrap items-center gap-2 mb-3">
	                                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
	                                                                    isDark ? "bg-amber-500/10 text-amber-200 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-200"
	                                                                )}>
	                                                                    <AlertTriangle className={cn("w-3.5 h-3.5", isDark ? "text-amber-200" : "text-amber-700")} strokeWidth={3} />
	                                                                    Action required
	                                                                </span>
	                                                            </div>
                                                            <div className="flex items-start justify-between mb-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300">
                                                                        {getBrandIcon(req.brand_logo || req.brand_logo_url || req.logo_url || req.raw?.brand_logo || req.raw?.brand_logo_url || req.raw?.logo_url, req.category, req.brand_name)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className={cn("text-[15px] font-bold tracking-tight", textColor)}>{req.brand_name}</h4>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                                                                            <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", textColor)}>Verified Brand</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={cn("text-[22px] font-black font-outfit tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                                                        ₹{amount.toLocaleString()}
                                                                    </p>
                                                                    <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-60 mt-1", isDark ? "text-emerald-300" : "text-emerald-600")}>
                                                                        You’ll earn
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-3 mb-4">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {(() => {
                                                                            const raw = req.deliverables || req.raw?.deliverables;
                                                                            let items: string[] = ['🎬 1 Reel'];
                                                                            try {
                                                                                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                                                if (Array.isArray(parsed) && parsed.length > 0) {
                                                                                    items = parsed.map((d: any) => {
                                                                                        if (typeof d === 'string') return d;
                                                                                        const ct = (d.contentType || d.type || '').toLowerCase();
                                                                                        const count = d.count || d.quantity || 1;
                                                                                        let emoji = '📋', label = 'Content';
                                                                                        if (ct.includes('reel')) { emoji = '🎬'; label = 'Reel'; }
                                                                                        else if (ct.includes('story')) { emoji = '📱'; label = 'Story'; }
                                                                                        else if (ct.includes('post')) { emoji = '🖼'; label = 'Post'; }
                                                                                        return `${emoji} ${count} ${label}`;
                                                                                    });
                                                                                }
                                                                            } catch (_) { }
                                                                            return items.slice(0, 2).map((d, i) => (
                                                                                <span key={i} className={cn("text-[12px] font-black bg-slate-500/10 px-2.5 py-1 rounded-lg", isDark ? "text-white" : "text-slate-900")}>
                                                                                    {d}
                                                                                </span>
                                                                            ));
                                                                        })()}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "flex items-center gap-1.5 ml-auto px-2.5 py-1.5 rounded-lg border",
                                                                        expTone === 'danger'
                                                                            ? (isDark ? "bg-red-500/10 text-red-300 border-red-500/20" : "bg-red-50 text-red-700 border-red-200")
                                                                            : expTone === 'warn'
                                                                                ? (isDark ? "bg-amber-500/10 text-amber-200 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-200")
                                                                                : (isDark ? "bg-white/5 text-white/70 border-white/10" : "bg-white text-slate-700 border-slate-200")
                                                                    )}>
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                            {sentText ? `${sentText} • ${expiresDays}d left` : `${expiresDays}d left`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Expected Payment Time callout */}
                                                                <div className={cn("flex items-start gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold leading-relaxed border", isDark ? "bg-[#1C2C2A]/70 text-emerald-200 border-emerald-500/20" : "bg-emerald-50 text-emerald-800 border-emerald-200")}>
                                                                    <Landmark className="w-3.5 h-3.5 shrink-0 mt-[2px]" />
                                                                    Payment released after content approval
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); triggerHaptic(); setSelectedItem(req); setSelectedType('offer'); }}
                                                                    className="h-11 w-full bg-blue-600 text-white rounded-[16px] text-[12px] font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                                                >
                                                                    Review & Respond
                                                                    <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                                                                </button>

                                                                <div className="flex items-center justify-between">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            triggerHaptic();
                                                                            setSelectedItem(req);
                                                                            setSelectedType('offer');
                                                                            toast.message("Counter inside offer details", { description: "Open offer → Counter." });
                                                                        }}
                                                                        className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-white/70 hover:text-white" : "text-slate-600 hover:text-slate-900")}
                                                                    >
                                                                        Counter
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            triggerHaptic(HapticPatterns.warning);
                                                                            if (req.isDemo) {
                                                                                toast.message("This is a demo offer", { description: "Accept/counter/decline is disabled for demo." });
                                                                                return;
                                                                            }
                                                                            if (onDeclineRequest) onDeclineRequest(req.id);
                                                                            else toast.error("Declined offer.");
                                                                        }}
                                                                        className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900")}
                                                                    >
                                                                        Decline
                                                                    </button>
                                                                </div>

                                                                {idx === 0 && (
                                                                    <p className={cn("text-[11px] font-semibold opacity-55", textColor)}>
                                                                        Tip: Reply within 24h to unlock more brand offers.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </motion.div>
	                                                    );
	                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Handshake className={cn("w-12 h-12 mx-auto mb-3 opacity-20", isDark ? "text-white" : "text-slate-900")} />
                                                <p className={cn("text-sm", secondaryTextColor)}>No new requests right now.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="h-24 opacity-0 pointer-events-none" aria-hidden="true" />
                        </div>
                    )}

                    {/* ─── OTHER TABS (Simplified for UI flow) ─── */}
                    {activeTab === 'profile' && (
                        <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 min-h-screen relative overflow-hidden bg-transparent")}>
                            <AnimatePresence mode="wait">
                                {!activeSettingsPage ? (
                                    <motion.div
                                        key="settings-main"
                                        initial={{ opacity: 0, x: 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="w-full"
                                    >
                                        <div className={cn("px-6 pt-16 pb-6 bg-transparent")}>
                                            <h1 className={cn("text-3xl font-black tracking-tight", textColor)}>Settings</h1>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="px-4 mb-8">
                                                <div className={cn(
                                                    "p-5 rounded-3xl flex items-center gap-4 transition-all border",
                                                    isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E5EA] shadow-sm"
                                                )}>
                                                    <div className="relative">
                                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-md">
                                                            <img
                                                                src={avatarUrl}
                                                                alt="avatar"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.currentTarget as HTMLImageElement).onerror = null;
                                                                    (e.currentTarget as HTMLImageElement).src = avatarFallbackUrl;
                                                                }}
                                                            />
                                                        </div>
                                                        <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full border-2 border-[#1C1C1E] flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                                                            <Camera className="w-3.5 h-3.5 text-white" />
                                                        </button>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h2 className={cn("text-xl font-bold tracking-tight", textColor)}>{displayName}</h2>
                                                        <p className={cn("text-[14px] opacity-40 font-medium mb-1.5", textColor)}> @{username || 'theblooming.miss'}</p>
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Verified Creator</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <SectionHeader title="Collab Setup" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<User />} iconBg="bg-blue-500"
                                                    label="Creator Info"
                                                    subtext="Who you are on your public profile"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('personal')}
                                                />
                                                <SettingsRow
                                                    icon={<Target />} iconBg="bg-amber-400"
                                                    label="Collab Preferences"
                                                    subtext="How you work with brands"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('collab-preferences')}
                                                />
                                                <SettingsRow
                                                    icon={<Package />} iconBg="bg-emerald-500"
                                                    label="Packages"
                                                    subtext="What brands can buy directly"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('packages')}
                                                />
                                                <SettingsRow
                                                    icon={<Link2 />} iconBg="bg-violet-500"
                                                    label="Collab Link"
                                                    subtext="What brands see on your storefront"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('collab-link')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="App" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={isDark ? <Sun /> : <Moon />} iconBg="bg-slate-500"
                                                    label="Theme"
                                                    subtext="Choose light or dark mode"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('dark-mode')}
                                                />
                                                <SettingsRow
                                                    icon={<Bell />} iconBg="bg-rose-500"
                                                    label="Notifications"
                                                    subtext="Deals, contracts, and payments"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('notifications')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="Finance" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<Landmark />} iconBg="bg-indigo-500"
                                                    label="Payout Methods"
                                                    subtext={creatorHasPaidDealsWithoutUpi ? "UPI required for paid deals" : "How you get paid"}
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('payouts')}
                                                    rightElement={creatorHasPaidDealsWithoutUpi ? (
                                                        <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-amber-500/15 text-amber-200" : "bg-amber-100 text-amber-800")}>
                                                            Action needed
                                                        </span>
                                                    ) : undefined}
                                                />
                                                <SettingsRow
                                                    icon={<CreditCard />} iconBg="bg-cyan-500"
                                                    label="Earnings & History"
                                                    subtext="Track revenue and payment history"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('earnings')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="Trust & Security" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<ShieldCheck />} iconBg="bg-blue-600"
                                                    label="Armour Verification"
                                                    subtext="Trust signals and verification status"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('verification')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="About" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<Info />} iconBg="bg-slate-400"
                                                    label="Support"
                                                    subtext="Help, app info, and version details"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('about')}
                                                />
                                                <SettingsRow
                                                    icon={<LogOut />} iconBg="bg-red-500"
                                                    label="Log Out"
                                                    subtext="Securely sign out of your account"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('logout')}
                                                />
                                            </SettingsGroup>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="settings-page"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="w-full min-h-screen"
                                    >
                                        {renderSettingsPage()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className={cn("text-2xl font-black tracking-tight", textColor)}>Payments</h1>
                                    <p className={cn("text-[11px] font-medium opacity-60", textColor)}>Track pending payments and completed payouts</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {paymentsAttentionCount > 0 && (
                                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", isDark ? "bg-amber-500/15 text-amber-200" : "bg-amber-100 text-amber-800")}>
                                            {paymentsAttentionCount} action{paymentsAttentionCount === 1 ? '' : 's'}
                                        </span>
                                    )}
                                    <button className={cn("p-2.5 rounded-xl border flex items-center justify-center", cardBgColor, borderColor)}>
                                        <Download className={cn("w-5 h-5", secondaryTextColor)} />
                                    </button>
                                </div>
                            </div>

	                            {/* Main Highlight: Pending Amount */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className={cn(
                                    "py-7 px-7 rounded-[2.25rem] shadow-xl border-0 mb-6 bg-gradient-to-br relative overflow-hidden",
                                    isDark
                                        ? "from-emerald-400 via-cyan-500 to-blue-600 shadow-blue-500/20"
                                        : "from-emerald-500 via-cyan-500 to-blue-700 shadow-blue-500/15"
                                )}
                            >
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    {isPaymentsRefreshing ? (
                                        <>
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <div className="skeleton h-3 w-24 rounded-full bg-white/20" />
                                                    <div className="skeleton mt-2 h-3 w-36 rounded-full bg-white/20" />
                                                </div>
                                                <div className="skeleton h-10 w-10 rounded-xl bg-white/20" />
                                            </div>
                                            <div className="skeleton h-10 w-44 rounded-2xl bg-white/20" />
                                            <div className="skeleton mt-5 h-10 w-44 rounded-xl bg-white/20" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between text-white/90 mb-3">
                                                <div className="space-y-0.5">
                                                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-85 text-white">Pending Amount</span>
                                                    <span className="block text-[11px] font-semibold text-white/70">Released after content approval</span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-white/12 backdrop-blur-md border border-white/20">
                                                    <Clock className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="text-4xl font-black text-white mb-5 flex items-baseline gap-1 font-outfit">
                                                <span className="text-2xl font-bold opacity-75">₹</span>
                                                <AnimatedCounter value={brandDeals.reduce((sum, d) => sum + (d.status?.toLowerCase() !== 'completed' ? (d.deal_amount || 0) : 0), 0)} />
                                            </div>
                                            <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-xl bg-black/10 backdrop-blur-md border border-white/15 w-fit">
                                                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                                                    <ShieldCheck className="w-3 h-3 text-white/90" />
                                                </div>
                                                <span className="text-[9px] font-black text-white tracking-[0.15em] uppercase">Creator Armour protection active</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>

                            {/* Secondary Stats Row */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {isPaymentsRefreshing ? (
                                    <>
                                        <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                            <div className="skeleton h-3 w-20 rounded-full" />
                                            <div className="skeleton mt-3 h-6 w-24 rounded-xl" />
                                        </div>
                                        <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                            <div className="skeleton h-3 w-20 rounded-full" />
                                            <div className="skeleton mt-3 h-6 w-24 rounded-xl" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2", textColor)}>Paid This Month</p>
                                            <div className={cn("text-lg font-bold font-outfit", isDark ? "text-emerald-400" : "text-emerald-600")}>₹{monthlyRevenue.toLocaleString()}</div>
                                        </div>
                                        <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2", textColor)}>Total Earnings</p>
                                            <div className={cn("text-lg font-bold font-outfit", textColor)}>₹{allTimeRevenue.toLocaleString()}</div>
                                        </div>
                                    </>
                                )}
                            </div>

	                            {/* Transaction List */}
	                            <div className="space-y-3">
	                                {isPaymentsRefreshing ? (
                                        Array.from({ length: 4 }).map((_, idx) => (
                                            <div key={`payment-skeleton-${idx}`} className={cn("p-5 rounded-2xl border flex items-center justify-between", cardBgColor, borderColor)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="skeleton h-10 w-10 rounded-xl" />
                                                    <div>
                                                        <div className="skeleton h-4 w-28 rounded-xl" />
                                                        <div className="skeleton mt-2 h-3 w-32 rounded-full" />
                                                    </div>
                                                </div>
                                                <div className="skeleton h-5 w-20 rounded-xl" />
                                            </div>
                                        ))
                                    ) : brandDeals.length > 0 ? (
	                                    brandDeals.map((deal: any, idx: number) => (
	                                        (() => {
	                                            const payUx = getCreatorPaymentListUX(deal);
	                                            const badgeClass = payUx.tone === 'success'
	                                                ? (isDark ? "bg-emerald-500/12 text-emerald-300 border-emerald-400/20" : "bg-emerald-500/10 text-emerald-700 border-emerald-500/15")
	                                                : payUx.tone === 'warning'
	                                                    ? (isDark ? "bg-amber-500/14 text-amber-200 border-amber-400/25" : "bg-amber-500/10 text-amber-700 border-amber-500/15")
	                                                    : payUx.tone === 'neutral'
	                                                        ? (isDark ? "bg-white/10 text-white/80 border-white/10" : "bg-slate-900/5 text-slate-700 border-slate-900/10")
	                                                        : (isDark ? "bg-sky-500/14 text-sky-200 border-sky-400/25" : "bg-sky-500/10 text-sky-700 border-sky-500/15");

	                                        <motion.div
	                                            key={idx}
	                                            initial={{ opacity: 0, y: 10 }}
	                                            animate={{ opacity: 1, y: 0 }}
	                                            transition={{ delay: idx * 0.05 }}
	                                            onClick={() => { triggerHaptic(); setSelectedPayment(deal); }}
	                                            className={cn("p-5 rounded-2xl border flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer", cardBgColor, borderColor)}
	                                        >
	                                            <div className="flex items-center gap-4">
	                                                <div className={cn("w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center text-lg font-black", borderColor, isDark ? "bg-white/5" : "bg-slate-50")}>
	                                                    {getBrandIcon(deal.brand_logo_url || deal.logo_url, deal.category, deal.brand_name)}
	                                                </div>
	                                                <div>
	                                                    <p className={cn("font-bold text-[15px]", textColor)}>{deal.brand_name || 'Brand Partner'}</p>
	                                                    <div className="mt-1 flex items-center gap-2 min-w-0">
	                                                        <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border", badgeClass)}>
	                                                            {payUx.label}
	                                                        </span>
	                                                        <span className={cn("text-[11px] font-semibold opacity-60 truncate", textColor)}>{payUx.sublabel}</span>
	                                                    </div>
	                                                </div>
	                                            </div>
	                                            <div className="flex items-center gap-2">
	                                                <div className="text-right">
	                                                    <p className={cn("font-black text-[16px] font-outfit", textColor)}>₹{(deal.deal_amount || 0).toLocaleString()}</p>
	                                                </div>
	                                                <ChevronRight className={cn("w-4 h-4 opacity-30", textColor)} />
	                                            </div>
	                                        </motion.div>
	                                        })()
	                                    ))
	                                ) : (
	                                    <div className="text-center py-12">
	                                        <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto mb-4 border border-slate-500/10">
	                                            <CreditCard className={cn("w-8 h-8 opacity-20", textColor)} />
                                        </div>
                                        <p className={cn("text-sm font-bold opacity-30", textColor)}>No transactions found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── NAVIGATION BAR (Redesigned) ─── */}
                <div
                    className={cn('fixed bottom-0 inset-x-0 border-t z-[1050] transition-all duration-500', isDark ? 'border-[#1F2937] bg-[#0B0F14]/90' : 'border-slate-200 bg-white/90')}
                    style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
                >
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 py-3 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className="flex flex-col items-center gap-1 w-14">
                            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Your Deals</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className="flex flex-col items-center gap-1 w-14 relative">
                            <Briefcase className={cn('w-[22px] h-[22px]', activeTab === 'collabs' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'collabs' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Collabs</span>
                            {collabsAttentionCount > 0 && (
                                <span className={cn(
                                    "absolute -top-1 right-0 min-w-[18px] h-[18px] px-1 rounded-full border text-[9px] font-black flex items-center justify-center",
                                    isDark ? "bg-amber-500 text-white border-[#0B0F14]" : "bg-amber-500 text-white border-white"
                                )}>
                                    {Math.min(collabsAttentionCount, 9)}
                                </span>
                            )}
                        </motion.button>

                        {/* Middle Action: Storefront */}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { triggerHaptic(); setShowActionSheet(true); }}
                            className="relative flex flex-col items-center -mt-8"
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center transition-all hover:brightness-110",
                                isDark ? "bg-gradient-to-br from-emerald-500 to-sky-500 border-4 border-[#0B0F14] text-white shadow-[0_4px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_40px_rgba(14,165,233,0.35)] ring-1 ring-emerald-400/30"
                                    : "bg-gradient-to-br from-emerald-600 to-sky-600 border-4 border-white text-white shadow-lg hover:shadow-xl ring-1 ring-emerald-200"
                                )}>
                                <Link2 className="w-7 h-7" />
                            </div>
                            <span className={cn("text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap", isDark ? "text-slate-400" : "text-slate-600")}>Collab Page</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className="flex flex-col items-center gap-1 w-14 relative">
                            <CreditCard className={cn('w-[22px] h-[22px]', activeTab === 'payments' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'payments' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Payments</span>
                            {paymentsAttentionCount > 0 && (
                                <span className={cn(
                                    "absolute -top-1 right-0 min-w-[18px] h-[18px] px-1 rounded-full border text-[9px] font-black flex items-center justify-center",
                                    isDark ? "bg-rose-500 text-white border-[#0B0F14]" : "bg-rose-500 text-white border-white"
                                )}>
                                    {Math.min(paymentsAttentionCount, 9)}
                                </span>
                            )}
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className="flex flex-col items-center gap-1 w-14">
                            <User className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'profile' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Account</span>
                        </motion.button>
                    </div>
                </div>

                {/* ─── ACTION SHEET ─── */}
                <AnimatePresence>
                    {showActionSheet && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowActionSheet(false)}
                                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className={cn(
                                    "fixed bottom-0 inset-x-0 z-[110] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl",
                                    isDark ? "bg-[#0F172A] border-white/10" : "bg-white border-slate-200"
                                )}
                            >
                                <div className="w-12 h-1 bg-slate-500/20 rounded-full mx-auto mb-6" />
                                <div className="max-w-md mx-auto">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Manage your storefront</h2>
                                            <p className={cn("text-[13px] mt-1 opacity-60", isDark ? "text-white" : "text-slate-900")}>Share your booking page, review offers, and update what brands see.</p>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowActionSheet(false)}
                                            className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}
                                        >
                                            <X className="w-5 h-5 text-slate-400" />
                                        </motion.button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 mb-6">
                                        <button
                                            onClick={() => {
                                                handleShareStorefront();
                                                setShowActionSheet(false);
                                            }}
                                            className={cn(
                                                'p-4 rounded-2xl border text-left transition-all active:scale-[0.99]',
                                                isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-emerald-300/30 hover:from-emerald-400 hover:to-sky-400 text-white shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-emerald-600/40 hover:from-emerald-500 hover:to-sky-500 text-white shadow-lg'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10">
                                                    <Share2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-black uppercase tracking-widest">Share storefront</p>
                                                    <p className="text-[12px] opacity-75 mt-1">Send your booking page to brands in one tap</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowActionSheet(false);
                                                setActiveTab('profile');
                                                setActiveSettingsPage('collab-link');
                                            }}
                                            className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
                                        >
                                            <p className={cn('text-[13px] font-bold', textColor)}>Edit storefront</p>
                                            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Update packages, proof, audience, and display settings</p>
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleCopyStorefront();
                                                setShowActionSheet(false);
                                            }}
                                            className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
                                        >
                                            <p className={cn('text-[13px] font-bold', textColor)}>Copy storefront link</p>
                                            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>creatorarmour.com/{username}</p>
                                        </button>

                                        <button
                                            onClick={() => { setShowActionSheet(false); window.open(`/${username}`, '_blank'); }}
                                            className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
                                        >
                                            <p className={cn('text-[13px] font-bold', textColor)}>Preview page</p>
                                            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>See what brands see before you share it</p>
                                        </button>

                                        <button
                                            onClick={() => { setShowActionSheet(false); setActiveTab('collabs'); setCollabSubTab('pending'); }}
                                            className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
                                        >
                                            <p className={cn('text-[13px] font-bold', textColor)}>Review offers</p>
                                            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Open pending brand requests and respond faster</p>
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all group", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center">
                                                    <QrCode className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                                </div>
                                                <p className={cn("font-bold text-[14px]", isDark ? "text-white" : "text-slate-900")}>Generate QR Code</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all group", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center">
                                                    <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                                </div>
                                                <p className={cn("font-bold text-[14px]", isDark ? "text-white" : "text-slate-900")}>Test Intake Form</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ─── ITEM DETAIL VIEW ─── */}
                {(() => {
                    const portalRoot = itemDetailPortalRoot;
                    const overlay = (
                        <AnimatePresence>
                            {selectedItem && (
                                <motion.div
                                    key="item-detail-overlay"
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 220, mass: 0.9 }}
                                    className="fixed inset-0 z-[1100] flex flex-col overflow-hidden isolate"
                                    style={{ backgroundColor: bgColor }}
                                >
                            {/* Solid base (prevents underlying collabs list bleeding through on iOS) */}
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: bgColor }} />

                            {/* Background gradient + blobs (match brand dashboard vibe) */}
                            {isDark ? (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
                                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
                                    <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-emerald-400/20 rounded-full blur-[140px]" />
                                    <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-sky-500/18 rounded-full blur-[160px]" />
                                    <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-emerald-500/12 rounded-full blur-[170px]" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
                                    <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(55%_45%_at_95%_10%,rgba(14,165,233,0.16),transparent_60%)]" />
                                </div>
                            )}

                            {/* Fixed Header */}
                            <div className={cn(
                                "px-5 py-3.5 flex items-center justify-between border-b sticky top-0 z-20",
                                isDark ? "bg-[#061318]/70 backdrop-blur-xl border-white/10" : "bg-white/95 backdrop-blur-md border-slate-100"
                            )}>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={closeItemDetail}
                                        className={cn("w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90", borderColor, isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-50")}
                                    >
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className={cn("text-[16px] font-bold tracking-tight leading-tight", textColor)}>
                                            {selectedType === 'deal' ? 'Deal Detail' : 'Offer Brief'}
                                        </h2>
                                        <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 leading-tight", textColor)}>
                                            {selectedItem.brand_name || selectedItem.raw?.brand_name || 'Brand Partner'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { triggerHaptic(); setShowItemMenu(true); }}
                                    className={cn("w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90", borderColor, isDark ? "bg-white/5" : "bg-white")}
                                >
                                    <MoreHorizontal className="w-4 h-4 opacity-40" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-40 relative z-10">

                                {/* ── COMPACT BRAND HERO ── */}
                                <div className={cn("rounded-3xl border p-5 mb-6 flex flex-col items-center text-center", cardBgColor, borderColor)}>
                                    <div className="flex flex-col items-center gap-2 mb-5 w-full">
                                        {/* Status Row */}
                                        <div className={cn("flex items-center px-3 py-1.5 rounded-full border shadow-sm mb-1",
                                            selectedType === 'deal'
                                                ? (isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")
                                                : (isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")
                                        )}>
                                            <span className={cn("text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5", selectedType === 'deal' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-amber-400' : 'text-amber-700'))}>
                                                {selectedType === 'deal' ? '🟢 Active Collaboration' : <><AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5}/> Awaiting Your Decision</>}
                                            </span>
                                        </div>

                                        {/* Campaign Type Tag */}
                                        {selectedItem.collab_type === 'barter' ? (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">Free Products</span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">Paid Campaign</span>
                                        )}

                                        {/* Hero Budget */}
                                        <p className={cn("text-[38px] font-black leading-none my-2 font-outfit tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                            {renderBudgetValue(selectedItem)} <span className={cn("text-[20px] font-bold opacity-60 ml-1", textColor)}>Offer</span>
                                        </p>

                                        {/* Deliverables */}
                                        <div className={cn("flex items-center justify-center flex-wrap gap-2 text-[14px] font-bold mt-1", isDark ? "text-slate-300" : "text-slate-600")}>
                                            {(() => {
                                                const raw = selectedItem.deliverables || selectedItem.raw?.deliverables;
                                                let items: string[] = ['🎬 1 Reel', '📱 2 Stories'];
                                                try {
                                                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                                        items = parsed.map((d: any) => {
                                                            if (typeof d === 'string') return d;
                                                            const ct = (d.contentType || d.type || '').toLowerCase();
                                                            const count = d.count || d.quantity || 1;
                                                            let emoji = '📋', label = 'Content';
                                                            if (ct.includes('reel')) { emoji = '🎬'; label = 'Reel'; }
                                                            else if (ct.includes('story')) { emoji = '📱'; label = 'Story'; }
                                                            else if (ct.includes('post')) { emoji = '🖼'; label = 'Post'; }
                                                            return `${emoji} ${count} ${label}`;
                                                        });
                                                    }
                                                } catch (_) { }
                                                return items.map((d, i) => (
                                                    <React.Fragment key={i}>
                                                        <span>{d}</span>
                                                        {i < items.length - 1 && <span className="opacity-40 px-1">•</span>}
                                                    </React.Fragment>
                                                ));
                                            })()}
                                        </div>

                                        {/* Deadline Top */}
                                        {selectedType === 'offer' && (() => {
                                            const rawDeadline = selectedItem.deadline || selectedItem.raw?.deadline;
                                            const deadline = rawDeadline ? new Date(rawDeadline) : null;
                                            if (!deadline || Number.isNaN(deadline.getTime())) {
                                                return <p className={cn("text-[12px] font-semibold mt-2", secondaryTextColor)}>No Deadline Set</p>;
                                            }
                                            return (
                                                <div className="flex items-center justify-center gap-1.5 mt-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full shadow-sm">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-black uppercase tracking-wider">Deadline: {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Brand Logo & Name */}
                                    <div className={cn("flex items-center justify-center gap-3 w-full border-t pt-5 mt-1", isDark ? "border-white/10" : "border-slate-100")}>
                                        <div className={cn("w-8 h-8 rounded-xl border overflow-hidden flex items-center justify-center shrink-0 shadow-sm",
                                            selectedItem.collab_type === 'barter'
                                                ? (isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100")
                                                : (isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200")
                                        )}>
                                            {getBrandIcon(
                                                selectedItem.brand_logo ||
                                                selectedItem.brand_logo_url ||
                                                selectedItem.logo_url ||
                                                selectedItem.raw?.brand_logo ||
                                                selectedItem.raw?.brand_logo_url ||
                                                selectedItem.raw?.logo_url ||
                                                (selectedItem as any)?.brand?.logo_url,
                                                selectedItem.category,
                                                selectedItem.brand_name || selectedItem.raw?.brand_name
                                            )}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <div className="flex items-center gap-1.5">
                                                <p className={cn("text-[14px] font-bold tracking-tight", textColor)}>
                                                    {selectedItem.brand_name || 'Brand Name'}
                                                </p>
                                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
                                            </div>
                                            <p className={cn("text-[10px] font-semibold mt-0.5", secondaryTextColor, isDark ? "" : "text-slate-500")}>Verified Brand</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── BRAND DETAILS (Progressive Disclosure) ── */}
                                <motion.div
                                    className={cn("rounded-xl border mb-5 overflow-hidden", cardBgColor, borderColor)}
                                    layout
                                >
                                    {/* Collapsed trigger */}
                                    <button
                                        onClick={() => { triggerHaptic(); setShowBrandDetails(v => !v); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity"
                                    >
                                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
                                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className={cn("text-[13px] font-bold leading-tight", textColor)}>Brand Information</p>
                                            <p className={cn("text-[11px] mt-0.5", secondaryTextColor)}>Verified Business · View Company Details</p>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: showBrandDetails ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRight className={cn("w-4 h-4", secondaryTextColor)} />
                                        </motion.div>
                                    </button>

                                    {/* Expanded content */}
                                    <AnimatePresence initial={false}>
                                        {showBrandDetails && (
                                            <motion.div
                                                key="brand-details"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className={cn("border-t mx-0", isDark ? "border-white/8" : "border-slate-100")} />

                                                {/* Trust badges */}
                                                <div className="px-4 pt-3 pb-2">
                                                    <p className={cn("text-[10px] font-black uppercase tracking-wider mb-2 opacity-40", textColor)}>Verified Identity</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {[
                                                            { icon: '✓', label: 'GST Verified', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                                                            { icon: '✓', label: 'Email Verified', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                                                            { icon: '✓', label: 'Domain Verified', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                                                        ].map((badge) => (
                                                            <span key={badge.label} className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border", badge.color)}>
                                                                {badge.icon} {badge.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Company info rows */}
                                                <div className="px-4 pb-3 space-y-0">
                                                    <p className={cn("text-[10px] font-black uppercase tracking-wider mb-2 opacity-40 pt-2", textColor)}>Company Details</p>
                                                    {[
                                                        { label: 'Company', value: selectedItem.company_name || selectedItem.brand_name || selectedItem.raw?.brand_name || 'Pronto Pvt Ltd' },
                                                        { label: 'GST', value: selectedItem.gst_number || selectedItem.brand_gstin || selectedItem.raw?.brand_gstin || '27ABCDE1234F1Z5' },
                                                        { label: 'Address', value: selectedItem.address || selectedItem.brand_address || selectedItem.raw?.brand_address || 'Mumbai, India' },
                                                        { label: 'Contact', value: selectedItem.contact_person || selectedItem.contact_name || selectedItem.raw?.contact_name || 'Brand Manager' },
                                                        { label: 'Email', value: selectedItem.contact_email || selectedItem.email || selectedItem.brand_email || selectedItem.raw?.brand_email || '—' },
                                                        { label: 'Phone', value: selectedItem.contact_phone || selectedItem.phone || selectedItem.brand_phone || selectedItem.raw?.brand_phone || '—' },
                                                    ].map((row, i) => (
                                                        <div key={i} className={cn("flex items-start justify-between py-2", i > 0 ? (isDark ? "border-t border-white/5" : "border-t border-slate-100") : "")}>
                                                            <span className={cn("text-[12px] shrink-0 w-16", secondaryTextColor)}>{row.label}</span>
                                                            <span className={cn("text-[12px] font-semibold text-right flex-1 ml-3", textColor)}>{row.value}</span>
                                                        </div>
                                                    ))}
                                                </div>


                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* ── DELIVERY TIMELINE (Offers) ── */}
                                {selectedType === 'offer' && (
                                    <div className="mb-6">
                                        <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Campaign Timeline</h4>
                                        <div className={cn("rounded-2xl border px-2 py-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                            <div className="flex items-center justify-between px-2 mb-4 text-[11px] font-black uppercase tracking-wider">
                                                <span className={isDark ? "text-blue-400" : "text-blue-600"}>Step 1 of 5</span>
                                                <span className={textColor}>Offer Received</span>
                                            </div>
                                            <div className="flex items-center justify-between px-2 relative">
                                                <div className={cn("absolute left-4 right-4 top-[6px] h-[3px] z-0 rounded-full", isDark ? "bg-white/10" : "bg-slate-100")} />
                                                <div className={cn("absolute left-4 w-1 top-[6px] h-[3px] z-0 rounded-full", isDark ? "bg-blue-500" : "bg-blue-500")} />
                                                {['Offer', 'Accept', 'Create', 'Submit', 'Payment'].map((step, i) => (
                                                    <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                        <div className={cn("w-[15px] h-[15px] rounded-full border-[3px]", 
                                                            i === 0 ? "bg-white border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] box-content" : (isDark ? "bg-[#111827] border-white/20" : "bg-white border-slate-200")
                                                        )} />
                                                        <span className={cn("text-[9px] font-bold uppercase", i === 0 ? (isDark ? "text-blue-400" : "text-blue-600") : "opacity-40")}>{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── CAMPAIGN BRIEF (Offers) ── */}
                                {selectedType === 'offer' && (
                                    <div className="mb-6">
                                        <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Campaign Brief</h4>
                                        <div className={cn("rounded-2xl border p-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                            <p className={cn("text-[13px] leading-relaxed font-semibold whitespace-pre-wrap", isDark ? "text-white/80" : "text-slate-700")}>
                                                {selectedItem.campaign_description || selectedItem.raw?.campaign_description || '—'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ── DELIVERABLES ── */}
                                <div className="mb-6">
                                    <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Deliverables</h4>
                                    <div className="flex flex-wrap gap-2.5">
                                        {(() => {
                                            const raw = selectedItem.deliverables || selectedItem.raw?.deliverables;
                                            let items: string[] = ['🎬 1 Instagram Reel', '📱 2 Stories'];
                                            try {
                                                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                if (Array.isArray(parsed) && parsed.length > 0) {
                                                    items = parsed.map((d: any) => {
                                                        if (typeof d === 'string') return d;
                                                        const ct = (d.contentType || d.type || '').toLowerCase();
                                                        const count = d.count || d.quantity || 1;
                                                        let emoji = '📋', label = 'Content';
                                                        if (ct.includes('reel')) { emoji = '🎬'; label = 'Instagram Reel'; }
                                                        else if (ct.includes('story')) { emoji = '📱'; label = 'Story'; }
                                                        else if (ct.includes('post')) { emoji = '🖼'; label = 'Static Post'; }
                                                        return `${emoji} ${count} ${label}`;
                                                    });
                                                }
                                            } catch (_) { }
                                            return items.map((d, i) => (
                                                <div key={i} className={cn(
                                                    "px-3.5 py-2.5 rounded-xl text-[14px] font-black border flex items-center gap-2 shadow-sm",
                                                    isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                                                )}>
                                                    {d}
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                {/* ── PRODUCT PREVIEW (IF BARTER) ── */}
                                {selectedRequiresShipping && (
                                    <div className="mb-6">
                                        <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Product Included</h4>
                                        <div className={cn("rounded-xl border p-3 flex items-center gap-4", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                            <div className="w-16 h-16 rounded-xl bg-orange-100 shrink-0 overflow-hidden border border-black/5">
                                                <img src={selectedItem.product_image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=300"} alt="Product" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className={cn("text-[14px] font-black leading-tight", textColor)}>{selectedItem.product_name || 'Signature Hoodie + Apparel Box'}</p>
                                                <p className={cn("text-[12px] font-semibold mt-1", secondaryTextColor)}>Product Value {renderBudgetValue(selectedItem)}</p>
                                                <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>Ships within 3 days</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedType === 'deal' && selectedRequiresShipping && (
                                    <div className="mb-6">
                                        <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Shipping</h4>
                                        <div className={cn("rounded-2xl border p-4 space-y-4", cardBgColor, borderColor)}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className={cn("text-[16px] font-black leading-tight", textColor)}>Product delivery</p>
                                                    <p className={cn("text-[12px] font-semibold mt-1", secondaryTextColor)}>
                                                        {selectedShippingStatus === 'shipped'
                                                            ? 'Track the package and confirm once it reaches you.'
                                                            : selectedShippingDelivered
                                                                ? 'Receipt confirmed. You can continue with the collaboration.'
                                                                : selectedShippingStatus === 'issue_reported'
                                                                    ? 'A shipping issue has been reported to the brand.'
                                                                    : 'Waiting for the brand to add courier and tracking details.'}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border",
                                                    selectedShippingDelivered
                                                        ? (isDark ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                                                        : selectedShippingStatus === 'shipped'
                                                            ? (isDark ? "bg-sky-500/10 text-sky-300 border-sky-500/20" : "bg-sky-50 text-sky-700 border-sky-200")
                                                            : selectedShippingStatus === 'issue_reported'
                                                                ? (isDark ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200")
                                                                : (isDark ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200")
                                                )}>
                                                    {selectedShippingDelivered ? 'RECEIVED' : selectedShippingStatus === 'shipped' ? 'SHIPPED' : selectedShippingStatus === 'issue_reported' ? 'ISSUE' : 'PENDING'}
                                                </span>
                                            </div>

                                            {(selectedItem.courier_name || selectedItem.tracking_number || selectedItem.tracking_url || selectedItem.expected_delivery_date) && (
                                                <div className={cn("rounded-2xl border p-4 space-y-3", isDark ? "bg-white/3 border-white/10" : "bg-white border-slate-200")}>
                                                    {selectedItem.courier_name && (
                                                        <div>
                                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Courier</p>
                                                            <p className={cn("text-[13px] font-semibold", textColor)}>{selectedItem.courier_name}</p>
                                                        </div>
                                                    )}
                                                    {selectedItem.tracking_number && (
                                                        <div>
                                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Tracking number</p>
                                                            <p className={cn("text-[13px] font-semibold break-all", textColor)}>{selectedItem.tracking_number}</p>
                                                        </div>
                                                    )}
                                                    {selectedItem.expected_delivery_date && (
                                                        <div>
                                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Expected delivery</p>
                                                            <p className={cn("text-[13px] font-semibold", textColor)}>
                                                                {new Date(selectedItem.expected_delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {selectedItem.tracking_url && (
                                                        <a
                                                            href={selectedItem.tracking_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={cn("inline-flex items-center gap-2 text-[13px] font-bold underline", isDark ? "text-sky-200" : "text-sky-700")}
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            Track package
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {selectedShippingStatus === 'shipped' && (
                                                <div className="grid grid-cols-1 gap-2.5">
                                                    <button
                                                        onClick={confirmSelectedProductReceived}
                                                        disabled={isConfirmingReceived}
                                                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-black text-[14px] transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                                                    >
                                                        {isConfirmingReceived ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                        Confirm Product Received
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            setShowReportIssueModal(true);
                                                        }}
                                                        className={cn("w-full py-3 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2", isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                        Report Shipping Issue
                                                    </button>
                                                </div>
                                            )}

                                            {selectedShippingStatus === 'pending' && (
                                                <div className={cn("rounded-2xl border p-4 flex items-start gap-3", isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                                                    <Package className={cn("w-5 h-5 mt-0.5", isDark ? "text-amber-300" : "text-amber-700")} />
                                                    <div>
                                                        <p className={cn("text-[13px] font-black", textColor)}>Waiting for shipping update</p>
                                                        <p className={cn("text-[12px] font-semibold mt-1", secondaryTextColor)}>
                                                            The brand still needs to submit the courier and tracking details.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedShippingStatus === 'issue_reported' && (
                                                <div className={cn("rounded-2xl border p-4 space-y-2", isDark ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50 border-rose-200")}>
                                                    <p className={cn("text-[13px] font-black", isDark ? "text-rose-200" : "text-rose-700")}>Issue reported</p>
                                                    {String(selectedItem?.shipping_issue_reason || '').trim() && (
                                                        <p className={cn("text-[12px] font-semibold whitespace-pre-wrap", isDark ? "text-rose-100/85" : "text-rose-700")}>
                                                            {String(selectedItem?.shipping_issue_reason || '').trim()}
                                                        </p>
                                                    )}
                                                    <a
                                                        href="/#/creator-contracts"
                                                        className={cn("inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider", isDark ? "text-rose-200" : "text-rose-700")}
                                                    >
                                                        <Flag className="w-4 h-4" />
                                                        Legal support
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── USAGE RIGHTS ── */}
                                <div className="mb-6">
                                    <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Usage Rights</h4>
                                    <div className={cn("rounded-2xl border p-4 flex flex-col gap-1", cardBgColor, borderColor)}>
                                        <p className={cn("text-[14px] font-black leading-tight", textColor)}>Organic social media only</p>
                                        <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>90 days limit</p>
                                    </div>
                                </div>

                                {selectedType !== 'offer' && (
                                <>
                                {/* ── PAYMENT ── */}
                                <div className="mb-6 grid grid-cols-2 gap-3">
                                    <div className={cn("rounded-2xl border p-4 flex flex-col justify-center", cardBgColor, borderColor)}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider mb-2 opacity-50", textColor)}>
                                            {selectedRequiresPayment ? 'Payment Method' : selectedRequiresShipping ? 'Fulfillment' : 'Deal Type'}
                                        </p>
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Landmark className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className={cn("text-[14px] font-black leading-tight", textColor)}>
                                                {selectedRequiresPayment ? <>UPI<br />Payout</> : selectedRequiresShipping ? <>Product<br />Shipping</> : <>Collab<br />Only</>}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={cn("rounded-2xl border p-4 flex flex-col justify-center", cardBgColor, borderColor)}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider mb-2 opacity-50", textColor)}>Deadline</p>
                                        {(() => {
                                            const rawDeadline = selectedItem.due_date || selectedItem.deadline;
                                            const d = rawDeadline ? new Date(rawDeadline) : new Date(Date.now() + 13 * 86400000);
                                            const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
                                            const deadlineColor = diff < 3 ? 'text-red-500' : diff < 7 ? 'text-orange-500' : 'text-blue-500';
                                            const deadlineStr = rawDeadline
                                                ? new Date(rawDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : '21 Mar 2026';
                                            return (
                                                <>
                                                    <span className={cn("text-[14px] font-black leading-tight mb-2", textColor)}>
                                                        {deadlineStr}
                                                    </span>
                                                    <span className={cn("text-[11px] font-black tracking-tight flex items-center mt-1", deadlineColor)}>
                                                        ⚡ {diff > 0 ? `${diff} days remaining` : 'Overdue'}
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* ── CONTRACT DETAILS ── */}
                                <div ref={contractSectionRef} className="mb-6 scroll-mt-24">
                                    <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Contract Details</h4>
                                    <div className={cn("rounded-2xl border p-4", cardBgColor, borderColor)}>
                                        {(() => {
                                            const status = String(selectedItem.status || '').toLowerCase();
                                            const hasContract = Boolean(selectedItem.contract_file_url || selectedItem.signed_contract_url || selectedItem.safe_contract_url);
                                            const signedAt = selectedItem.signed_at || selectedItem.creator_signed_at || selectedItem.brand_signed_at || selectedItem.raw?.signed_at || null;
                                            const contractUrl = selectedItem.contract_file_url || selectedItem.signed_contract_url || selectedItem.safe_contract_url || '';
                                            const contractName = contractUrl
                                                ? decodeURIComponent(contractUrl.split('/').pop() || 'collaboration-contract.pdf')
                                                : 'Contract is being prepared';
                                            const contractState = status.includes('signed')
                                                ? 'Signed and active'
                                                : hasContract
                                                    ? 'Ready for review'
                                                    : (status === 'drafting' || status === 'brand_details_pending')
                                                        ? 'Brand is preparing the contract'
                                                        : 'Contract details unavailable';

                                            return (
                                                <>
                                                    <div className="flex items-start justify-between gap-3 mb-4">
                                                        <div>
                                                            <p className={cn("text-[16px] font-black leading-tight", textColor)}>{contractState}</p>
                                                            <p className={cn("text-[12px] font-semibold mt-1", secondaryTextColor)}>
                                                                {signedAt
                                                                    ? `Signed on ${new Date(signedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                                    : hasContract
                                                                        ? 'Your contract is ready to review and download.'
                                                                        : 'The contract will appear here once the brand finalizes the setup.'}
                                                            </p>
                                                        </div>
                                                        <span className={cn(
                                                            "px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border",
                                                            status.includes('signed')
                                                                ? (isDark ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                                                                : hasContract
                                                                    ? (isDark ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200")
                                                                    : (isDark ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200")
                                                        )}>
                                                            {status.includes('signed') ? 'Signed' : hasContract ? 'Ready' : 'Pending'}
                                                        </span>
                                                    </div>

                                                    <div className={cn("rounded-2xl border px-4 py-3 mb-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200")}>
                                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Document</p>
                                                        <p className={cn("text-[13px] font-bold break-all", textColor)}>{contractName}</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        <button
                                                            onClick={() => { triggerHaptic(); openDealContractReview(selectedItem); }}
                                                            className={cn(
                                                                "w-full py-3 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98]",
                                                                isDark ? "bg-white text-[#0B0F14] border-white" : "bg-slate-900 text-white border-slate-900"
                                                            )}
                                                        >
                                                            Open Contract
                                                        </button>
                                                        <button
                                                            onClick={() => { triggerHaptic(); copySelectedItemLink(); }}
                                                            className={cn(
                                                                "w-full py-3 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98]",
                                                                isDark ? "bg-white/5 text-white border-white/10" : "bg-white text-slate-900 border-slate-200"
                                                            )}
                                                        >
                                                            Copy Deal Link
                                                        </button>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                </>
                                )}

                                {/* ── LEGAL PROTECTION ── */}
                                <div className="mb-6">
                                    <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Legal Protection</h4>
                                    <div className={cn(
                                        "rounded-2xl border p-4 relative overflow-hidden",
                                        isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                                    )}>
                                        <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500 rounded-r-full" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

                                        <div className="flex items-center gap-3 relative">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
                                                <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("font-black text-[14px] leading-tight", isDark ? "text-emerald-200" : "text-emerald-700")}>Protected by Creator Armour</p>
                                                <p className={cn("text-[11px] font-semibold mt-0.5", isDark ? "text-emerald-100/70" : "text-emerald-800/80")}>Contract + rights + dispute support</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 relative z-10">
                                            {[
                                                'Contract auto-generated',
                                                'Content rights secured',
                                                'Dispute protection included',
                                            ].map((t) => (
                                                <div key={t} className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span className={cn("text-[12px] font-bold", isDark ? "text-emerald-100/85" : "text-emerald-800/90")}>{t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── EARNINGS BREAKDOWN (Offers) ── */}
                                {selectedType === 'offer' && (
                                    <div className="mb-6">
                                        <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Earnings Breakdown</h4>
                                        <div className={cn("rounded-2xl border p-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                            <div className="mb-5">
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider mb-1", isDark ? "text-emerald-400" : "text-emerald-600")}>You Receive</p>
                                                <p className={cn("text-[32px] font-black leading-none", textColor)}>{renderBudgetValue(selectedItem)}</p>
                                            </div>

                                            <div className="space-y-2.5 text-[12px]">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("font-medium opacity-70", textColor)}>Offer budget</span>
                                                    <span className={cn("font-bold", textColor)}>{renderBudgetValue(selectedItem)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("font-medium opacity-70", textColor)}>Platform fee</span>
                                                    <span className={cn("font-bold text-emerald-500")}>₹0</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-500/10">
                                                    <span className={cn("font-medium opacity-70", textColor)}>Payment Method</span>
                                                    <span className={cn("font-bold", textColor)}>Bank Transfer</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── STICKY CTA BAR ── */}
                            <div className={cn(
                                "sticky bottom-0 left-0 right-0 px-5 pb-8 pt-4 border-t",
                                isDark ? "bg-[#0B0F14]/98 backdrop-blur-xl border-white/10" : "bg-white/98 backdrop-blur-xl border-slate-100"
                            )}>
                                <div className="space-y-2.5">
	                                    <motion.button
	                                        whileTap={{ scale: 0.97 }}
	                                        onClick={() => {
	                                            if (selectedType === 'offer') {
	                                                if (selectedItem.isDemo) {
                                                    toast.success("This is a demo offer! Complete your profile to get real brand deals.");
                                                    triggerHaptic(HapticPatterns.success);
                                                    return;
	                                                }
	                                                handleAccept(selectedItem);
	                                            } else {
	                                                const cta = getDealPrimaryCta({ role: 'creator', deal: selectedItem });
	                                                triggerHaptic();

	                                                if (cta.disabled) return;

	                                                if (cta.action === 'mark_delivered' || cta.action === 'upload_revision') {
	                                                    setShowDeliverContentModal(true);
	                                                    return;
	                                                }

	                                                if (cta.action === 'review_sign_contract') {
	                                                    setCreatorSigningStep('send');
	                                                    setCreatorOTP('');
	                                                    setShowCreatorSigningModal(true);
	                                                    return;
	                                                }

	                                                if (cta.action === 'start_working') {
	                                                    // Move deal into "working" state without showing the progress sheet.
	                                                    void handleProgressStageSelect('content_making');
	                                                    return;
	                                                }

	                                                if (cta.action === 'view_contract') {
	                                                    contractSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	                                                    return;
	                                                }

	                                                // Default: show progress/actions sheet (creator control panel).
	                                                setShowProgressSheet(true);
	                                            }
	                                        }}
	                                        disabled={processingDeal === selectedItem.id || (selectedType !== 'offer' && getDealPrimaryCta({ role: 'creator', deal: selectedItem }).disabled)}
	                                        className={cn(
	                                            "w-full py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all flex flex-col items-center justify-center active:scale-[0.98] border disabled:opacity-50",
	                                            selectedType === 'offer'
	                                                ? (selectedItem.collab_type === 'barter' ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/30" : "bg-blue-600 text-white border-blue-500 shadow-blue-500/30")
	                                                : cn(
	                                                    dealPrimaryCtaButtonClass(getDealPrimaryCta({ role: 'creator', deal: selectedItem }).tone),
	                                                    isDark ? "border-white/10" : "border-slate-200"
	                                                  )
	                                        )}
	                                    >
                                        {processingDeal === selectedItem.id ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : selectedType === 'offer' ? (
                                            <>
                                                <span className="text-[17px] font-black leading-tight">
                                                    Accept Offer {renderBudgetValue(selectedItem)}
                                                </span>
                                                <span className="text-[11px] font-semibold opacity-85 mt-0.5 leading-tight">
                                                    Contract generated instantly
                                                </span>
                                            </>
	                                        ) : (
	                                            <span className="text-[16px] font-black">
	                                                {getDealPrimaryCta({ role: 'creator', deal: selectedItem }).label}
	                                            </span>
	                                        )}
	                                    </motion.button>

                                    {selectedType === 'offer' && (
                                        <div className="flex flex-col gap-2.5 mt-3 pt-3">
                                            <button
                                                onClick={() => {
                                                    triggerHaptic();
                                                    if (selectedItem.isDemo) {
                                                        toast.info("This is a demo offer! 😉");
                                                        return;
                                                    }
                                                    toast.success("Messaging thread opened");
                                                }}
                                                className={cn("w-full py-3 rounded-2xl flex items-center justify-center gap-2 border transition-all active:scale-95",
                                                    isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800")}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="font-bold text-[14px]">Ask Brand Question</span>
                                            </button>
                                            
                                            <div className="flex gap-2.5">
                                                <button
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        if (selectedItem.isDemo) {
                                                            toast.info("You can't counter a demo offer! 😉");
                                                            return;
                                                        }
                                                        navigate(`/collab-requests/${selectedItem.id}/counter`, { state: { request: selectedItem.raw || selectedItem } });
                                                    }}
                                                    className={cn("flex-1 py-3 border-none flex items-center justify-center gap-1.5 transition-all active:scale-95")}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 opacity-50 text-slate-400" /> 
                                                    <span className={cn("font-bold text-[13px] opacity-70", isDark ? "text-white" : "text-slate-600")}>Suggest New Price</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        if (selectedItem.isDemo) {
                                                            toast.info("You can't decline a demo offer! 😉");
                                                            return;
                                                        }
                                                        if (onDeclineRequest) onDeclineRequest(selectedItem.id);
                                                        closeItemDetail();
                                                    }}
                                                    className={cn("flex-1 py-3 border-none flex items-center justify-center gap-1.5 transition-all active:scale-95 text-red-500/80")}
                                                >
                                                    <XCircle className="w-3.5 h-3.5 opacity-50 text-red-500/60" /> 
                                                    <span className="font-bold text-[13px] opacity-90">Decline Offer</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Item menu (three-dots) */}
                            <AnimatePresence>
                                {showItemMenu && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setShowItemMenu(false)}
                                            className="fixed inset-0 z-[20100] bg-black/40 backdrop-blur-md"
                                        />
                                        <motion.div
                                            initial={{ y: '100%' }}
                                            animate={{ y: 0 }}
                                            exit={{ y: '100%' }}
                                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                                            className={cn(
                                                "fixed bottom-0 inset-x-0 z-[20110] rounded-t-[2.25rem] border-t p-5 pb-safe shadow-2xl",
                                                isDark ? "bg-[#0F172A] border-white/10" : "bg-white border-slate-200"
                                            )}
                                        >
                                            <div className="w-12 h-1 bg-slate-500/20 rounded-full mx-auto mb-5" />
                                            <div className="max-w-md mx-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="min-w-0">
                                                        <p className={cn("text-[11px] font-black uppercase tracking-[0.18em] opacity-40", textColor)}>Options</p>
                                                        <p className={cn("text-[16px] font-extrabold tracking-tight truncate", textColor)}>
                                                            {selectedType === 'deal' ? 'Deal actions' : 'Offer actions'}
                                                        </p>
                                                    </div>
                                                    <motion.button
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={() => setShowItemMenu(false)}
                                                        className={cn("w-10 h-10 rounded-full flex items-center justify-center border", borderColor, isDark ? "bg-white/5" : "bg-slate-50")}
                                                    >
                                                        <X className={cn("w-4 h-4", textColor)} />
                                                    </motion.button>
                                                </div>

                                                <div className={cn("rounded-2xl border overflow-hidden", borderColor)}>
                                                    <button
                                                        onClick={async () => { triggerHaptic(); await copySelectedItemLink(); setShowItemMenu(false); }}
                                                        className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-50")}
                                                    >
                                                        <span className="flex items-center gap-3">
                                                            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}>
                                                                <Copy className={cn("w-4 h-4", isDark ? "text-emerald-300" : "text-emerald-700")} />
                                                            </span>
                                                            <span>
                                                                <p className={cn("text-[14px] font-bold", textColor)}>Copy link</p>
                                                                <p className={cn("text-[12px] opacity-60", textColor)}>Share this offer/deal</p>
                                                            </span>
                                                        </span>
                                                        <ChevronRight className={cn("w-4 h-4 opacity-40", textColor)} />
                                                    </button>
                                                    <div className={cn("h-px", isDark ? "bg-white/10" : "bg-slate-100")} />
                                                    <button
                                                        onClick={async () => { triggerHaptic(); await shareSelectedItemLink(); setShowItemMenu(false); }}
                                                        className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-50")}
                                                    >
                                                        <span className="flex items-center gap-3">
                                                            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}>
                                                                <Share2 className={cn("w-4 h-4", isDark ? "text-sky-300" : "text-sky-700")} />
                                                            </span>
                                                            <span>
                                                                <p className={cn("text-[14px] font-bold", textColor)}>Share</p>
                                                                <p className={cn("text-[12px] opacity-60", textColor)}>Send via WhatsApp, etc.</p>
                                                            </span>
                                                        </span>
                                                        <ChevronRight className={cn("w-4 h-4 opacity-40", textColor)} />
                                                    </button>
                                                    <div className={cn("h-px", isDark ? "bg-white/10" : "bg-slate-100")} />

                                                    {selectedType === 'deal' && (() => {
                                                        const statusLower = String(selectedItem?.status || '').toLowerCase();
                                                        const isCompleted = statusLower.includes('completed') || statusLower === 'paid';
                                                        if (isCompleted) return null;

                                                        return (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        triggerHaptic();
                                                                        setShowItemMenu(false);
                                                                        setShowProgressSheet(true);
                                                                    }}
                                                                    className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-50")}
                                                                >
                                                                    <span className="flex items-center gap-3">
                                                                        <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}>
                                                                            <TrendingUp className={cn("w-4 h-4", isDark ? "text-purple-300" : "text-purple-700")} />
                                                                        </span>
                                                                        <span>
                                                                            <p className={cn("text-[14px] font-bold", textColor)}>Update progress</p>
                                                                            <p className={cn("text-[12px] opacity-60", textColor)}>Move the deal to the next stage</p>
                                                                        </span>
                                                                    </span>
                                                                    <ChevronRight className={cn("w-4 h-4 opacity-40", textColor)} />
                                                                </button>
                                                                <div className={cn("h-px", isDark ? "bg-white/10" : "bg-slate-100")} />
                                                            </>
                                                        );
                                                    })()}

                                                    <button
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            const path = getSelectedItemUrl();
                                                            if (path) navigate(path);
                                                            else toast.error('No page available for this item.');
                                                            setShowItemMenu(false);
                                                        }}
                                                        className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-50")}
                                                    >
                                                        <span className="flex items-center gap-3">
                                                            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}>
                                                                <Eye className={cn("w-4 h-4", isDark ? "text-white/80" : "text-slate-700")} />
                                                            </span>
                                                            <span>
                                                                <p className={cn("text-[14px] font-bold", textColor)}>Open full page</p>
                                                                <p className={cn("text-[12px] opacity-60", textColor)}>View outside the dashboard</p>
                                                            </span>
                                                        </span>
                                                        <ChevronRight className={cn("w-4 h-4 opacity-40", textColor)} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    );
                    return portalRoot ? createPortal(overlay, portalRoot) : overlay;
                })()}
            </div>

            {/* Deal Progress Update Sheet (portaled so it appears above the in-dashboard deal detail overlay) */}
            {typeof document !== 'undefined' &&
                createPortal(
                    <ProgressUpdateSheet
                        isOpen={showProgressSheet}
                        onClose={() => setShowProgressSheet(false)}
                        currentStage={currentDealStage}
                        onStageSelect={handleProgressStageSelect}
                        isLoading={Boolean((updateDealProgress as any)?.isPending ?? (updateDealProgress as any)?.isLoading)}
                    />,
                    document.body
                )}

            {/* Creator: Deliver content / upload revision */}
            <Dialog open={showDeliverContentModal} onOpenChange={setShowDeliverContentModal}>
                <DialogContent
                    className={cn(
                        "sm:max-w-[520px] border-white/10 rounded-[2rem] p-0 overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain",
                        isDark ? "bg-[#0B0F14] text-white shadow-black/60" : "bg-white text-slate-900 shadow-slate-200"
                    )}
                >
                    <DialogHeader>
                        <DialogTitle className={cn("flex items-center gap-2 px-6 pt-6 text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
	                            <Send className="w-6 h-6 text-emerald-500" />
	                            {String(selectedItem?.status || '').toLowerCase().includes('revision_requested') ||
	                            String(selectedItem?.status || '').toLowerCase().includes('changes_requested') ||
	                            String((selectedItem as any)?.brand_approval_status || '').toLowerCase().includes('changes_requested')
	                                ? 'Upload Revision'
	                                : 'Deliver Content'}
	                        </DialogTitle>
	                        <DialogDescription className={cn("px-6 pb-2 text-sm font-medium leading-relaxed opacity-60", isDark ? "text-white" : "text-slate-900")}>
	                            Paste your content link(s) so the brand can review and approve. Use Instagram or Google Drive links — no uploads needed.
		                        </DialogDescription>
		                    </DialogHeader>

                    <div className="px-6 py-5 space-y-5">
	                        {String((selectedItem as any)?.brand_feedback || '').trim() && (
	                            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-200")}>
	                                <p className={cn("text-[11px] font-black uppercase tracking-[0.14em] opacity-70", isDark ? "text-rose-200" : "text-rose-700")}>Revision note from brand</p>
	                                <p className={cn("mt-2 text-[13px] font-semibold whitespace-pre-wrap", isDark ? "text-rose-100/90" : "text-rose-700")}>
	                                    {String((selectedItem as any)?.brand_feedback || '').trim()}
	                                </p>
	                            </div>
		                        )}
		                        <div className="space-y-2">
		                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-white/70" : "text-slate-900/60")}>
		                                Main Content Link (Required)
		                            </label>
		                            <input
		                                value={deliverContentUrlDraft}
		                                onChange={(e) => setDeliverContentUrlDraft(e.target.value)}
		                                placeholder="Paste Instagram/Drive link (full URL)"
		                                className={cn(
		                                    "w-full rounded-2xl px-4 py-3.5 text-[13px] font-semibold outline-none transition-all border",
		                                    isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50"
		                                )}
		                                inputMode="url"
		                                autoComplete="url"
		                                autoCapitalize="none"
		                                autoCorrect="off"
		                            />
		                            <p className={cn("text-[11px] font-semibold px-1", isDark ? "text-white/45" : "text-slate-500")}>
		                                Examples: `instagram.com/reel/...` or `drive.google.com/...`
		                            </p>
		                        </div>

		                        <div className="space-y-2">
		                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-white/70" : "text-slate-900/60")}>
		                                Content Status (Required)
		                            </label>
		                            <div className={cn("grid grid-cols-2 gap-2 rounded-2xl p-1 border", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
		                                <button
		                                    type="button"
		                                    onClick={() => setDeliverContentStatusDraft('draft')}
		                                    className={cn(
		                                        "h-14 rounded-2xl font-black text-[12px] transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight",
		                                        deliverContentStatusDraft === 'draft'
		                                            ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.20)] ring-1 ring-white/10"
		                                            : isDark ? "text-white/85 hover:bg-white/5" : "text-slate-800 hover:bg-white"
		                                    )}
		                                    aria-pressed={deliverContentStatusDraft === 'draft'}
		                                >
		                                    <span>Draft for review</span>
		                                    <span className={cn("text-[10px] font-bold opacity-75", deliverContentStatusDraft === 'draft' ? "text-white/90" : isDark ? "text-white/55" : "text-slate-500")}>
		                                        Not posted yet
		                                    </span>
		                                </button>
		                                <button
		                                    type="button"
		                                    onClick={() => setDeliverContentStatusDraft('posted')}
		                                    className={cn(
		                                        "h-14 rounded-2xl font-black text-[12px] transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight",
		                                        deliverContentStatusDraft === 'posted'
		                                            ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.20)] ring-1 ring-white/10"
		                                            : isDark ? "text-white/85 hover:bg-white/5" : "text-slate-800 hover:bg-white"
		                                    )}
		                                    aria-pressed={deliverContentStatusDraft === 'posted'}
		                                >
		                                    <span>Already posted</span>
		                                    <span className={cn("text-[10px] font-bold opacity-75", deliverContentStatusDraft === 'posted' ? "text-white/90" : isDark ? "text-white/55" : "text-slate-500")}>
		                                        Live on profile
		                                    </span>
		                                </button>
		                            </div>
		                        </div>
		
		                        <div className="space-y-2">
		                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-white/70" : "text-slate-900/60")}>
		                                Caption (Optional)
		                            </label>
		                            <textarea
		                                value={deliverCaptionDraft}
                                onChange={(e) => setDeliverCaptionDraft(e.target.value)}
                                placeholder="Paste your caption here..."
                                className={cn(
                                    "w-full min-h-[88px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none transition-all border resize-none",
                                    isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50"
                                )}
		                            />
		                        </div>

		                        <div className="space-y-2">
		                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-white/70" : "text-slate-900/60")}>
		                                Additional Links (Optional)
		                            </label>
		                            <textarea
		                                value={deliverAdditionalLinksDraft}
		                                onChange={(e) => setDeliverAdditionalLinksDraft(e.target.value)}
		                                placeholder={"Add any extra links (one per line)\nhttps://drive.google.com/...\nhttps://instagram.com/p/..."}
		                                className={cn(
		                                    "w-full min-h-[88px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none transition-all border resize-none",
		                                    isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50"
		                                )}
		                            />
		                        </div>

		                        <div className="space-y-2">
		                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-white/70" : "text-slate-900/60")}>
		                                Message to Brand (Optional)
		                            </label>
		                            <textarea
		                                value={deliverMessageDraft}
		                                onChange={(e) => setDeliverMessageDraft(e.target.value)}
		                                placeholder="Any context for review (timelines, instructions, etc.)"
		                                className={cn(
		                                    "w-full min-h-[72px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none transition-all border resize-none",
		                                    isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50"
		                                )}
		                            />
		                        </div>
                    </div>

                    <div className={cn(
                        "sticky bottom-0 border-t px-6 backdrop-blur",
                        isDark ? "bg-[#0B0F14]/92 border-white/10" : "bg-white/92 border-slate-200"
                    )}>
                        <div className="grid grid-cols-2 gap-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                            <button
                                onClick={() => {
                                    triggerHaptic();
                                    setShowDeliverContentModal(false);
                                }}
                                disabled={isSubmittingContent}
                                className={cn(
                                    "h-12 rounded-2xl font-black text-[12px] border transition-all active:scale-[0.98] disabled:opacity-60",
                                    isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitDealContent}
                                disabled={isSubmittingContent}
                                className={cn(
                                    "h-12 rounded-2xl font-black text-[12px] transition-all active:scale-[0.98] disabled:opacity-60",
                                    "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-[0_12px_38px_rgba(16,185,129,0.22)]"
                                )}
                            >
                                {isSubmittingContent ? 'Submitting…' : 'Submit Content'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showReportIssueModal}
                onOpenChange={(open) => {
                    setShowReportIssueModal(open);
                    if (!open) setReportIssueReason('');
                }}
            >
                <DialogContent
                    className={cn(
                        "sm:max-w-[520px] border-white/10 rounded-[2rem] p-0 overflow-hidden shadow-2xl",
                        isDark ? "bg-[#0B0F14] text-white shadow-black/60" : "bg-white text-slate-900 shadow-slate-200"
                    )}
                >
                    <DialogHeader>
                        <DialogTitle className={cn("flex items-center gap-2 px-6 pt-6 text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                            <AlertCircle className="w-6 h-6 text-rose-500" />
                            Report Shipping Issue
                        </DialogTitle>
                        <DialogDescription className={cn("px-6 pb-2 text-sm font-medium leading-relaxed opacity-60", isDark ? "text-white" : "text-slate-900")}>
                            Describe what went wrong so the brand can fix the shipment quickly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 pb-6 space-y-4">
                        <textarea
                            value={reportIssueReason}
                            onChange={(e) => setReportIssueReason(e.target.value)}
                            placeholder="Wrong product, damaged item, package not received..."
                            rows={5}
                            className={cn(
                                "w-full rounded-2xl px-4 py-3.5 text-[13px] font-semibold outline-none transition-all border resize-none",
                                isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-rose-500/50" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-rose-500/50"
                            )}
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={() => {
                                    setShowReportIssueModal(false);
                                    setReportIssueReason('');
                                }}
                                className={cn("h-12 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98]", isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={reportSelectedShippingIssue}
                                disabled={isReportingIssue || !reportIssueReason.trim()}
                                className="h-12 rounded-2xl bg-rose-600 text-white text-[14px] font-black transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isReportingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Report Issue
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Creator Signing Modal */}
            <Dialog open={showCreatorSigningModal} onOpenChange={setShowCreatorSigningModal}>
                <DialogContent className={cn("sm:max-w-[440px] border-white/10 rounded-[2rem] p-0 overflow-hidden shadow-2xl", isDark ? "bg-[#0B0F14] text-white shadow-black/60" : "bg-white text-slate-900 shadow-slate-200")}>
                    <DialogHeader>
                        <DialogTitle className={cn("flex items-center gap-2 px-6 pt-6 text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            Sign Agreement
                        </DialogTitle>
                        <DialogDescription className={cn("px-6 pb-2 text-sm font-medium leading-relaxed opacity-60", isDark ? "text-white" : "text-slate-900")}>
                            {creatorSigningStep === 'send'
                                ? 'We will send a secure OTP to your registered email to verify your identity and sign the contract.'
                                : 'Enter the 6-digit code sent to your email to complete the signing process.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5">
                        {creatorSigningStep === 'send' ? (
                            <div className="space-y-6">
                                <div className={cn("p-4 rounded-2xl flex items-start gap-3 border", 
                                    isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-100")}>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold tracking-tight">OTP Verification</p>
                                        <p className="text-[12px] opacity-60 font-medium truncate mt-0.5">
                                            Signing as: <span className="font-bold opacity-100">{profile?.email || 'Your registered email'}</span>
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={handleSendCreatorOTP}
                                    disabled={isSendingCreatorOTP}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
                                >
                                    {isSendingCreatorOTP ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            Send OTP to Email
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-1">Verification Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="······"
                                        value={creatorOTP}
                                        onChange={(e) => setCreatorOTP(e.target.value.replace(/\D/g, ''))}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        className={cn(
                                            "w-full rounded-2xl px-4 py-5 text-center text-4xl tracking-[0.3em] font-black font-outfit focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:opacity-20 border",
                                            isDark ? "bg-white/5 border-white/10 text-white focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500/50"
                                        )}
                                    />
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[11px] font-bold opacity-40 italic">Exp. in 10 minutes</p>
                                        <button
                                            onClick={() => {
                                                setCreatorSigningStep('send');
                                                setCreatorOTP('');
                                            }}
                                            disabled={isVerifyingCreatorOTP || isSigningAsCreator}
                                            className="text-[11px] font-black uppercase tracking-widest text-emerald-500 hover:opacity-70 transition-opacity"
                                        >
                                            Resend
                                        </button>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={handleVerifyCreatorOTP}
                                    disabled={isVerifyingCreatorOTP || creatorOTP.length !== 6 || isSigningAsCreator}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
                                >
                                    {isVerifyingCreatorOTP || isSigningAsCreator ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {isSigningAsCreator ? 'Signing Contract...' : 'Verifying...'}
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Complete & Sign
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </div>

                    <div className={cn("flex items-center gap-2 text-[10px] font-bold opacity-40 border-t px-6 py-5", isDark ? "border-white/5" : "border-slate-100")}>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Aadhar Verified · Secure E-signature by Creator Armour</span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* iOS install guide for push notifications */}
            <Dialog open={showPushInstallGuide} onOpenChange={setShowPushInstallGuide}>
                <DialogContent className={cn("sm:max-w-[440px] border-white/15 text-white rounded-2xl p-0 overflow-hidden shadow-2xl shadow-black/60", isDark ? "bg-neutral-950/98" : "bg-slate-900")}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 px-6 pt-6 text-2xl font-semibold tracking-tight text-white">
                            <Bell className="w-5 h-5 text-emerald-300" />
                            Enable Deal Alerts
                        </DialogTitle>
                        <DialogDescription className="text-neutral-300 px-6 pb-2 text-base leading-relaxed">
                            On iPhone and iPad, push notifications work only when CreatorArmour is installed to your Home Screen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5 space-y-3">
                        <div className="p-4 bg-emerald-500/12 border border-emerald-400/30 rounded-xl">
                            <p className="text-sm font-semibold text-emerald-100">How to install</p>
                            <ol className="mt-2 space-y-1 text-sm text-white/80 list-decimal pl-5">
                                <li>Tap the Share button in Safari</li>
                                <li>Select “Add to Home Screen”</li>
                                <li>Open CreatorArmour from your Home Screen</li>
                            </ol>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowPushInstallGuide(false)}
                                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-3 transition-colors"
                            >
                                Got it
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPushInstallGuide(false)}
                                className="rounded-xl border border-white/20 text-white/85 hover:text-white hover:bg-white/10 text-sm px-4 py-3 transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ─── PAYMENT DETAILS PANEL (root level – no transform parent interference) ─── */}
            <AnimatePresence>
                {selectedPayment && (() => {
                    const pay = selectedPayment;
                    const isPaid = (pay.status || '').toLowerCase().includes('paid') || (pay.status || '').toLowerCase().includes('complete');
	                    const dueDate = pay.due_date || pay.payment_expected_date || pay.deadline;
                    const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                    const daysPast = dueDate ? Math.ceil((Date.now() - new Date(dueDate).getTime()) / 86400000) : 0;
                    const invoiceId = pay.invoice_id || pay.id?.slice(0, 8).toUpperCase() || 'CA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
                    const signedDate = pay.contract_signed_at || pay.created_at;
                    const signedDateStr = signedDate ? new Date(signedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

                    const timelineSteps = [
                        { label: 'Deal accepted', done: true },
                        { label: 'Contract generated', done: true },
                        { label: 'Content submitted', done: !!(pay.submission_link || pay.content_url) },
                        { label: 'Payment pending', done: isPaid, active: !isPaid },
                        { label: isPaid ? 'Payment received' : (daysPast > 0 ? 'Payment overdue' : 'Payment due soon'), done: isPaid, warn: !isPaid && daysPast > 0 },
                    ];

                    return (
                        <motion.div
                            key="payment-detail"
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                            className={cn(
                                "fixed inset-0 z-[9999] flex flex-col",
                                isDark ? "bg-[#0B0F14]" : "bg-[#F9FAFB]"
                            )}
                        >
                            {/* Header */}
                            <div className={cn(
                                "px-5 py-3.5 flex items-center justify-between border-b",
                                isDark ? "bg-[#0B0F14] border-white/10" : "bg-white border-slate-100"
                            )}>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { triggerHaptic(); setSelectedPayment(null); }}
                                        className={cn("w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90", borderColor, isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-50")}
                                    >
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className={cn("text-[16px] font-bold tracking-tight leading-tight", textColor)}>Payment Details</h2>
                                        <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 leading-tight", textColor)}>{pay.brand_name || 'Brand'}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border",
                                    isPaid
                                        ? (isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700")
                                        : (isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600")
                                )}>
                                    {isPaid ? 'Paid' : 'Overdue'}
                                </span>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-40 space-y-4">

                                {/* ── BRAND HEADER ── */}
                                <div className={cn("rounded-2xl border p-4 flex items-start gap-4", cardBgColor, borderColor)}>
                                    <div className={cn("w-14 h-14 rounded-2xl border overflow-hidden flex items-center justify-center shrink-0",
                                        isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                                    )}>
                                        {getBrandIcon(pay.brand_logo_url || pay.logo_url, pay.category, pay.brand_name)}
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("text-[20px] font-black tracking-tight leading-tight", textColor)}>{pay.brand_name || 'Brand'}</p>
                                        <div className="flex items-center gap-1.5 mt-1 mb-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
                                            <span className="text-[12px] font-bold text-blue-500">Verified Brand</span>
                                        </div>
                                        <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>
                                            {pay.campaign_name || pay.title || 'Instagram Reel Campaign'}
                                        </p>
                                    </div>
                                </div>

                                {/* ── PAYMENT STATUS CARD ── */}
                                <div className={cn(
                                    "rounded-2xl border p-5 relative overflow-hidden",
                                    isPaid
                                        ? (isDark ? "bg-emerald-500/5 border-emerald-500/25" : "bg-emerald-50 border-emerald-200")
                                        : (isDark ? "bg-red-500/5 border-red-500/25" : "bg-red-50 border-red-200")
                                )}>
                                    <div className="absolute inset-y-0 left-0 w-1 rounded-r-full" style={{ background: isPaid ? '#10b981' : '#ef4444' }} />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    <div className="relative">
	                                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isPaid ? (isDark ? "text-emerald-400/70" : "text-emerald-700/70") : (isDark ? "text-red-400/70" : "text-red-600/70"))}>
	                                            Payment Status
	                                        </p>
	                                        <p className={cn("text-[22px] font-black leading-tight mb-0.5", isPaid ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-red-400" : "text-red-600"))}>
	                                            {isPaid ? 'RECEIVED' : (daysPast > 0 ? 'OVERDUE' : 'PENDING')}
	                                        </p>
	                                        <p className={cn("text-3xl font-black font-outfit mb-3", textColor)}>{renderBudgetValue(pay)}</p>
	                                        {isPaid ? (
	                                            <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>Paid on {dueDateStr}</p>
	                                        ) : (
	                                            <div className="space-y-1">
	                                                <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>Due on: {dueDateStr}</p>
	                                                {daysPast > 0 && <p className="text-[11px] font-black text-red-500">{daysPast} day{daysPast > 1 ? 's' : ''} past due</p>}
	                                            </div>
	                                        )}
	                                    </div>
	                                </div>

                                {/* ── DEAL BREAKDOWN ── */}
                                <div className={cn("rounded-2xl border overflow-hidden", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest px-4 pt-4 pb-2 opacity-40", textColor)}>Deal Breakdown</p>
                                    {[
                                        { label: 'Deliverables', value: pay.deliverables_summary || '1 Instagram Reel' },
                                        { label: 'Deal Value', value: renderBudgetValue(pay) },
                                        { label: 'Deal Type', value: pay.collab_type === 'barter' ? '🎁 Free Products' : '💰 Paid Campaign' },
                                        { label: 'Payment Terms', value: pay.payment_terms || 'Direct Bank Transfer' },
                                    ].map((row, i) => (
                                        <div key={i} className={cn("flex items-center justify-between px-4 py-3", i > 0 ? (isDark ? "border-t border-white/5" : "border-t border-slate-100") : "")}>
                                            <span className={cn("text-[13px] font-semibold opacity-60", textColor)}>{row.label}</span>
                                            <span className={cn("text-[13px] font-black", textColor)}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* ── TIMELINE ── */}
                                <div className={cn("rounded-2xl border p-4", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-4 opacity-40", textColor)}>Deal Timeline</p>
                                    <div className="space-y-0">
                                        {timelineSteps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[12px] font-black border-2",
                                                        step.done
                                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                                            : step.warn
                                                                ? "bg-red-500/10 border-red-500 text-red-500"
                                                                : step.active
                                                                    ? (isDark ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-amber-50 border-amber-400 text-amber-600")
                                                                    : (isDark ? "bg-white/5 border-white/20 text-white/20" : "bg-slate-100 border-slate-200 text-slate-400")
                                                    )}>
                                                        {step.done ? '✓' : step.warn ? '⚠' : step.active ? '⏳' : '·'}
                                                    </div>
                                                    {i < timelineSteps.length - 1 && (
                                                        <div className={cn("w-0.5 h-6 mt-1", step.done ? "bg-emerald-500/40" : (isDark ? "bg-white/10" : "bg-slate-200"))} />
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "text-[13px] font-semibold pt-0.5 pb-5",
                                                    step.done
                                                        ? (isDark ? "text-emerald-400" : "text-emerald-700")
                                                        : step.warn
                                                            ? "text-red-500"
                                                            : step.active
                                                                ? (isDark ? "text-amber-400" : "text-amber-600")
                                                                : (isDark ? "text-white/30" : "text-slate-400")
                                                )}>{step.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── CONTRACT ── */}
                                <div className={cn("rounded-2xl border p-4", isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className={cn("text-[13px] font-black leading-tight", isDark ? "text-emerald-400" : "text-emerald-800")}>Creator Armour Protected</p>
                                            <p className={cn("text-[11px] font-semibold", isDark ? "text-emerald-400/60" : "text-emerald-700/70")}>Content Rights Agreement</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { triggerHaptic(); import('sonner').then(m => m.toast('Contract download coming soon')); }}
                                        className={cn(
                                            "w-full py-2.5 rounded-xl text-[13px] font-black border flex items-center justify-center gap-2 active:scale-[0.98] transition-all",
                                            isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-500/10 border-emerald-400/30 text-emerald-700"
                                        )}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Contract PDF
                                    </button>
                                </div>

                                {/* ── PAYMENT METADATA ── */}
                                <div className={cn("rounded-2xl border overflow-hidden", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest px-4 pt-4 pb-2 opacity-40", textColor)}>Payment Details</p>
                                    {[
                                        { label: 'Invoice ID', value: invoiceId },
                                        { label: 'Payment Method', value: pay.payment_terms || 'Direct Bank Transfer' },
                                        { label: 'Agreement Signed', value: signedDateStr },
	                                        { label: 'Creator Armour Protection', value: '✓ Active' },
                                    ].map((row, i) => (
                                        <div key={i} className={cn("flex items-center justify-between px-4 py-3", i > 0 ? (isDark ? "border-t border-white/5" : "border-t border-slate-100") : "")}>
                                            <span className={cn("text-[12px] font-semibold opacity-60", textColor)}>{row.label}</span>
                                            <span className={cn("text-[12px] font-black font-mono", textColor)}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* ── SUBMITTED CONTENT ── */}
                                {(pay.submission_link || pay.content_url) && (
                                    <div className={cn("rounded-2xl border p-4", cardBgColor, borderColor)}>
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3 opacity-40", textColor)}>Submitted Content</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🎬</span>
                                                <div>
                                                    <p className={cn("text-[13px] font-black", textColor)}>Instagram Reel</p>
                                                    <p className={cn("text-[11px] font-semibold", secondaryTextColor)}>Submitted on time</p>
                                                </div>
                                            </div>
                                            <a
                                                href={pay.submission_link || pay.content_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cn("text-[12px] font-black text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-xl active:scale-95 transition-all", isDark ? "bg-blue-500/10" : "bg-blue-50")}
                                            >
                                                View Link
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* ── BRAND TRUST ── */}
                                <div className={cn("rounded-2xl border p-4", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3 opacity-40", textColor)}>Brand Trust</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={cn("rounded-xl p-3 border", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                            <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Response Time</p>
                                            <p className={cn("text-[15px] font-black", textColor)}>~3 hours</p>
                                        </div>
                                        <div className={cn("rounded-xl p-3 border", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                            <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Campaigns</p>
                                            <p className={cn("text-[15px] font-black", textColor)}>{pay.total_collabs || 21} done</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* ── STICKY ACTION BAR ── */}
                            {!isPaid && (
                                <div className={cn(
                                    "px-5 pb-8 pt-4 border-t space-y-2.5",
                                    isDark ? "bg-[#0B0F14] border-white/10" : "bg-white border-slate-100"
                                )}>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            triggerHaptic();
                                            import('sonner').then(m => m.toast.success('Payment reminder sent to brand!', { description: 'They will be notified via email.' }));
                                        }}
                                        className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                                    >
                                        <Bell className="w-4 h-4" /> Send Payment Reminder
                                    </motion.button>
                                    <div className="flex gap-2.5">
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                                triggerHaptic();
                                                navigate('/creator-dashboard?tab=disputes');
                                            }}
                                            className={cn(
                                                "flex-1 py-3 rounded-2xl flex items-center justify-center gap-1.5 border font-black text-[13px] active:scale-95 transition-all text-red-500",
                                                isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                                            )}
                                        >
                                            <AlertTriangle className="w-4 h-4" /> Open Dispute
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                                triggerHaptic();
                                                if (pay.contact_email) window.open(`mailto:${pay.contact_email}`);
                                                else import('sonner').then(m => m.toast('Brand contact not available'));
                                            }}
                                            className={cn(
                                                "flex-1 py-3 rounded-2xl flex items-center justify-center gap-1.5 border font-black text-[13px] active:scale-95 transition-all",
                                                isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200",
                                                textColor
                                            )}
                                        >
                                            <MessageSquare className="w-4 h-4" /> Contact Brand
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

        </div >
    );
};

export default MobileDashboardDemo;
