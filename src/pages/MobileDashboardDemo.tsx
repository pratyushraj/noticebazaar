import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { trackEvent } from '@/lib/utils/analytics';
import { User, Search, ShieldCheck, Handshake, Camera, Plus, LayoutDashboard, CreditCard, Briefcase, Menu, Instagram, Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, Bell, ChevronRight, Zap, Link2, CheckCircle2, Download, Clock, Info, Globe, Star, LogOut, Copy, Share2, QrCode, Eye, MoreHorizontal, Landmark, FileText, Smartphone, TrendingUp, BarChart3, Mail, MessageCircle, MessageSquare, Edit3, Send, X, XCircle, ExternalLink, AlertCircle, AlertTriangle, ArrowRight, Package, Flag, MapPin, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProgressUpdateSheet from '@/components/deals/ProgressUpdateSheet';
import { triggerHaptic as globalTriggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import PremiumDrawer from '@/components/drawer/PremiumDrawer';
import { supabase } from '@/integrations/supabase/client';
import { DealStage, getDealStageFromStatus, STAGE_TO_PROGRESS, STAGE_TO_STATUS, useUpdateDealProgress } from '@/lib/hooks/useBrandDeals';
import { dealPrimaryCtaButtonClass, getDealPrimaryCta } from '@/lib/deals/primaryCta';
import FiverrPackageEditor from '@/components/profile/FiverrPackageEditor';

import DashboardMetricsCards from '@/components/dashboard/DashboardMetricsCards';
import DealSearchFilter from '@/components/dashboard/DealSearchFilter';
import EnhancedEmptyStates from '@/components/dashboard/EnhancedEmptyStates';

import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AchievementBadges from '@/components/dashboard/AchievementBadges';
import PaymentTimeline from '@/components/dashboard/PaymentTimeline';
import EnhancedInsights from '@/components/dashboard/EnhancedInsights';
import DealTimelineView from '@/components/dashboard/DealTimelineView';
import DealComparison from '@/components/dashboard/DealComparison';
import DealStatusFlow from '@/components/dashboard/DealStatusFlow';
import SmartNotificationsCenter from '@/components/dashboard/SmartNotificationsCenter';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { NotificationPermission } from '@/components/ui/NotificationPermission';
import { ShimmerSkeleton } from '@/components/ui/ShimmerSkeleton';
import confetti from 'canvas-confetti';

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
    /** Show skeleton loading for deals/offers section */
    isLoadingDeals?: boolean;
    /** Show skeleton loading for profile section */
    isLoadingProfile?: boolean;
}

// Minimal Status Badge for Deal Cards
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        'new': { bg: 'bg-background dark:bg-secondary/50', text: 'text-muted-foreground dark:text-muted-foreground', label: 'NEW' },
        'pending': { bg: 'bg-background dark:bg-secondary/50', text: 'text-muted-foreground dark:text-muted-foreground', label: 'AWAITING REVIEW' },
        'negotiating': { bg: 'bg-background dark:bg-secondary/50', text: 'text-muted-foreground dark:text-muted-foreground', label: 'IN NEGOTIATION' },
        'active': { bg: 'bg-background dark:bg-secondary/50', text: 'text-muted-foreground dark:text-muted-foreground', label: 'ACTIVE' },
        'payment_released': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: '💰 PAID' },
        'completed': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'COMPLETED' },
    };
    const normalizeStatus = (status: string) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('payment_released') || s.includes('paid_out')) return 'payment_released';
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
    if (Number.isFinite(barter) && barter > 0) return `₹${barter.toLocaleString()} (Free products)`;

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

const getCreatorDealCardUX = (deal: any) => {
    const rawStatus = normalizeDealStatus(deal);

    const isCompleted = rawStatus.includes('completed') || rawStatus === 'paid';
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
    const needsCreatorAction = !isCompleted && !isApproved && !isPaymentReleased && (needsSignature || isRevisionRequested || isMaking);

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
        cta = 'Submit Revision';
    } else if (isDelivered) {
        stagePill = 'AWAITING REVIEW';
        nextStep = 'Wait for brand approval';
        cta = 'Waiting for Review';
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

    if (isPaid) return { label: 'PAID', sublabel: 'Payment released', tone: 'success' as const };
    if (isPaymentReleased) return { label: 'PAYMENT RELEASED', sublabel: 'Waiting to close the deal', tone: 'success' as const };
    if (isApproved) return { label: 'APPROVED', sublabel: 'Payment pending', tone: 'warning' as const };
    if (isAwaitingApproval) return { label: 'PENDING APPROVAL', sublabel: 'Waiting for brand approval', tone: 'warning' as const };
    if (isContractPending) return { label: 'CONTRACT PENDING', sublabel: 'Sign to start collaboration', tone: 'neutral' as const };
    if (ux.isRevisionRequested) return { label: 'REVISION', sublabel: 'Fix requested before approval', tone: 'warning' as const };
    return { label: 'PENDING', sublabel: 'Released after approval', tone: 'info' as const };
};

// Animated Number Counter
const AnimatedCounter = ({ value }: { value: number }) => {
    const springValue = useSpring(0, { stiffness: 45, damping: 20 });
    const displayValue = useTransform(springValue, (latest) => Math.floor(latest).toLocaleString());

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
            isDark ? "active:bg-card" : "active:bg-background"
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
        isDark ? "bg-card border-[#2C2C2E] divide-[#2C2C2E]" : "bg-card border-[#E5E5EA] divide-[#E5E5EA] shadow-sm",
        "divide-y"
    )}>
        {children}
    </div>
);

const SectionHeader = ({ title, isDark }: any) => (
    <p className={cn(
        "px-8 mb-2 text-[13px] font-bold uppercase tracking-wider opacity-40",
        isDark ? "text-foreground" : "text-black"
    )}>
        {title}
    </p>
);

const ToggleSwitch = ({ active, onToggle, isDark }: any) => (
    <button type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
            "w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out",
            active ? "bg-green-500" : (isDark ? "bg-[#39393D]" : "bg-[#E9E9EB]")
        )}
    >
        <motion.div
            animate={{ x: active ? 22 : 2 }}
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow-md"
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
        content_niches: profile?.content_niches || ['Fashion', 'Tech', 'Lifestyle'],
        bank_account_name: profile?.bank_account_name || '',
        bank_upi: profile?.bank_upi || '',
        deal_templates: profile?.deal_templates || [],
        // NEW: Audience Demographics
        audience_gender_split: profile?.audience_gender_split || '',
        top_cities: Array.isArray(profile?.top_cities) ? profile.top_cities : [],
        audience_age_range: profile?.audience_age_range || '',
        primary_audience_language: profile?.primary_audience_language || '',
        // NEW: Availability & Stats
        posting_frequency: profile?.posting_frequency || '',
        active_brand_collabs_month: profile?.active_brand_collabs_month || '',
        past_brand_count: profile?.past_brand_count || profile?.collab_brands_count_override || 0,
        avg_reel_views_manual: profile?.avg_reel_views_manual || '',
        avg_likes_manual: profile?.avg_likes_manual || '',
        // NEW: Professional Collab Notes
        collab_region_label: profile?.collab_region_label || '',
        collab_audience_fit_note: profile?.collab_audience_fit_note || '',
        collab_recent_activity_note: profile?.collab_recent_activity_note || '',
        collab_audience_relevance_note: profile?.collab_audience_relevance_note || '',
        collab_delivery_reliability_note: profile?.collab_delivery_reliability_note || '',
        collab_response_behavior_note: profile?.collab_response_behavior_note || '',
        campaign_slot_note: profile?.campaign_slot_note || '',
        // NEW: Public Portfolio
        portfolio_links: Array.isArray(profile?.portfolio_links) ? profile.portfolio_links : [],
        past_brands: Array.isArray(profile?.past_brands) ? profile.past_brands : [],
        // NEW: CTA & Social Customization
        collab_cta_trust_note: profile?.collab_cta_trust_note || '',
        collab_cta_dm_note: profile?.collab_cta_dm_note || '',
        collab_cta_platform_note: profile?.collab_cta_platform_note || '',
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
    isLoadingDeals = false,
    isLoadingProfile = false,
}: MobileDashboardProps) => {
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
    const activeTab = (searchParams.get('tab') as 'dashboard' | 'deals' | 'payments' | 'profile') || 'dashboard';
    const setActiveTab = (tab: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    const requestIdParam = (searchParams.get('requestId') || '').trim() || null;
    const dealIdParam = (searchParams.get('dealId') || '').trim() || null;
    const subtabParam = (searchParams.get('subtab') as 'active' | 'pending' | 'completed' | null) || null;

    const [collabSubTab, setCollabSubTab] = useState<'active' | 'pending' | 'completed'>('active');
    const [showSharingTips, setShowSharingTips] = useState(false);
    const hasHandledDeepLinkRef = useRef(false);
    useEffect(() => {
        if (activeTab !== 'deals') return;

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
                    next.set('tab', 'deals');
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
                    next.set('tab', 'deals');
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
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
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

    const [showActionSheet, setShowActionSheet] = useState(false);
    const [completionDismissed, setCompletionDismissed] = useState(false);
    const { canInstall, promptInstall } = usePwaInstall();
    useSessionTimeout();
    const { status: healthStatus } = useHealthCheck();
    const sessionTracked = useRef(false);

    // Track first dashboard view (once per session)
    useEffect(() => {
        if (!sessionTracked.current) {
            trackEvent('first_dashboard_view');
            sessionTracked.current = true;
        }
    }, []);
    const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
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
    const [searchQuery, setSearchQuery] = useState('');
    const [dealFilters, setDealFilters] = useState({ status: 'all', sortBy: 'newest' });
    const [isLoadingDeals, setIsLoadingDeals] = useState(false);
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
            toast.message('Brand typically responds within 24-48 hours');
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
            await onRefresh?.();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to submit content');
            triggerHaptic(HapticPatterns.error);
        } finally {
            setIsSubmittingContent(false);
        }
    };

    // Signing states
    const [showCreatorSigningModal, setShowCreatorSigningModal] = useState(false);
    const [isSendingCreatorOTP, setIsSendingCreatorOTP] = useState(false);
    const [isVerifyingCreatorOTP, setIsVerifyingCreatorOTP] = useState(false);
    const [creatorOTP, setCreatorOTP] = useState('');
    const [creatorSigningStep, setCreatorSigningStep] = useState<'send' | 'verify'>('send');
    const [isSigningAsCreator, setIsSigningAsCreator] = useState(false);
    const [liveCollabProfile, setLiveCollabProfile] = useState<{ name?: string | null; profile_photo?: string | null } | null>(null);
    const [isCollabLinkCopied, setIsCollabLinkCopied] = useState(false);

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
    const pendingOffersDeduplicated = React.useMemo(() => {
        const seen = new Set<string>();
        return (collabRequests || []).filter((req: any) => {
            const key = [req.brand_name, req.collab_type, req.exact_budget || req.budget_amount || req.deal_amount].filter(Boolean).join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [collabRequests]);
    const displayOffers = React.useMemo(() => {
        return pendingOffersDeduplicated;
    }, [pendingOffersDeduplicated]);
    const pendingOffersCount = displayOffers.length;
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
    const pendingAmount = React.useMemo(() => {
        return (brandDeals || []).reduce((sum, deal) => {
            const status = String(deal?.status || '').toLowerCase();
            return status.includes('completed') ? sum : sum + (deal.deal_amount || 0);
        }, 0);
    }, [brandDeals]);

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
            analytics: 'Analytics | CreatorArmour',
            collabs: 'Collabs | CreatorArmour',
            payments: 'Payments | CreatorArmour',
            profile: 'Profile | CreatorArmour',
        };
        document.title = titles[activeTab] || 'CreatorArmour';
    }, [activeTab]);

    const [pullDistance, setPullDistance] = useState(0);
    const [startY, setStartY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isDark = theme === 'dark';
    // Brand-like background base (gradient overlays applied in JSX below)
    const bgColor = isDark ? '#061318' : '#FFFFFF';
    const cardBgColor = isDark ? 'bg-card backdrop-blur-md' : 'bg-card';
    const borderColor = isDark ? 'border-border' : 'border-border';
    const secondaryTextColor = isDark ? 'text-foreground/60' : 'text-muted-foreground';
    const textColor = isDark ? 'text-foreground' : 'text-muted-foreground';

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

    const { session, user, refetchProfile } = useSession();

    const triggerHaptic = (pattern: any = HapticPatterns.light) => {
        globalTriggerHaptic(pattern);
    };

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState<any>(buildProfileFormData(profile, user?.email || null));

    useEffect(() => {
        if (profile) {
            setProfileFormData((prev: any) => ({ ...prev, ...buildProfileFormData(profile, user?.email || null) }));
        }
    }, [profile, user?.email]);

    const handleSaveProfile = async () => {
        if (!session?.user?.id) return;
        setIsSavingProfile(true);
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
                media_kit_url: profileFormData.media_kit_url || null,
                open_to_collabs: profileFormData.open_to_collabs,
                typical_deal_size: profileFormData.typical_deal_size,
                collaboration_preference: profileFormData.collaboration_preference,
                avg_rate_reel: Number(profileFormData.avg_rate_reel) || null,
                content_niches: profileFormData.content_niches,
                deal_templates: profileFormData.deal_templates,
                bank_account_name: profileFormData.bank_account_name?.trim() || null,
                bank_upi: profileFormData.bank_upi?.trim() || null,
                // NEW: Audience & Demographics
                audience_gender_split: profileFormData.audience_gender_split || null,
                top_cities: profileFormData.top_cities || [],
                audience_age_range: profileFormData.audience_age_range || null,
                primary_audience_language: profileFormData.primary_audience_language || null,
                // NEW: Stats & Availability
                posting_frequency: profileFormData.posting_frequency || null,
                active_brand_collabs_month: Number(profileFormData.active_brand_collabs_month) || null,
                past_brand_count: Number(profileFormData.past_brand_count) || null,
                avg_reel_views_manual: Number(profileFormData.avg_reel_views_manual) || null,
                avg_likes_manual: Number(profileFormData.avg_likes_manual) || null,
                // NEW: Collab Professional Notes
                collab_region_label: profileFormData.collab_region_label || null,
                collab_audience_fit_note: profileFormData.collab_audience_fit_note || null,
                collab_recent_activity_note: profileFormData.collab_recent_activity_note || null,
                collab_audience_relevance_note: profileFormData.collab_audience_relevance_note || null,
                collab_delivery_reliability_note: profileFormData.collab_delivery_reliability_note || null,
                collab_response_behavior_note: profileFormData.collab_response_behavior_note || null,
                campaign_slot_note: profileFormData.campaign_slot_note || null,
                // NEW: CTA Customization
                collab_cta_trust_note: profileFormData.collab_cta_trust_note || null,
                collab_cta_dm_note: profileFormData.collab_cta_dm_note || null,
                collab_cta_platform_note: profileFormData.collab_cta_platform_note || null,
                // NEW: Public Portfolio
                portfolio_links: profileFormData.portfolio_links || [],
                past_brands: profileFormData.past_brands || [],
                updated_at: new Date().toISOString(),
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
            // Refetch the global profile so all UI sections update immediately
            refetchProfile();
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('[handleSaveProfile] Unexpected error:', error);
            toast.error(error?.message || 'Failed to save profile');
            triggerHaptic(HapticPatterns.error);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCopyStorefront = async () => {
        try {
            await navigator.clipboard.writeText(`creatorarmour.com/${username}`);
            toast.success("Link copied to clipboard!");
            triggerHaptic(HapticPatterns.success);
            trackEvent('collab_link_shared', { method: 'copy' });
            setIsCollabLinkCopied(true);
            window.setTimeout(() => setIsCollabLinkCopied(false), 1800);
        } catch (e) {
            toast.error("Failed to copy link");
        }
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
                trackEvent('collab_link_shared', { method: 'native_share' });
            } else {
                await handleCopyStorefront();
            }
        } catch (e) {
            console.error("Share failed", e);
        }
    };

    const handleShareOnWhatsApp = async () => {
        const url = `https://creatorarmour.com/${username}`;
        const text = `Hey! For collaborations, please send your brief here:\n${url}`;

        try {
            trackEvent('collab_link_shared', { method: 'whatsapp' });
            triggerHaptic(HapticPatterns.light);

            // WhatsApp deep-link (works on mobile + desktop web)
            const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
            // Fallback: copy link
            await handleCopyStorefront();
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
            // Celebration: confetti burst on first accept
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#10B981', '#059669', '#34D399'] });
            toast.success('🎉 Collab accepted! Check your deals tab.');
            toast.message('Next: Submit content links in Active tab → Deliver Content', { description: 'Brand gets notified. Payment held until you deliver.' });
        } catch (error: any) {
            console.error("Accept error:", error);
            const msg = error?.message || '';
            if (msg.includes('already been processed') || msg.includes('already accepted') || msg.includes('already declined')) {
                toast.info('This offer was already processed.');
                closeItemDetail();
            } else {
                toast.error('Failed to accept: ' + (error?.message || 'Unknown error'));
            }
        } finally {
            setProcessingDeal(null);
        }
    };

    const [showMenu, setShowMenu] = useState(false);
    const [showBrandDetails, setShowBrandDetails] = useState(false);

    const handleAction = (action: string) => {
        triggerHaptic();
        if (action === 'notifications') navigate('/notifications');
        else if (action === 'menu') { setShowMenu(true); if (onOpenMenu) onOpenMenu(); }
        else if (action === 'view_all') setActiveTab('deals');
    };

    const getBrandIcon = (logo?: string, category?: string, name?: string) => {
        const fallback = (cat: string, bName?: string) => {
            const catLower = cat?.toLowerCase() || '';
            const firstLetter = bName?.trim().charAt(0).toUpperCase() || '?';

            // Premium letter-based icon
            if (bName) {
                const char = bName.trim().charAt(0).toUpperCase();
                let color = 'bg-background'; // Default
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
                    <div className={cn("w-full h-full flex items-center justify-center text-foreground font-bold text-3xl shadow-inner transition-colors duration-500 rounded-inherit", color)}>
                        {firstLetter}
                    </div>
                );
            }

            if (catLower.includes('fit') || catLower.includes('gym') || catLower.includes('sport')) return <Dumbbell className="w-5 h-5 text-muted-foreground" />;
            if (catLower.includes('cloth') || catLower.includes('fash') || catLower.includes('beauty') || catLower.includes('skin')) return <Shirt className="w-5 h-5 text-muted-foreground" />;
            return <Target className="w-5 h-5 text-muted-foreground" />;
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
                        <div className={cn("absolute inset-0 z-0", isDark ? "bg-secondary/90" : "bg-card")} />
                    )}
                    <img alt=""
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
        const PageHeader = ({ title }: { title: string }) => (
            <div className={cn("px-6 pt-16 pb-6 flex items-center gap-4 bg-transparent")}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveSettingsPage(null)}
                    className={cn("p-2 rounded-full transition-all", isDark ? "bg-card text-foreground" : "bg-card text-black shadow-sm")}
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
                        <PageHeader title="Personal Information" />
                        <div className="px-4 space-y-6">
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Full Name</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-border text-foreground" : "border-black/5 text-black")} value={profileFormData.full_name || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, full_name: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Email Address</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-border text-foreground" : "border-black/5 text-black")} value={profileFormData.email || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, email: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Phone Number</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-border text-foreground" : "border-black/5 text-black")} value={profileFormData.phone || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Bio / Headline</p>
                                        <textarea
                                            className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px] resize-none h-20", isDark ? "border-border text-foreground" : "border-black/5 text-black")}
                                            value={profileFormData.bio || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, bio: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Address</p>
                                        <input className={cn("w-full bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-border text-foreground" : "border-black/5 text-black")} placeholder="House, Street, Area" value={profileFormData.address || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, address: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Pincode / City</p>
                                        <div className="flex gap-2">
                                            <input className={cn("w-24 bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-border text-foreground" : "border-black/5 text-black")} placeholder="Pincode" value={profileFormData.pincode || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, pincode: e.target.value }))} />
                                            <input className={cn("flex-1 bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-border text-foreground" : "border-black/5 text-black")} placeholder="City" value={profileFormData.city || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, city: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>
                            <SectionHeader title="Account Identity" isDark={isDark} />
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
                                            <Link2 className="w-4 h-4 text-info" />
                                            <input className="bg-transparent outline-none font-medium text-[16px] flex-1" placeholder="https://..." value={profileFormData.media_kit_url || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, media_kit_url: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>
                            <div className="px-4 pt-4">
                                <button type="button" onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-info text-foreground font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'portfolio':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Public Portfolio" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-6 rounded-[2.5rem] border text-center relative overflow-hidden", isDark ? "bg-card border-[#2C2C2E]" : "bg-card border-[#E5E5EA] shadow-sm")}>
                                <div className="w-20 h-20 bg-info/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <Globe className="w-10 h-10 text-info" />
                                </div>
                                <h3 className={cn("text-xl font-bold tracking-tight mb-1", textColor)}>creatorarmour.com/{username}</h3>
                                <p className={cn("text-[13px] opacity-40 mb-6", textColor)}>Your public intake storefront</p>
                                <div className="flex gap-3">
                                    <button type="button" onClick={handleCopyStorefront} className="flex-1 bg-info text-foreground font-bold py-3.5 rounded-2xl text-[13px] active:scale-95 transition-all">Copy</button>
                                    <button type="button" onClick={() => window.open(`https://creatorarmour.com/${username}`, '_blank')} className={cn("flex-1 font-bold py-3.5 rounded-2xl text-[13px] border active:scale-95 transition-all", isDark ? "border-border text-foreground" : "border-black/5 text-black")}>Preview</button>
                                </div>
                            </div>
                            <SectionHeader title="Storefront Controls" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow icon={<Info />} iconBg="bg-indigo-500" label="Bio & Headline" subtext="Your creator pitch" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('personal')} />
                                <SettingsRow icon={<Star />} iconBg="bg-warning" label="Featured Content" subtext="Showcase high-performing reels" isDark={isDark} textColor={textColor} hasChevron onClick={() => toast("Integration coming soon!")} />
                                <SettingsRow icon={<Link2 />} iconBg="bg-info" label="Media Kit" subtext="Connect your external deck" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('personal')} />
                            </SettingsGroup>
                        </div>
                    </motion.div>
                );
            case 'payouts':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Payout Methods" />
                        <div className="px-4 space-y-6">
                            <SectionHeader title="Connected Payouts" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Account holder name</p>
                                        <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            <Landmark className="w-4 h-4 text-info" />
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
                                            <span className="text-[10px] font-black text-primary">PRIMARY</span>
                                        </div>
                                        <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            <Smartphone className="w-4 h-4 text-primary" />
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
                            <div className="px-4 pt-4">
                                <button type="button" onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-info text-foreground font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
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
                            <div className={cn("p-8 rounded-[2.5rem] relative overflow-hidden", isDark ? "bg-card border border-[#2C2C2E]" : "bg-card border-[#E5E5EA] shadow-sm")}>
                                <div className="w-16 h-16 bg-info rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                                    <ShieldCheck className="w-9 h-9 text-foreground" />
                                </div>
                                <h3 className={cn("text-2xl font-black tracking-tight mb-2", textColor)}>Verified Creator</h3>
                                <p className={cn("text-sm opacity-50 leading-relaxed mb-6", textColor)}>Your identity and content ownership are secured. Brands see your 'Verified' badge, increasing trust.</p>
                                <div className="flex flex-col gap-2">
                                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", isDark ? "bg-card" : "bg-background")}>
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                        <span className={cn("text-xs font-bold", textColor)}>Identity Secured</span>
                                    </div>
                                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", isDark ? "bg-card" : "bg-background")}>
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                        <span className={cn("text-xs font-bold", textColor)}>Instagram Authenticated</span>
                                    </div>
                                </div>
                                <ShieldCheck className="absolute -right-10 -bottom-10 w-48 h-48 opacity-[0.03] text-info" />
                            </div>
                        </div>
                    </motion.div>
                );
            case 'earnings':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Earnings & History" />
                        <div className="px-4 space-y-6">
                            <div className={cn("p-6 rounded-[2.5rem] bg-background border border-border text-foreground")}>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50 mb-4">Total Revenue Generated</p>
                                <div className="text-4xl font-black font-outfit mb-6">₹{allTimeRevenue.toLocaleString()}</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-card p-4 rounded-2xl border border-border/5">
                                        <p className="text-[10px] font-bold opacity-40 mb-1">THIS YEAR</p>
                                        <p className="text-lg font-bold">₹{yearlyRevenue.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-card p-4 rounded-2xl border border-border/5">
                                        <p className="text-[10px] font-bold opacity-40 mb-1">LAST MONTH</p>
                                        <p className="text-lg font-bold text-primary">₹{monthlyRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <SectionHeader title="Financial Reports" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow icon={<FileText />} iconBg="bg-info" label="Tax Invoices (GST)" subtext="Download monthly summaries" isDark={isDark} textColor={textColor} hasChevron />
                                <SettingsRow icon={<Download />} iconBg="bg-primary" label="Payout Statements" subtext="Detailed breakdown of fees" isDark={isDark} textColor={textColor} hasChevron />
                            </SettingsGroup>
                        </div>
                    </motion.div>
                );
            case 'collab-link':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-32">
                        <PageHeader title="Collab Link Performance" />
                        <div className="px-4 space-y-6">
                            {/* Performance Header */}
                            <div className={cn("p-6 rounded-[2.5rem] border relative overflow-hidden", isDark ? "bg-card border-[#2C2C2E]" : "bg-card border-[#E5E5EA] shadow-sm")}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-info/10 rounded-2xl flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-info" />
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1", textColor)}>Overall Score</p>
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className={cn("text-2xl font-black font-outfit", textColor)}>72</span>
                                            <span className={cn("text-sm font-bold opacity-30", textColor)}>/ 100</span>
                                        </div>
                                    </div>
                                </div>
                                <h3 className={cn("text-xl font-bold tracking-tight mb-1", textColor)}>creatorarmour.com/{username}</h3>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button type="button"
                                        onClick={() => {
                                            const link = `${window.location.origin}/${username}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success('Link copied');
                                            triggerHaptic();
                                        }}
                                        className="bg-info text-foreground font-black py-3 rounded-xl text-[11px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                    >
                                        Copy Link
                                    </button>
                                    <button type="button"
                                        onClick={() => {
                                            triggerHaptic();
                                            window.open(`/${username}`, '_blank');
                                        }}
                                        className={cn("flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-[11px] border active:scale-95 transition-all text-muted-foreground uppercase tracking-widest", isDark ? "border-border" : "border-black/5")}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> Preview
                                    </button>
                                    <button type="button"
                                        onClick={() => {
                                            const link = `${window.location.origin}/${username}`;
                                            const message = encodeURIComponent(`For collaborations, submit here:\n\n${link}`);
                                            window.open(`https://wa.me/?text=${message}`, '_blank');
                                            triggerHaptic();
                                        }}
                                        className={cn("flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-[11px] border active:scale-95 transition-all uppercase tracking-widest", isDark ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary border-primary text-primary")}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                    </button>
                                    <button type="button"
                                        onClick={() => {
                                            const link = `${window.location.origin}/${username}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success('Copied! Paste in your Bio.');
                                            triggerHaptic();
                                        }}
                                        className={cn("flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-[11px] border active:scale-95 transition-all uppercase tracking-widest", isDark ? "bg-pink-500/10 border-pink-500/20 text-pink-400" : "bg-pink-50 border-pink-100 text-pink-600")}
                                    >
                                        <Instagram className="w-3.5 h-3.5" /> Instagram
                                    </button>
                                </div>
                            </div>

                            <SectionHeader title="Status" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow
                                    icon={<CheckCircle2 />} iconBg="bg-primary"
                                    label="Open for Collaborations"
                                    subtext={profileFormData.open_to_collabs ? "Brands can send you offers" : "Profile currently hidden from search"}
                                    isDark={isDark} textColor={textColor}
                                    rightElement={
                                        <ToggleSwitch
                                            active={profileFormData.open_to_collabs}
                                            onToggle={(val) => setProfileFormData((p: any) => ({ ...p, open_to_collabs: val }))}
                                            isDark={isDark}
                                        />
                                    }
                                />
                            </SettingsGroup>

                            {/* Optimization Wizard - Moved to Collab Link */}
                            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-[2.5rem] p-6 border border-info/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                    <Zap className="w-16 h-16 text-info fill-blue-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-9 h-9 rounded-2xl bg-info flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Zap className="w-5 h-5 text-foreground fill-white" />
                                        </div>
                                        <h3 className={cn("font-black text-[17px] tracking-tight", textColor)}>Optimization Wizard</h3>
                                    </div>
                                    <p className={cn("text-[13px] font-medium opacity-60 mb-5 leading-relaxed", textColor)}>
                                        Your profile conversion is currently <span className="text-info font-black">Good</span>.
                                        Let AI analyze your bio and historical rates to boost brand appeal.
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        <button type="button"
                                            onClick={() => {
                                                triggerHaptic();
                                                toast.promise(new Promise(r => setTimeout(r, 1500)), {
                                                    loading: 'AI analyzing your bio...',
                                                    success: 'Bio optimized! Click "Review" to see changes.',
                                                    error: 'Analysis failed'
                                                });
                                            }}
                                            className={cn("flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95", isDark ? "bg-card border border-border text-foreground" : "bg-card border border-border text-muted-foreground shadow-sm")}
                                        >
                                            Enhance Bio
                                        </button>
                                        <button type="button"
                                            onClick={() => {
                                                triggerHaptic();
                                                toast.promise(new Promise(r => setTimeout(r, 2000)), {
                                                    loading: 'Pricing AI calculating smart rates...',
                                                    success: 'Smart Rates generated!',
                                                    error: 'Pricing analysis failed'
                                                });
                                            }}
                                            className="flex-1 bg-info hover:bg-info text-foreground rounded-2xl py-3.5 text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                        >
                                            Smart Rates
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Fiverr Packages - Moved to Collab Link */}
                            <SectionHeader title="Collaboration Packages" isDark={isDark} />
                            <div className="px-0">
                                <FiverrPackageEditor
                                    packages={profileFormData.deal_templates || []}
                                    onChange={(pkgs) => setProfileFormData(p => ({ ...p, deal_templates: pkgs }))}
                                />
                            </div>

                            <SectionHeader title="Deal Size Expectations" isDark={isDark} />
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { key: 'starter', title: 'Starter Level', range: '₹2k - ₹10k', sub: 'Smaller niche brands, barter or small fees' },
                                    { key: 'standard', title: 'Professional', range: '₹10k - ₹50k', sub: 'Mainstream brands, partial cash upfront' },
                                    { key: 'premium', title: 'High-Value', range: '₹50k - ₹2L+', sub: 'Luxury / Corporate campaigns only' },
                                ].map((tier) => (
                                    <button type="button"
                                        key={tier.key}
                                        onClick={() => setProfileFormData((p: any) => ({ ...p, typical_deal_size: tier.key }))}
                                        className={cn(
                                            "p-4 rounded-2xl border text-left transition-all active:scale-[0.98]",
                                            profileFormData.typical_deal_size === tier.key
                                                ? "bg-info border-info text-foreground"
                                                : (isDark ? "bg-card border-border/5 text-foreground" : "bg-card border-border text-black")
                                        )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-sm">{tier.title}</p>
                                            <p className={cn("text-xs font-black", profileFormData.typical_deal_size === tier.key ? "text-foreground/80" : "text-info")}>{tier.range}</p>
                                        </div>
                                        <p className={cn("text-[10px] uppercase tracking-wider mt-1 opacity-60")}>{tier.sub}</p>
                                    </button>
                                ))}
                            </div>

                            <SectionHeader title="Collaboration Type" isDark={isDark} />
                            <div className="flex gap-2">
                                {['Paid', 'Free products', 'Hybrid'].map((type) => (
                                    <button type="button"
                                        key={type}
                                        onClick={() => setProfileFormData((p: any) => ({ ...p, collaboration_preference: type }))}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all",
                                            (profileFormData.collaboration_preference || 'Hybrid').toLowerCase() === type.toLowerCase()
                                                ? "bg-background border-border text-foreground"
                                                : (isDark ? "bg-card border-border text-foreground" : "bg-card border-border text-muted-foreground")
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <SectionHeader title="Niche Alignment" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Content Niches</p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {(profileFormData.content_niches || ['Fashion', 'Tech', 'Lifestyle']).map((niche: string) => (
                                                <div key={niche} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border", isDark ? "bg-card border-border text-foreground" : "bg-info border-info text-info")}>
                                                    {niche}
                                                </div>
                                            ))}
                                            <button type="button" className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-dashed", isDark ? "border-border text-foreground/40" : "border-black/10 text-black/40")}>
                                                + ADD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>

                            {/* Audience Demographics */}
                            <SettingsGroup title="Audience Demographics" icon={<Target className="w-5 h-5 text-secondary" />} isDark={isDark}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] opacity-50 pl-1", textColor)}>Gender Split</p>
                                            <input
                                                type="text"
                                                placeholder="e.g. 70% Women"
                                                className={cn("w-full px-4 py-3.5 rounded-[1.25rem] border text-[13px] font-semibold transition-all duration-300 outline-none", isDark ? "bg-[#0B0F14]/50 border-border/[0.08] text-foreground focus:border-primary/50 focus:bg-[#0B0F14] shadow-inner" : "bg-background border-border focus:bg-card focus:border-info shadow-sm")}
                                                value={profileFormData.audience_gender_split}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, audience_gender_split: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] opacity-50 pl-1", textColor)}>Age Range</p>
                                            <input
                                                type="text"
                                                placeholder="e.g. 18-24"
                                                className={cn("w-full px-4 py-3.5 rounded-[1.25rem] border text-[13px] font-semibold transition-all duration-300 outline-none", isDark ? "bg-[#0B0F14]/50 border-border/[0.08] text-foreground focus:border-primary/50 focus:bg-[#0B0F14] shadow-inner" : "bg-background border-border focus:bg-card focus:border-info shadow-sm")}
                                                value={profileFormData.audience_age_range}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, audience_age_range: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] opacity-50 pl-1", textColor)}>Top Cities</p>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {(profileFormData.top_cities || []).map((city: string, idx: number) => (
                                                <div key={idx} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider backdrop-blur-sm", isDark ? "bg-secondary/50 border-purple-500/20 text-secondary shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "bg-secondary border-purple-100 text-secondary")}>
                                                    {city}
                                                    <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" onClick={() => {
                                                        const newCities = [...profileFormData.top_cities];
                                                        newCities.splice(idx, 1);
                                                        setProfileFormData({ ...profileFormData, top_cities: newCities });
                                                    }} />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Add city & press enter..."
                                                className={cn("w-full pl-11 pr-12 py-3.5 rounded-[1.25rem] border text-[13px] font-semibold transition-all duration-300 outline-none", isDark ? "bg-[#0B0F14]/50 border-border/[0.08] text-foreground focus:border-primary/50 focus:bg-[#0B0F14] shadow-inner hover:border-border" : "bg-background border-border focus:bg-card focus:border-info shadow-sm")}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const target = e.target as HTMLInputElement;
                                                        if (target.value.trim()) {
                                                            setProfileFormData({ ...profileFormData, top_cities: [...(profileFormData.top_cities || []), target.value.trim()] });
                                                            target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg bg-card opacity-50 group-focus-within:opacity-100 group-focus-within:bg-primary/20 transition-all pointer-events-none">
                                                <Plus className="w-4 h-4 group-focus-within:text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-2">
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] opacity-50 pl-1", textColor)}>Primary Language</p>
                                        <div className="relative group">
                                            <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Hindi, English"
                                                className={cn("w-full pl-11 pr-4 py-3.5 rounded-[1.25rem] border text-[13px] font-semibold transition-all duration-300 outline-none", isDark ? "bg-[#0B0F14]/50 border-border/[0.08] text-foreground focus:border-primary/50 focus:bg-[#0B0F14] shadow-inner hover:border-border" : "bg-background border-border focus:bg-card focus:border-info shadow-sm")}
                                                value={profileFormData.primary_audience_language}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, primary_audience_language: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>

                            {/* Public Portfolio */}
                            <SettingsGroup title="Public Portfolio" icon={<Search className="w-5 h-5 text-info" />} isDark={isDark}>
                                <div className="space-y-2">
                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] opacity-50 pl-1", textColor)}>Featured Work Gallery</p>
                                    <p className={cn("text-[10px] font-semibold opacity-60 mb-2 pl-1", textColor)}>Add links to your top-performing Reels or Posts</p>
                                    <div className="flex flex-col gap-2 mb-3">
                                        {(profileFormData.portfolio_links || []).map((link: string, idx: number) => (
                                            <div key={idx} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-[1rem] border text-[11px] font-black w-full shadow-sm backdrop-blur-sm", isDark ? "bg-info/10 border-info/20 text-info shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-info border-info text-info")}>
                                                <Link2 className="w-4 h-4 shrink-0 opacity-70" />
                                                <span className="truncate flex-1 mt-0.5">{link}</span>
                                                <X className="w-4 h-4 cursor-pointer shrink-0 opacity-50 hover:opacity-100 transition-opacity" onClick={() => {
                                                    const newLinks = [...profileFormData.portfolio_links];
                                                    newLinks.splice(idx, 1);
                                                    setProfileFormData({ ...profileFormData, portfolio_links: newLinks });
                                                }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative group">
                                        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="url"
                                            placeholder="https://instagram.com/reel/..."
                                            className={cn("w-full pl-11 pr-12 py-3.5 rounded-[1.25rem] border text-[13px] font-semibold transition-all duration-300 outline-none", isDark ? "bg-[#0B0F14]/50 border-border/[0.08] text-foreground focus:border-primary/50 focus:bg-[#0B0F14] shadow-inner hover:border-border" : "bg-background border-border focus:bg-card focus:border-info shadow-sm")}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const target = e.target as HTMLInputElement;
                                                    if (target.value.trim()) {
                                                        setProfileFormData({ ...profileFormData, portfolio_links: [...(profileFormData.portfolio_links || []), target.value.trim()] });
                                                        target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg bg-card opacity-50 group-focus-within:opacity-100 group-focus-within:bg-primary/20 transition-all pointer-events-none">
                                            <Plus className="w-4 h-4 group-focus-within:text-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] opacity-50 pl-1", textColor)}>Past Brands</p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(profileFormData.past_brands || []).map((brand: string, idx: number) => (
                                            <div key={idx} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider backdrop-blur-sm", isDark ? "bg-card border-border text-foreground shadow-sm" : "bg-background border-border text-muted-foreground")}>
                                                {brand}
                                                <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => {
                                                    const newBrands = [...profileFormData.past_brands];
                                                    newBrands.splice(idx, 1);
                                                    setProfileFormData({ ...profileFormData, past_brands: newBrands });
                                                }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Add past brand & press enter..."
                                            className={cn("w-full pl-11 pr-12 py-3.5 rounded-[1.25rem] border text-[13px] font-semibold transition-all duration-300 outline-none", isDark ? "bg-[#0B0F14]/50 border-border/[0.08] text-foreground focus:border-primary/50 focus:bg-[#0B0F14] shadow-inner hover:border-border" : "bg-background border-border focus:bg-card focus:border-info shadow-sm")}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const target = e.target as HTMLInputElement;
                                                    if (target.value.trim()) {
                                                        setProfileFormData({ ...profileFormData, past_brands: [...(profileFormData.past_brands || []), target.value.trim()] });
                                                        target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg bg-card opacity-50 group-focus-within:opacity-100 group-focus-within:bg-primary/20 transition-all pointer-events-none">
                                            <Plus className="w-4 h-4 group-focus-within:text-primary" />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>

                            {/* Performance & Availability */}
                            <SettingsGroup title="Performance & Availability" icon={<Zap className="w-5 h-5 text-warning" />} isDark={isDark}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Monthly Slots</p>
                                            <input
                                                type="number"
                                                placeholder="e.g. 5"
                                                className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                                value={profileFormData.active_brand_collabs_month}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, active_brand_collabs_month: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Past Campaigns</p>
                                            <input
                                                type="number"
                                                placeholder="e.g. 12"
                                                className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                                value={profileFormData.past_brand_count}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, past_brand_count: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Posting Frequency</p>
                                        <input
                                            type="text"
                                            placeholder="e.g. 3-4 times / week"
                                            className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                            value={profileFormData.posting_frequency}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, posting_frequency: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Self-Reported Views</p>
                                            <input
                                                type="number"
                                                placeholder="Avg Views"
                                                className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                                value={profileFormData.avg_reel_views_manual}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, avg_reel_views_manual: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Self-Reported Likes</p>
                                            <input
                                                type="number"
                                                placeholder="Avg Likes"
                                                className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                                value={profileFormData.avg_likes_manual}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, avg_likes_manual: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>

                            {/* Trust & Professional Notes */}
                            <SettingsGroup title="Professional Collab Notes" icon={<ShieldCheck className="w-5 h-5 text-primary" />} isDark={isDark}>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Audience Relevance Note</p>
                                        <textarea
                                            placeholder="e.g. Strong relevance for North India beauty enthusiasts."
                                            className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold min-h-[80px]", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                            value={profileFormData.collab_audience_relevance_note}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, collab_audience_relevance_note: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Response Policy</p>
                                        <input
                                            type="text"
                                            placeholder="e.g. Brands receive response same day"
                                            className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                            value={profileFormData.collab_response_behavior_note}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, collab_response_behavior_note: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>DM Policy</p>
                                        <input
                                            type="text"
                                            placeholder="e.g. No DMs required — I reply here."
                                            className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                            value={profileFormData.collab_cta_dm_note}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, collab_cta_dm_note: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Notification Policy</p>
                                        <input
                                            type="text"
                                            placeholder="e.g. Creator notified instantly."
                                            className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                            value={profileFormData.collab_cta_trust_note}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, collab_cta_trust_note: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Platform Model</p>
                                        <input
                                            type="text"
                                            placeholder="e.g. Direct collaboration — no middle agency."
                                            className={cn("w-full px-4 py-3 rounded-2xl border text-sm font-bold", isDark ? "bg-card border-border text-foreground" : "bg-background border-border")}
                                            value={profileFormData.collab_cta_platform_note}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, collab_cta_platform_note: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </SettingsGroup>

                            <button type="button" onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-info text-foreground font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                {isSavingProfile ? 'Saving...' : 'Save All Collab Settings'}
                            </button>
                            {/* Analytics Grid */}
                            <SectionHeader title="Performance Metrics" isDark={isDark} />
                            <div className="grid grid-cols-3 gap-3">
                                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-card border-border/5" : "bg-card border-border shadow-sm")}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2", textColor)}>Views</p>
                                    <div className={cn("text-2xl font-black font-outfit", textColor)}>274</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary">+12%</span>
                                    </div>
                                </div>
                                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-card border-border/5" : "bg-card border-border shadow-sm")}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2", textColor)}>Requests</p>
                                    <div className={cn("text-2xl font-black font-outfit", textColor)}>14</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary">+8%</span>
                                    </div>
                                </div>
                                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-card border-border/5" : "bg-card border-border shadow-sm")}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2", textColor)}>Conv.</p>
                                    <div className={cn("text-2xl font-black font-outfit", textColor)}>5.1%</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-warning rotate-180" />
                                        <span className="text-[10px] font-bold text-warning">-2%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Trend Chart (SVG) */}
                            <div className={cn("p-6 rounded-[2.5rem] border", isDark ? "bg-card border-border/5" : "bg-card border-border shadow-sm")}>
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className={cn("text-sm font-black uppercase tracking-wider opacity-40", textColor)}>Weekly Traffic</h4>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary")}>Last 7 Days</span>
                                </div>
                                <div className="h-24 w-full relative">
                                    <svg viewBox="0 0 100 40" className="w-full h-full">
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M0,35 Q10,30 20,25 T40,28 T60,15 T80,18 T100,5"
                                            fill="none"
                                            stroke="#3B82F6"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M0,35 Q10,30 20,25 T40,28 T60,15 T80,18 T100,5 L100,40 L0,40 Z"
                                            fill="url(#chartGradient)"
                                        />
                                    </svg>
                                    <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] font-bold opacity-30 mt-2 px-1">
                                        <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Conversion insights */}
                            <SectionHeader title="Conversion Funnel" isDark={isDark} />
                            <div className={cn("p-6 rounded-[2.5rem] border", isDark ? "bg-card border-border/5" : "bg-card border-border shadow-sm")}>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center"><Eye className="w-4 h-4 text-info" /></div>
                                            <p className={cn("text-sm font-bold", textColor)}>Profile Views</p>
                                        </div>
                                        <p className={cn("text-sm font-black font-outfit", textColor)}>843</p>
                                    </div>
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-background/10" />
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center"><Handshake className="w-4 h-4 text-warning" /></div>
                                            <p className={cn("text-sm font-bold", textColor)}>Started Form</p>
                                        </div>
                                        <p className={cn("text-sm font-black font-outfit", textColor)}>92</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-primary" /></div>
                                            <p className={cn("text-sm font-bold", textColor)}>Completed Deals</p>
                                        </div>
                                        <p className={cn("text-sm font-black font-outfit", textColor)}>14</p>
                                    </div>
                                </div>
                                <div className={cn("mt-6 p-3 rounded-xl bg-warning/5 border border-warning/10 flex items-center gap-2")}>
                                    <Zap className="w-3.5 h-3.5 text-warning" />
                                    <p className="text-[10px] font-black tracking-tight text-warning">Brands checking profile but not converting. Try adding Audience Stats.</p>
                                </div>
                            </div>

                            {/* Optimization Tips */}
                            <SectionHeader title="Boost Your Conversions" isDark={isDark} />
                            <div className="grid grid-cols-1 gap-3">
                                <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", isDark ? "bg-card border-[#2C2C2E]" : "bg-card border-border shadow-sm")}>
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[14px] font-bold leading-tight", textColor)}>Add Audience Stats</p>
                                        <p className={cn("text-[11px] opacity-40 mt-1", textColor)}>Brands verify niche alignment via demographics</p>
                                    </div>
                                    <span className="text-[10px] font-black text-info">+12% SCORE</span>
                                </div>
                                <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", isDark ? "bg-card border-[#2C2C2E]" : "bg-card border-border shadow-sm")}>
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Star className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[14px] font-bold leading-tight", textColor)}>Link Top Collaborations</p>
                                        <p className={cn("text-[11px] opacity-40 mt-1", textColor)}>Showcase high-performing past brand deals</p>
                                    </div>
                                    <span className="text-[10px] font-black text-info">+8% SCORE</span>
                                </div>
                                <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", isDark ? "bg-card border-[#2C2C2E]" : "bg-card border-border shadow-sm")}>
                                    <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5 text-warning" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[14px] font-bold leading-tight", textColor)}>Set Rate Expectations</p>
                                        <p className={cn("text-[11px] opacity-40 mt-1", textColor)}>Filter out low-budget offers automatically</p>
                                    </div>
                                    <span className="text-[10px] font-black text-info">+5% SCORE</span>
                                </div>
                            </div>

                            {/* AI Brand Match - KILLER FEATURE */}
                            <SectionHeader title="AI Recommended Brands" isDark={isDark} />
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                                {[
                                    { name: 'boAt', logo: 'B', color: 'bg-violet-600' },
                                    { name: 'MamaEarth', logo: 'M', color: 'bg-teal-600' },
                                    { name: 'Lenskart', logo: 'L', color: 'bg-primary' },
                                    { name: 'Nykaa', logo: 'N', color: 'bg-pink-600' },
                                ].map((brand, i) => (
                                    <div key={i} className={cn("w-32 shrink-0 p-4 rounded-3xl border text-center transition-all", isDark ? "bg-card border-border/5" : "bg-card border-border shadow-sm")}>
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-foreground font-black text-xl shadow-lg", brand.color)}>
                                            {brand.logo}
                                        </div>
                                        <p className={cn("text-[13px] font-black tracking-tight mb-1", textColor)}>{brand.name}</p>
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">94% Match</p>
                                    </div>
                                ))}
                            </div>

                            <button type="button" className="w-full bg-info text-foreground font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4 fill-white" /> Upgrade To Growth Pro
                            </button>
                        </div>
                    </motion.div>
                );
            case 'dark-mode':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Appearance" />
                        <div className="px-4 space-y-6">
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow
                                    icon={isDark ? <Sun /> : <Moon />} iconBg="bg-background"
                                    label="Dark Mode"
                                    subtext={isDark ? "Always On" : "Off"}
                                    isDark={isDark} textColor={textColor}
                                    rightElement={<ToggleSwitch active={isDark} onToggle={toggleTheme} isDark={isDark} />}
                                />
                            </SettingsGroup>
                            <p className={cn("px-4 text-[13px] opacity-40 leading-relaxed", textColor)}>Choose between light and dark themes. We recommend dark mode to save eye strain and battery life.</p>
                        </div>
                    </motion.div>
                );
            case 'notifications':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Notifications" />
                        <div className="px-4 space-y-6">
                            <SectionHeader title="Deal Alerts" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow
                                    icon={<Bell />} iconBg="bg-info"
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
                                    <button type="button"
                                        onClick={async () => {
                                            triggerHaptic();
                                            const res = await sendTestPush();
                                            if (res.success) toast.success("Test notification sent!");
                                            else toast.error("Test push failed.", { description: res.reason || 'Unknown reason' });
                                        }}
                                        className={cn("w-full py-3 text-[11px] font-black uppercase tracking-wider text-info text-center", isPushBusy && "opacity-50")}
                                        disabled={isPushBusy}
                                    >
                                        {isPushBusy ? "Sending..." : "Send Test Notification"}
                                    </button>
                                )}
                            </SettingsGroup>
                            <div className={cn("p-4 rounded-2xl border flex items-start justify-between gap-3", isDark ? "bg-card border-border" : "bg-card border-border shadow-sm")}>
                                <div className="min-w-0">
                                    <p className={cn("text-[12px] font-black uppercase tracking-widest opacity-60", textColor)}>Status</p>
                                    <p className={cn("text-[12px] mt-1 opacity-70", textColor)}>
                                        Supported: <span className={cn("font-semibold", textColor)}>{isPushSupported ? 'Yes' : 'No'}</span>
                                        {'  '}• Permission: <span className={cn("font-semibold", textColor)}>{pushPermission}</span>
                                        {'  '}• Subscribed: <span className={cn("font-semibold", textColor)}>{isPushSubscribed ? 'Yes' : 'No'}</span>
                                    </p>
                                    {isIOSNeedsInstall && (
                                        <p className={cn("text-[12px] mt-1", isDark ? "text-warning/80" : "text-warning")}>
                                            iOS requires “Add to Home Screen” for push.
                                        </p>
                                    )}
                                    {!hasVapidKey && (
                                        <p className={cn("text-[12px] mt-1", isDark ? "text-warning/80" : "text-warning")}>
                                            Missing VAPID public key in frontend env.
                                        </p>
                                    )}
                                </div>
                                <button type="button"
                                    onClick={async () => {
                                        triggerHaptic();
                                        await refreshPushStatus();
                                        toast.success("Notification status refreshed");
                                    }}
                                    className={cn(
                                        "h-10 px-4 rounded-xl border text-[12px] font-bold transition-all active:scale-[0.99] shrink-0",
                                        isDark ? "border-border bg-card text-foreground/80 hover:bg-secondary/50" : "border-border bg-card text-muted-foreground hover:bg-background"
                                    )}
                                >
                                    Refresh
                                </button>
                            </div>
                            <div className={cn("p-4 rounded-2xl flex items-start gap-3", isDark ? "bg-warning/5 text-warning/80" : "bg-warning text-warning")}>
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p className="text-[11px] leading-relaxed font-medium">
                                    We use push notifications to alert you about new contracts and emergency payment updates.
                                </p>
                            </div>
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
                        <div className="w-20 h-20 bg-info/10 rounded-3xl flex items-center justify-center mb-6">
                            <Clock className="w-10 h-10 text-info opacity-40" />
                        </div>
                        <h3 className={cn("text-xl font-bold mb-2", textColor)}>Refining Module</h3>
                        <p className={cn("opacity-40 text-sm leading-relaxed mb-8", textColor)}>We're fine-tuning this control center for your creator business.</p>
                        <button type="button"
                            onClick={() => setActiveSettingsPage(null)}
                            className="bg-info text-foreground font-black px-10 py-4 rounded-2xl active:scale-95 transition-all text-[13px] uppercase tracking-widest"
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
    };

    return (
        <div
            className={cn('fixed inset-0 z-[1000] flex justify-center overflow-hidden font-sans selection:bg-primary/25')}
            style={{ backgroundColor: bgColor }}
        >
            {isDark ? (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
                    <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-primary/20 rounded-full blur-[140px]" />
                    <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-info/18 rounded-full blur-[160px]" />
                    <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-primary/12 rounded-full blur-[170px]" />
                </div>
            ) : (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-background" />
                </div>
            )}
            <div
                className={cn(
                    'w-full md:max-w-3xl mx-auto relative z-10 h-[100dvh] flex flex-col transition-colors duration-300 md:border-x bg-transparent',
                    isDark ? 'md:border-[#1F2937] text-muted-foreground' : 'md:border-border text-muted-foreground'
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
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg border', isDark ? 'bg-[#121826] border-[#1F2937]' : 'bg-card border-border')}>
                        {isRefreshingProp
                            ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                            : <RefreshCw className="w-5 h-5 text-muted-foreground" style={{ transform: `rotate(${pullDistance * 6}deg)` }} />
                        }
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onScroll={e => { if (e.currentTarget.scrollTop > 10 && pullDistance > 0) { setPullDistance(0); setStartY(0); } }}
                    className="flex-1 overflow-y-auto overflow-x-hidden pb-[140px] scrollbar-hide"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div style={{ height: isRefreshingProp ? '60px' : '0' }} className="transition-all duration-300" />

                    {/* ─── DASHBOARD TAB ─── */}
                    {activeTab === 'dashboard' && (
                        <>
                            {/* Complete Your Collab Link Banner */}
                            {!completionDismissed && profile && (() => {
                                const hasMonetizableActivity = Array.isArray(brandDeals) && brandDeals.some((d: any) =>
                                    ['Payment Pending', 'Completed', 'Approved', 'Active', 'confirmed'].includes(String(d?.status || ''))
                                );

                                const tasks = [
                                    { done: !!profile.instagram_handle, label: 'Add Instagram', focus: 'instagram' },
                                    { done: !!profile.bio, label: 'Add intro line', focus: 'bio' },
                                    { done: !!(profile.pricing_min || profile.avg_rate_reel), label: 'Set rates', focus: 'rates' },
                                    // Only ask for payout when it's actually needed (reduces day-0 drop-off)
                                    ...(hasMonetizableActivity ? [{ done: !!profile.bank_upi, label: 'Add payout', focus: 'payout', tabLink: true }] : []),
                                ];
                                const shouldShow = tasks.some(t => !t.done);
                                if (!shouldShow) return null;
                                const completed = tasks.filter(t => t.done).length;
                                const remaining = tasks.filter(t => !t.done);
                                const pct = Math.round((completed / tasks.length) * 100);
                                return (
                                    <div className="mx-5 mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-primary">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                                                    <ShieldCheck className="w-5 h-5 text-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-muted-foreground">Finish setup to start receiving brand deals</p>
                                                    <p className="text-[12px] text-muted-foreground">{completed}/{tasks.length} done • {pct}%</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setCompletionDismissed(true)} className="p-1 rounded-full hover:bg-primary active:scale-95">
                                                <X className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-primary rounded-full mb-3 overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setActiveTab('profile');
                                                    setActiveSettingsPage('portfolio');
                                                }}
                                                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-card border border-primary text-primary active:scale-95"
                                            >
                                                Set rates
                                            </button>
                                            <button
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setActiveTab('profile');
                                                    setActiveSettingsPage('payouts');
                                                }}
                                                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-card border border-primary text-primary active:scale-95"
                                            >
                                                Add payout method
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* PWA Install Banner (Android only) */}
                            {canInstall && (
                                <div className="mx-5 mb-4 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-info flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-info flex items-center justify-center">
                                            <Download className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-muted-foreground">Install Creator Armour</p>
                                            <p className="text-[11px] text-muted-foreground">Add to home screen for faster access</p>
                                        </div>
                                    </div>
                                    <button onClick={promptInstall} className="text-[11px] font-bold px-4 py-2 rounded-full bg-info text-foreground active:scale-95">Install</button>
                                </div>
                            )}

                            {/* Command Header */}
                            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                                <div className="flex items-center justify-between mb-8">
                                    {/* Left: Sidebar Menu */}
                                    <button type="button" onClick={() => handleAction('menu')} aria-label="Open menu" className={cn("p-1.5 -ml-1.5 rounded-full transition-all active:scale-95", secondaryTextColor)}>
                                        <Menu className="w-6 h-6" strokeWidth={1.5} />
                                    </button>

                                    {/* Center: Wordmark + Connection Status */}
                                    <div className="flex items-center gap-1.5 font-semibold text-[16px] tracking-tight">
                                        <ShieldCheck className={cn("w-4 h-4", isDark ? "text-foreground" : "text-muted-foreground")} />
                                        <span className={textColor}>CreatorArmour</span>
                                        {healthStatus !== 'connected' && (
                                            <span className="text-[10px] text-muted-foreground/50 font-medium">
                                                {healthStatus === 'checking' ? '· connecting' : '· offline'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Right: Actions & Avatar */}
                                    <div className="flex items-center gap-2">
                                        {/* Preview collab link */}
                                        {profile?.instagram_handle && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const handle = (profile.instagram_handle || '').replace('@', '').trim();
                                                        if (handle) window.open(`/${handle}`, '_blank');
                                                    }}
                                                    className={cn("p-1.5 rounded-full transition-all active:scale-95", secondaryTextColor)}
                                                    title="Preview your collab page"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const handle = (profile.instagram_handle || '').replace('@', '').trim();
                                                        const url = `${window.location.origin}/${handle}`;
                                                        const text = `Check out my collab page on Creator Armour 👇`;
                                                        // Show share options
                                                        if (navigator.share) {
                                                            navigator.share({ title: `${profile.first_name || 'My'} Collab Link`, text, url });
                                                        } else {
                                                            navigator.clipboard.writeText(url);
                                                            toast.success('Collab link copied!');
                                                        }
                                                    }}
                                                    className={cn("p-1.5 rounded-full transition-all active:scale-95", secondaryTextColor)}
                                                    title="Share your deal page"
                                                >
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Dark / Light toggle */}
                                        <motion.button
                                            onClick={() => { triggerHaptic(); setTheme(t => t === 'dark' ? 'light' : 'dark'); }}
                                            whileTap={{ scale: 0.92 }}
                                            className={cn(
                                                "flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all duration-300",
                                                isDark
                                                    ? "bg-background border-border text-warning"
                                                    : "bg-background border-border text-muted-foreground"
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

                                        {/* Notification Permission Prompt */}
                                        <NotificationPermission />

                                        {/* Bell */}
                                        <button type="button" onClick={() => handleAction('notifications')} aria-label={`Notifications${collabRequests.length > 0 ? ` (${collabRequests.length} new)` : ''}`} className={cn('relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full', secondaryTextColor)}>
                                            <Bell className="w-5 h-5" />
                                            {collabRequests.length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 text-[8px] font-black flex items-center justify-center text-foreground" style={{ borderColor: bgColor }}>
                                                    {collabRequests.length}
                                                </span>
                                            )}
                                        </button>

                                        {/* Avatar with Verification Badge */}
                                        <div className="relative">
                                            <button type="button" onClick={() => setActiveTab('profile')} className={cn("w-11 h-11 rounded-full border overflow-hidden transition-all active:scale-95", borderColor)}>
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
                                            {/* Verification Badge — show when profile is verified/onboarding complete */}
                                            {(profile?.payout_verified || profile?.onboarding_complete) && (
                                                <div className="absolute -bottom-0.5 -right-0.5">
                                                    <VerificationBadge size="sm" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Greeting / Status */}
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                    <div className="flex items-center justify-between">
                                        {!profile ? (
                                            /* Profile loading skeleton */
                                            <div className="flex-1 space-y-2">
                                                <ShimmerSkeleton className="h-5 w-40" />
                                                <ShimmerSkeleton className="h-4 w-24" />
                                            </div>
                                        ) : (
                                            <>
                                                <h1 className={cn('text-[18px] font-semibold tracking-tight', textColor)}>
                                                    {(() => {
                                                        const hour = new Date().getHours();
                                                        const name = (profile?.first_name || '').trim();
                                                        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                                                        return name ? `${greeting}, ${name}` : greeting;
                                                    })()}
                                                </h1>
                                                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full", isDark ? "bg-primary/10" : "bg-primary")}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[10px] uppercase font-bold tracking-[0.06em] text-primary dark:text-primary">Active</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {profile && (
                                        <p className={cn('text-[15px] font-semibold mt-0', isDark ? "text-foreground/70" : "text-muted-foreground")}>
                                            @{username}
                                        </p>
                                    )}
                                </motion.div>
                            </div>

                            {shouldShowPushPrompt && (
                                <div className="px-5 mb-6">
                                    <div className={cn("p-5 rounded-[2rem] border relative overflow-hidden", isDark ? "bg-card border-[#2C2C2E]" : "bg-card border-border shadow-sm")}>
                                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                                        <div className="flex items-start gap-3">
                                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-primary/15" : "bg-primary")}>
                                                <Bell className={cn("w-5 h-5", isDark ? "text-primary" : "text-primary")} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn("text-[14px] font-bold tracking-tight", textColor)}>Enable Deal Alerts</p>
                                                <p className={cn("text-[12px] mt-1 opacity-60 leading-relaxed", textColor)}>
                                                    Get instant notifications when a brand sends you a collaboration request.
                                                </p>
                                                <div className="mt-4 flex gap-2">
                                                    <button type="button"
                                                        onClick={async () => {
                                                            triggerHaptic();
                                                            if (isIOSNeedsInstall) {
                                                                setShowPushInstallGuide(true);
                                                                return;
                                                            }
                                                            if (pushPermission === 'denied') {
                                                                toast.error("Notifications are blocked. Enable them in browser settings.");
                                                                return;
                                                            }
                                                            const res = await enableNotifications();
                                                            if (res.success) toast.success("Push notifications enabled!");
                                                            else toast.error("Couldn’t enable notifications.", { description: res.reason || 'Unknown reason' });
                                                        }}
                                                        className="flex-1 h-11 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all bg-primary text-foreground hover:bg-primary"
                                                    >
                                                        Enable
                                                    </button>
                                                    <button type="button"
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            dismissPushPrompt();
                                                        }}
                                                        className={cn(
                                                            "h-11 px-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all",
                                                            isDark ? "border-border bg-card text-foreground/80 hover:bg-secondary/50" : "border-border bg-card text-muted-foreground hover:bg-background"
                                                        )}
                                                    >
                                                        Not now
                                                    </button>
                                                </div>
                                                {isIOSNeedsInstall && (
                                                    <p className={cn("text-[11px] mt-3", isDark ? "text-warning/80" : "text-warning")}>
                                                        iPhone/iPad: install to Home Screen first (no “Allow” popup will show in a Safari tab).
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Share Link CTA - only for new accounts with no activity */}
                            {activeDealsCount === 0 && pendingOffersCount === 0 && (!profile?.instagram_handle || !profile?.bio) && (
                                <div className="px-5 mb-4">
                                    <div className={cn("p-5 rounded-2xl border", isDark ? "bg-card border-[#2C2C2E]" : "bg-[#DCFCE7] border-[#16A34A]/20")}>
                                        <p className={cn("text-[14px] font-bold mb-3", isDark ? "text-foreground" : "text-[#0F172A]")}>Share your link to get your first offer</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic();
                                                setShowShareSheet(true);
                                            }}
                                            className={cn(
                                                "h-11 px-5 rounded-xl text-[13px] font-black transition-all active:scale-[0.98]",
                                                isDark ? "bg-primary text-foreground" : "bg-[#16A34A] text-white"
                                            )}
                                        >
                                            Share Link
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Avoid showing a confusing "₹0 Pending Amount" banner for brand-new accounts */}
                            {!(activeDealsCount === 0 && pendingOffersCount === 0 && monthlyRevenue === 0 && collabRequests.length === 0 && pendingAmount === 0) && (
                            <div className="px-5 mb-5">
                                <motion.div
                                    initial={{ scale: 0.98, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.08 }}
                                    className={cn(
                                        "py-5 px-5 rounded-[2rem] shadow-xl border-0 relative overflow-hidden",
                                        isDark
                                            ? "bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 shadow-blue-500/20"
                                            : "bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-700 shadow-blue-500/15"
                                    )}
                                    onClick={() => { triggerHaptic(); setActiveTab('deals'); }}
                                    role="button"
                                    aria-label="View pending deals"
                                >
                                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/15 rounded-full blur-3xl" />
                                    <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full blur-3xl" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/85">Pending Amount</p>
                                                <p className="text-[11px] font-semibold text-white/75 mt-1">Released after content approval</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/30">
                                                <Clock className="w-4 h-4 text-white" />
                                            </div>
                                        </div>

                                        <div className="flex items-end gap-1 mb-4 font-outfit text-white">
                                            <span className="text-2xl font-bold opacity-80">₹</span>
                                            <span className="text-4xl font-black tracking-tight">
                                                <AnimatedCounter value={pendingAmount} />
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-xl bg-black/10 backdrop-blur-md border border-white/25 w-fit">
                                            <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                                                <ShieldCheck className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-[9px] font-black text-white tracking-[0.15em] uppercase">Creator Armour protection active</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                            )}

                            {/* Empty State vs Normal Metrics */}
                            {activeDealsCount === 0 && pendingOffersCount === 0 && monthlyRevenue === 0 && collabRequests.length === 0 ? (
                                <>
                                    {/* Empty State Hero - Improved */}
                                    <div className="px-5 mb-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "p-5 rounded-[2rem] border relative overflow-hidden",
                                                isDark ? "bg-card border-[#2C2C2E]" : "bg-white border-[#E5E7EB] shadow-sm"
                                            )}
                                        >
                                            <h2 className={cn("text-[22px] font-black mb-2 tracking-tight", isDark ? "text-foreground" : "text-[#0F172A]")}>No brand requests yet 👀</h2>
                                            <p className={cn("text-[14px] font-medium mb-5 leading-relaxed", isDark ? "text-foreground/70" : "text-[#64748B]")}>
                                                When brands submit briefs through your collab link, they'll appear here.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setShowActionSheet(false);
                                                    handleShareOnWhatsApp();
                                                }}
                                                className={cn(
                                                    "h-12 px-6 rounded-2xl flex items-center justify-center font-black text-[14px] active:scale-[0.98] transition-all",
                                                    isDark ? "bg-primary text-foreground" : "bg-[#16A34A] text-white"
                                                )}
                                            >
                                                Share Link
                                            </button>
                                        </motion.div>
                                    </div>

                                    {/* Beautiful Collab Link Card - moved below empty state */}
                                    <div className="px-5 mb-8">
                                        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-card border-[#2C2C2E]" : "bg-white border-[#E5E7EB]")}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", textColor)}>Your link</p>
                                                <p className={cn("text-[10px] font-medium", secondaryTextColor)}>Send this when a brand asks to collaborate</p>
                                            </div>

                                            <div className={cn("px-4 py-3 rounded-xl font-mono text-[12px] border mb-3", isDark ? "bg-background border-border text-foreground" : "bg-[#F8FAF9] border-[#E5E7EB] text-[#0F172A]")}>
                                                creatorarmour.com/{profile?.handle || username || 'creator'}
                                            </div>

                                            <div className="flex gap-2">
                                                <button type="button"
                                                    onClick={() => {
                                                        handleShareOnWhatsApp();
                                                    }}
                                                    className={cn(
                                                        "flex-1 h-10 rounded-xl flex items-center justify-center font-black text-[12px] active:scale-95 transition-all",
                                                        isDark ? "bg-primary text-foreground" : "bg-[#16A34A] text-white"
                                                    )}
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp
                                                </button>
                                                <button type="button"
                                                    onClick={() => {
                                                        handleCopyStorefront();
                                                    }}
                                                    className={cn(
                                                        "h-10 px-4 rounded-xl flex items-center justify-center border font-black text-[12px] active:scale-95 transition-all",
                                                        isCollabLinkCopied
                                                            ? "bg-[#16A34A] border-[#16A34A] text-white"
                                                            : isDark ? "bg-background border-border text-foreground" : "bg-white border-[#E5E7EB] text-[#0F172A]"
                                                    )}
                                                >
                                                    {isCollabLinkCopied ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>

                                            <div className={cn(
                                                "mt-4 rounded-[24px] border p-4 overflow-hidden relative",
                                                isDark ? "bg-[#0F172A] border-border" : "bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfa_100%)] border-slate-200"
                                            )}>
                                                <div className={cn(
                                                    "absolute inset-x-0 top-0 h-20 opacity-80 pointer-events-none",
                                                    isDark
                                                        ? "bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10"
                                                        : "bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50"
                                                )} />
                                                <div className="relative">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-3", isDark ? "text-white/55" : "text-slate-500")}>
                                                        What brands will see
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-2xl overflow-hidden border border-border shrink-0">
                                                            <img
                                                                src={avatarUrl}
                                                                alt="creator preview avatar"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.currentTarget as HTMLImageElement).onerror = null;
                                                                    (e.currentTarget as HTMLImageElement).src = avatarFallbackUrl;
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={cn("text-[17px] font-black tracking-tight truncate", isDark ? "text-white" : "text-slate-900")}>
                                                                {profile?.first_name || username || 'Creator'}
                                                            </p>
                                                            <p className={cn("text-[13px] font-semibold", isDark ? "text-emerald-300" : "text-emerald-700")}>
                                                                @{profile?.instagram_handle || username || 'creator'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className={cn("mt-3 text-[13px] leading-relaxed max-w-[260px]", isDark ? "text-white/70" : "text-slate-600")}>
                                                        Brands open your creator link, choose a service, and send you an offer here.
                                                    </p>
                                                    <div className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-5 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                                                        Send Offer
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>

                            ) : (
                                <>

                                    {/* Metrics Strip */}
                                    <div className="px-5 mb-8">
                                        {/* Premium Earnings Card */}
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className={cn(
                                                "py-8 px-8 rounded-[2rem] shadow-xl shadow-emerald-500/20 border-0 mb-6 bg-gradient-to-br relative overflow-hidden",
                                                isDark
                                                    ? "from-emerald-400 via-cyan-500 to-blue-600"
                                                    : "bg-primary from-emerald-600 via-teal-500 to-blue-700"
                                            )}
                                        >
                                            {/* Decorative elements */}
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/50 rounded-full blur-3xl" />
                                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-info/20 rounded-full blur-3xl home-card-glow" />

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between text-foreground/90 mb-3">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Monthly Revenue</span>
                                                    <Zap className="w-4 h-4 fill-white text-foreground opacity-80" />
                                                </div>
                                                <div className="text-4xl font-black text-foreground mb-6 flex items-baseline gap-1 font-outfit">
                                                    <span className="text-2xl font-bold opacity-70">₹</span>
                                                    <AnimatedCounter value={monthlyRevenue} />
                                                </div>
                                                <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-xl bg-black/10 backdrop-blur-md border border-border w-fit">
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                        <CheckCircle2 className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-foreground tracking-[0.15em] uppercase">Secured by Armour</span>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Row 2: Active & Pending Deals (Side by side) */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setActiveTab('deals');
                                                    setCollabSubTab('active');
                                                }}
                                                className={cn('p-5 rounded-[16px] border shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95', cardBgColor, borderColor)}
                                            >
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <Briefcase className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                                                    <span className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Active Deals</span>
                                                </div>
                                                <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{activeDealsCount}</p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setActiveTab('deals');
                                                    setCollabSubTab('pending');
                                                }}
                                                className={cn('p-5 rounded-[16px] border shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95', cardBgColor, borderColor)}
                                            >
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <Handshake className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                                                    <span className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Pending Offers</span>
                                                </div>
                                                <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{pendingOffersCount}</p>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Intake Link Promoters / Quick Share */}
                                    <div className="px-5 mb-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                            className={cn(
                                                "p-6 rounded-[2.5rem] border relative overflow-hidden group",
                                                isDark ? "bg-background border-border/5" : "bg-card border-border shadow-sm"
                                            )}
                                        >
                                            {/* Simple animated background element */}
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                                <Link2 size={120} />
                                            </div>

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-2xl bg-info/10 flex items-center justify-center">
                                                    <Link2 className="w-5 h-5 text-info" />
                                                </div>
                                                <div>
                                                    <h3 className={cn("text-[15px] font-bold tracking-tight", textColor)}>Promote Collab Link</h3>
                                                    <p className={cn("text-[11px] opacity-40 uppercase font-black tracking-widest", textColor)}>Quick Share Tools</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2.5">
                                                <button type="button"
                                                    onClick={handleCopyStorefront}
                                                    className={cn(
                                                        "flex-1 flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]",
                                                        isDark ? "bg-card border-border hover:bg-secondary/50" : "bg-background border-border hover:bg-background shadow-sm"
                                                    )}
                                                >
                                                    <Copy className="w-4 h-4 mb-2 opacity-60" />
                                                    <span className={cn("text-[11px] font-bold font-outfit", textColor)}>Copy Bio Link</span>
                                                </button>
                                                <button type="button"
                                                    onClick={handleCopyDMReply}
                                                    className={cn(
                                                        "flex-1 flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]",
                                                        isDark ? "bg-card border-border hover:bg-secondary/50" : "bg-background border-border hover:bg-background shadow-sm"
                                                    )}
                                                >
                                                    <MessageSquare className="w-4 h-4 mb-2 opacity-60" />
                                                    <span className={cn("text-[11px] font-bold font-outfit", textColor)}>Copy DM Reply</span>
                                                </button>
                                            </div>

                                            <p className={cn("text-[10px] text-center mt-3 opacity-40 font-medium italic", textColor)}>
                                                Pro tip: Direct brands to your intake storefront
                                            </p>
                                        </motion.div>
                                    </div>
                                </>
                            )}

                            {/* Brand Offers Section */}
                            <div className="px-5 mb-8">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className={cn('text-[16px] font-medium tracking-tight', textColor)}>Active Collaborations</h2>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {(() => {
                                        const fakeDemoOffer = {
                                            id: 'demo-offer',
                                            brand_name: 'Zepto (Demo)',
                                            brand_logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Zepto_logo.svg/100px-Zepto_logo.svg.png',
                                            category: 'Quick Commerce',
                                            collab_type: 'paid',
                                            exact_budget: 35000,
                                            deliverables: ['1 Reel', '2 Stories'],
                                            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                                            status: 'new',
                                            isDemo: true
                                        };
                                        const displayOffers = [
                                            ...pendingOffersDeduplicated,
                                            ...(brandDeals || [])
                                                .filter(d => {
                                                    const s = (d.status || '').toLowerCase();
                                                    return s !== 'completed' && s !== 'cancelled';
                                                })
                                                .map(d => ({ ...d, isConfirmedDeal: true }))
                                                .slice(0, 5)
                                        ];

                                        if (displayOffers.length === 0 && isDemoOfferEnabled) {
                                            displayOffers.push(fakeDemoOffer);
                                        }
                                        return (
                                            <div className="space-y-10">
                                                {displayOffers.length === 0 ? (
                                                    <div className={cn(
                                                        "p-6 rounded-[2rem] border text-center",
                                                        isDark ? "bg-card border-border" : "bg-card border-border shadow-sm"
                                                    )}>
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                            <Briefcase className="w-7 h-7 text-white" />
                                                        </div>
                                                        <h3 className={cn("text-[18px] font-black tracking-tight mb-2 font-outfit", textColor)}>Share your link to get brand requests</h3>
                                                        <p className={cn("text-[13px] leading-relaxed opacity-70 mb-5", textColor)}>
                                                            Share your collab link with brands — they'll submit briefs through it.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                handleShareStorefront();
                                                            }}
                                                            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[13px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                        >
                                                            Share Link Now
                                                        </button>
                                                    </div>
                                                ) : null}
                                                {displayOffers.map((req: any, idx) => {
                                                    // Format deliverables accurately
                                                    let deliverablesArr: string[] = ['1 Reel', '1 Story', '1 Post'];
                                                    const rawDeliv = req.raw?.deliverables || req.deliverables;

                                                    const processDeliverableItems = (items: any[]) => {
                                                        return items.map((d: any) => {
                                                            if (typeof d === 'string') return d;
                                                            if (d && typeof d === 'object') {
                                                                if (d.contentType && d.count) return `${d.count} ${d.contentType}`;
                                                                return JSON.stringify(d); // fallback
                                                            }
                                                            return String(d);
                                                        });
                                                    };

                                                    if (rawDeliv) {
                                                        if (Array.isArray(rawDeliv)) {
                                                            deliverablesArr = processDeliverableItems(rawDeliv);
                                                        } else if (typeof rawDeliv === 'string') {
                                                            try {
                                                                const parsed = JSON.parse(rawDeliv);
                                                                deliverablesArr = Array.isArray(parsed) ? processDeliverableItems(parsed) : [parsed.toString()];
                                                            } catch (e) {
                                                                deliverablesArr = [rawDeliv];
                                                            }
                                                        }
                                                    }

                                                    // Clean up deliverables (remove any stray brackets/quotes if they slipped through)
                                                    deliverablesArr = deliverablesArr.map(d => d.replace(/[\[\]"'{}]/g, ''));

                                                    // Determine Deadline text
                                                    let deadlineText = '';
                                                    if (req.deadline || req.due_date) {
                                                        const dDate = new Date(req.deadline || req.due_date);
                                                        const diffDays = Math.ceil((dDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        deadlineText = diffDays > 0 ? `${diffDays}d left` : 'Past Due';
                                                    }

                                                    // Mock/Get ID and time

                                                    return (
                                                        <motion.div
                                                            key={req.id || idx}
                                                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onTap={() => {
                                                                console.log("Card tapped: (main block)", req);
                                                                triggerHaptic();
                                                                setSelectedItem(req);
                                                                setSelectedType(req.isConfirmedDeal ? 'deal' : 'offer');
                                                            }}
                                                            className={cn(
                                                                'rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.99] relative',
                                                                isDark
                                                                    ? 'bg-background/80 backdrop-blur-sm border border-border/50 hover:border-border'
                                                                    : 'bg-card border-border shadow-lg hover:shadow-xl hover:border-border'
                                                            )}
                                                        >
                                                            {/* Collab type accent strip */}
                                                            <div className={cn("h-[4px] w-full", req.collab_type === 'barter' ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-600')} />

                                                            {req.isDemo && (
                                                                <div className="bg-info/10 border-b border-info/20 px-4 py-2.5 flex flex-col items-center justify-center gap-1">
                                                                    <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-info flex items-center gap-1.5"><Zap className="w-3 h-3 fill-blue-500" /> Interactive Demo Offer</span>
                                                                    <span className="text-[10px] text-info/70 dark:text-info/70 font-medium text-center">This is a sample deal so you can understand how Creator Armour works.</span>
                                                                </div>
                                                            )}

                                                            <div className="px-5 py-4">
                                                                {/* Row 1: Logo + Brand name + type tag + Budget */}
                                                                <div className="flex items-start gap-3 mb-3">
                                                                    {/* Logo with gradient border based on type */}
                                                                    <div className={cn(
                                                                        "w-12 h-12 rounded-xl border overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105",
                                                                        req.collab_type === 'barter'
                                                                            ? (isDark ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-warning/30" : "bg-gradient-to-br from-amber-50 to-orange-50 border-warning")
                                                                            : (isDark ? "bg-gradient-to-br from-blue-500/10 to-violet-500/10 border-violet-500/30" : "bg-gradient-to-br from-blue-50 to-violet-50 border-violet-200")
                                                                    )}>
                                                                        {getBrandIcon(req.brand_logo || req.brand_logo_url || req.logo_url || req.raw?.brand_logo || req.raw?.brand_logo_url || req.raw?.logo_url, req.category, req.brand_name)}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        {/* Brand name + type badge */}
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className={cn("text-[15px] font-bold leading-tight truncate", isDark ? "text-foreground" : "text-muted-foreground")}>
                                                                                {(req.brand_name || 'Brand').replace(/\s*\(Free products Demo\)\s*/i, '').replace(/\s*\(Demo\)\s*/i, '')}
                                                                            </p>
                                                                            {req.isConfirmedDeal ? (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/15">
                                                                                    🔥 Active
                                                                                </span>
                                                                            ) : req.collab_type === 'barter' ? (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-warning border border-warning/20">
                                                                                    🎁 Free products
                                                                                </span>
                                                                            ) : req.collab_type === 'hybrid' ? (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-500 border border-violet-500/15">
                                                                                    🤝 Hybrid
                                                                                </span>
                                                                            ) : req.collab_type === 'affiliate' ? (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-primary border border-primary/15">
                                                                                    📈 Affiliate
                                                                                </span>
                                                                            ) : (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-info border border-info/15">
                                                                                    💳 Paid
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {/* Category + Verified */}
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={cn("text-[12px] font-medium", secondaryTextColor)}>{req.category || 'Lifestyle'}</span>
                                                                            <span className="text-muted-foreground text-[9px]">•</span>
                                                                            <div className="flex items-center gap-0.5">
                                                                                <ShieldCheck className="w-3 h-3 text-info" strokeWidth={2.5} />
                                                                                <span className={cn("text-[11px] font-semibold text-info", isDark ? "text-info" : "text-info")}>Verified</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Budget — more prominent */}
                                                                    <div className="shrink-0 text-right">
                                                                        <p className={cn("text-[20px] font-black tracking-tight leading-none", isDark ? "text-foreground" : "text-muted-foreground")}>
                                                                            {req.exact_budget || req.deal_amount ? `₹${(req.exact_budget || req.deal_amount).toLocaleString()}`
                                                                                : req.barter_value ? `₹${(req.barter_value / 1000).toFixed(0)}K`
                                                                                    : (req.budget_range || '₹75K')}
                                                                        </p>
                                                                        <p className={cn("text-[9px] font-bold uppercase tracking-widest", req.collab_type === 'barter' ? "text-warning" : (isDark ? "text-muted-foreground" : "text-muted-foreground"))}>
                                                                            {req.collab_type === 'barter' ? 'Product Val.' : 'Cash'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Row 2: Deliverables + Deadline */}
                                                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                                    {deliverablesArr.map((d, i) => (
                                                                        <span key={i} className={cn(
                                                                            "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                                                            isDark ? "bg-background/50 border-border/50 text-muted-foreground" : "bg-background border-border text-muted-foreground"
                                                                        )}>
                                                                            {d}
                                                                        </span>
                                                                    ))}
                                                                    <span className={cn(
                                                                        "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all",
                                                                        isDark ? "bg-background/50 border-border/50 text-muted-foreground" : "bg-background border-border text-muted-foreground"
                                                                    )}>
                                                                        📅 {(req.deadline || req.due_date) ? new Date(req.deadline || req.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '21 Mar'}
                                                                    </span>
                                                                    {deadlineText && (
                                                                        <span className={cn(
                                                                            "px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all animate-pulse",
                                                                            isDark ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-warning/30 text-warning" : "bg-gradient-to-r from-amber-50 to-orange-50 border-warning text-warning"
                                                                        )}>
                                                                            ⚡{deadlineText}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Row 3: Action buttons */}
                                                                <div className="flex gap-2">
                                                                    <button type="button"
                                                                        onClick={(e) => { e.stopPropagation(); triggerHaptic(); setSelectedItem(req); setSelectedType(req.isConfirmedDeal ? 'deal' : 'offer'); }}
                                                                        className={cn(
                                                                            "flex-1 h-11 rounded-xl font-semibold text-[12px] border transition-all active:scale-[0.96]",
                                                                            isDark
                                                                                ? "border-border/50 text-muted-foreground hover:bg-card hover:border-border bg-background/30"
                                                                                : "border-border text-muted-foreground hover:bg-background bg-card"
                                                                        )}
                                                                    >
                                                                        Details
                                                                    </button>
                                                                    {!req.isConfirmedDeal && (
                                                                        <button type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (req.isDemo) {
                                                                                    toast.success("This is a demo offer! Complete your profile to get real brand deals.");
                                                                                    triggerHaptic(HapticPatterns.success);
                                                                                    return;
                                                                                }
                                                                                handleAccept(req);
                                                                            }}
                                                                            disabled={processingDeal === req.id}
                                                                            className={cn(
                                                                                "flex-1 h-11 rounded-xl font-bold text-[12px] text-foreground transition-all flex items-center justify-center gap-1.5 active:scale-[0.96] disabled:opacity-50 shadow-lg",
                                                                                req.collab_type === 'barter'
                                                                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25"
                                                                                    : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-blue-500/25"
                                                                            )}
                                                                        >
                                                                            {processingDeal === req.id ? (
                                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                            ) : (
                                                                                'Accept Offer'
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>
                        </>
                    )}

                    {activeTab === 'analytics' && (
                        <>
                            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                                <div className="flex items-center justify-between mb-8">
                                    <button type="button" onClick={() => handleAction('menu')} aria-label="Open menu" className={cn("p-1.5 -ml-1.5 rounded-full transition-all active:scale-95", secondaryTextColor)}>
                                        <Menu className="w-6 h-6" strokeWidth={1.5} />
                                    </button>

                                    <div className="flex items-center gap-1.5 font-semibold text-[16px] tracking-tight">
                                        <ShieldCheck className={cn("w-4 h-4", isDark ? "text-foreground" : "text-muted-foreground")} />
                                        <span className={textColor}>CreatorArmour</span>
                                    </div>

                                    <button type="button" onClick={() => setActiveTab('profile')} className={cn("w-11 h-11 rounded-full border overflow-hidden transition-all active:scale-95", borderColor)}>
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

                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                    <h1 className={cn('text-[22px] font-black tracking-tight font-outfit', textColor)}>Analytics</h1>
                                    <p className={cn('text-[14px] mt-1', secondaryTextColor)}>
                                        Performance, deal insights, payments, and activity are all here now.
                                    </p>
                                </motion.div>
                            </div>

                            <div className="px-5 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-4"
                                >
                                    <h3 className={cn('text-sm font-bold tracking-tight mb-3', textColor)}>Your Performance</h3>
                                </motion.div>
                                <DashboardMetricsCards
                                    totalDealValue={brandDeals?.reduce((sum: number, deal: any) => sum + (deal.deal_amount || 0), 0) || 0}
                                    activeDealCount={activeDealsCount}
                                    outstandingPayments={brandDeals?.filter((d: any) => {
                                        const s = (d.status || '').toLowerCase();
                                        return s.includes('payment_pending') || s.includes('payment_awaiting');
                                    }).reduce((sum: number, deal: any) => sum + (deal.deal_amount || 0), 0) || 0}
                                    avgDealDuration={30}
                                    isDark={isDark}
                                />
                            </div>

                            <div className="px-5 mb-8">
                                <DealSearchFilter
                                    onSearch={(query) => setSearchQuery(query)}
                                    onFilterChange={(filters) => setDealFilters(filters)}
                                    isDark={isDark}
                                    totalDeals={brandDeals?.length || 0}
                                />
                            </div>

                            <div className="px-5 mb-8">
                                <EnhancedInsights isDark={isDark} />
                            </div>

                            <div className="px-5 mb-8">
                                <ActivityFeed isDark={isDark} maxItems={4} />
                            </div>

                            <div className="px-5 mb-8">
                                <PaymentTimeline isDark={isDark} maxItems={5} />
                            </div>

                            <div className="px-5 mb-8">
                                <AchievementBadges isDark={isDark} showUnlocked={true} />
                            </div>

                            <div className="px-5 mb-8">
                                <DealStatusFlow isDark={isDark} />
                            </div>

                            <div className="px-5 mb-8">
                                <DealTimelineView isDark={isDark} />
                            </div>

                            <div className="px-5 mb-8">
                                <SmartNotificationsCenter isDark={isDark} />
                            </div>

                            <div className="px-5 mb-8">
                                <DealComparison isDark={isDark} />
                            </div>
                        </>
                    )}

                    {/* ─── COLLABS TAB ─── */}
                    {activeTab === 'deals' && (
                        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {/* Toggle Header */}
                            <div className={cn(
                                "sticky top-0 z-20 -mx-5 px-5 pt-2 pb-3 mb-4",
                                isDark ? "bg-[#061318]/70 backdrop-blur-xl border-b border-border" : "bg-secondary/80 backdrop-blur-xl border-b border-border"
                            )}>
                                <div className={cn("flex p-1.5 rounded-2xl", isDark ? "bg-card" : "bg-background")}>
                                    <button type="button"
                                        onClick={() => {
                                            triggerHaptic();
                                            setCollabSubTab('pending');
                                            const next = new URLSearchParams(searchParams);
                                            next.set('tab', 'deals');
                                            next.set('subtab', 'pending');
                                            next.delete('requestId');
                                            setSearchParams(next, { replace: true });
                                        }}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                            collabSubTab === 'pending'
                                                ? "bg-info text-foreground shadow-xl shadow-blue-500/20"
                                                : cn("opacity-70", textColor)
                                        )}
                                    >
                                        New Offers
                                    </button>
                                    <button type="button"
                                        onClick={() => {
                                            triggerHaptic();
                                            setCollabSubTab('active');
                                            const next = new URLSearchParams(searchParams);
                                            next.set('tab', 'deals');
                                            next.set('subtab', 'active');
                                            next.delete('requestId');
                                            setSearchParams(next, { replace: true });
                                        }}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                            collabSubTab === 'active'
                                                ? "bg-info text-foreground shadow-xl shadow-blue-500/20"
                                                : cn("opacity-70", textColor)
                                        )}
                                    >
                                        Active Deals
                                    </button>
                                    <button type="button"
                                        onClick={() => {
                                            triggerHaptic();
                                            setCollabSubTab('completed');
                                            const next = new URLSearchParams(searchParams);
                                            next.set('tab', 'deals');
                                            next.set('subtab', 'completed');
                                            next.delete('requestId');
                                            setSearchParams(next, { replace: true });
                                        }}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                            collabSubTab === 'completed'
                                                ? "bg-info text-foreground shadow-xl shadow-blue-500/20"
                                                : cn("opacity-70", textColor)
                                        )}
                                    >
                                        Completed
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
                                        className={cn("p-5 rounded-2xl border mb-5", cardBgColor, borderColor)}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className={cn("text-xl font-bold", textColor)}>Active Deals</h2>
                                            {activeDealsCount > 0 && (
                                                <span className="px-3 py-1 bg-info/10 text-info rounded-full text-xs font-bold">
                                                    {activeDealsCount} live
                                                </span>
                                            )}
                                        </div>

                                        {activeDealsCount > 0 ? (
                                            <div className="space-y-4">
                                                {(() => {
                                                    const insights = activeDealsList.slice(0, 50).reduce(
                                                        (acc: any, deal: any) => {
                                                            const ux = getCreatorDealCardUX(deal);
                                                            if (ux.needsSignature) acc.signature += 1;
                                                            if (ux.isRevisionRequested) acc.revision += 1;
                                                            if (ux.isMaking) acc.drafts += 1;
                                                            if (ux.urgencyLevel === 'critical' && !String(deal?.status || '').toLowerCase().includes('completed')) acc.risk += 1;
                                                            return acc;
                                                        },
                                                        { signature: 0, revision: 0, drafts: 0, risk: 0 }
                                                    );

                                                    const items: Array<{ label: string; count: number; tone: 'amber' | 'red' | 'blue' }> = [
                                                        { label: 'Signature pending', count: insights.signature, tone: 'amber' },
                                                        { label: 'Revision requested', count: insights.revision, tone: 'red' },
                                                        { label: 'Drafts to submit', count: insights.drafts, tone: 'blue' },
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
                                                            className={cn(
                                                                "p-4 rounded-2xl border mb-1 transition-all active:scale-[0.99]",
                                                                isDark ? "bg-card hover:bg-secondary/50" : "bg-background hover:bg-card",
                                                                borderColor
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-60 truncate", textColor)}>Needs attention</p>
                                                                </div>
                                                                {insights.risk > 0 && (
                                                                    <span
                                                                        className={cn(
                                                                            "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border shrink-0",
                                                                            isDark ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-destructive text-destructive border-destructive"
                                                                        )}
                                                                    >
                                                                        {insights.risk} AT RISK
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                {items.map((it) => {
                                                                    const pluralize = (singular: string, plural: string) => (it.count === 1 ? singular : plural);
                                                                    const label =
                                                                        it.label === 'Signature pending'
                                                                            ? pluralize('Signature pending', 'Signatures pending')
                                                                            : it.label === 'Revision requested'
                                                                                ? pluralize('Revision requested', 'Revisions requested')
                                                                                : it.label === 'Drafts to submit'
                                                                                    ? pluralize('Draft to submit', 'Drafts to submit')
                                                                                    : it.label;

                                                                    const toneCls =
                                                                        it.tone === 'amber'
                                                                            ? (isDark ? "bg-warning/10 text-warning border-warning/20" : "bg-warning text-warning border-warning")
                                                                            : it.tone === 'red'
                                                                                ? (isDark ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-destructive text-destructive border-destructive")
                                                                                : (isDark ? "bg-info/10 text-info border-info/20" : "bg-info text-info border-info");

                                                                    const onChip = () => {
                                                                        triggerHaptic();
                                                                        const target =
                                                                            it.label === 'Signature pending'
                                                                                ? activeDealsList.find((d: any) => getCreatorDealCardUX(d).needsSignature)
                                                                                : it.label === 'Revision requested'
                                                                                    ? activeDealsList.find((d: any) => getCreatorDealCardUX(d).isRevisionRequested)
                                                                                    : activeDealsList.find((d: any) => getCreatorDealCardUX(d).isMaking);
                                                                        if (target) {
                                                                            setSelectedItem(target);
                                                                            setSelectedType('deal');
                                                                        }
                                                                    };

                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            key={it.label}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onChip();
                                                                            }}
                                                                            className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border", toneCls)}
                                                                        >
                                                                            {it.count} {label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                {activeDealsList.slice(0, 10).map((deal: any, idx: number) => {
                                                    const ux = getCreatorDealCardUX(deal);

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
                                                                "p-4 rounded-2xl border transition-all duration-200 group active:scale-[0.99] hover:-translate-y-[1px] relative cursor-pointer",
                                                                borderColor,
                                                                isDark ? "bg-card active:bg-secondary/50" : "bg-card shadow-sm active:bg-background"
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
                                                                        ? (isDark ? "text-destructive" : "text-destructive")
                                                                        : ux.urgencyLevel === 'warning'
                                                                            ? (isDark ? "text-warning" : "text-warning")
                                                                            : (isDark ? "text-warning" : "text-warning");

                                                                const cta = getDealPrimaryCta({ role: 'creator', deal });
                                                                const ctaLabel = cta.label;
                                                                const contractSigned =
                                                                    !ux.needsSignature &&
                                                                    (ux.rawStatus.includes('fully_executed') ||
                                                                        ux.rawStatus === 'signed' ||
                                                                        ux.rawStatus.includes('content_') ||
                                                                        ux.rawStatus.includes('payment_released') ||
                                                                        ux.rawStatus.includes('completed'));

                                                                return (
                                                                    <>
                                                                        <div className="flex items-start justify-between gap-3 mb-3">
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0 shadow-sm">
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
                                                                                <p className={cn("text-[18px] font-black tracking-tight leading-none", isDark ? "text-foreground" : "text-muted-foreground")}>
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
                                                                        </div>

                                                                        <p className={cn(
                                                                            "text-[12px] font-bold mb-3",
                                                                            ux.needsSignature
                                                                                ? (isDark ? "text-warning" : "text-warning")
                                                                                : contractSigned
                                                                                    ? (isDark ? "text-primary" : "text-primary")
                                                                                    : (isDark ? "text-foreground/70" : "text-muted-foreground")
                                                                        )}>
                                                                            {ux.needsSignature ? '⚠️ Signature required' : contractSigned ? '✅ Contract signed' : (ux.contractLabel || 'In progress')}
                                                                        </p>

                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-1.5">
                                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                                    <span
                                                                                        key={i}
                                                                                        className={cn(
                                                                                            "h-1.5 w-6 rounded-full",
                                                                                            i < ux.progressStep
                                                                                                ? (isDark ? "bg-primary/80" : "bg-primary")
                                                                                                : (isDark ? "bg-secondary/50" : "bg-background")
                                                                                        )}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                            <span className={cn(
                                                                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
                                                                                ux.needsCreatorAction
                                                                                    ? (isDark ? "border-warning/25 bg-warning/10 text-warning" : "border-warning bg-warning text-warning")
                                                                                    : (isDark ? "border-border bg-card text-foreground/60" : "border-border bg-background text-muted-foreground")
                                                                            )}>
                                                                                {ux.stagePill}
                                                                            </span>
                                                                        </div>

                                                                        <button type="button"
                                                                            onPointerDown={(e) => e.stopPropagation()}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                triggerHaptic();
                                                                                setSelectedItem(deal);
                                                                                setSelectedType('deal');
                                                                            }}
                                                                            disabled={cta.disabled}
                                                                            className={cn(
                                                                                "mt-4 h-12 w-full rounded-2xl text-[13px] font-black transition active:scale-[0.98]",
                                                                                dealPrimaryCtaButtonClass(cta.tone),
                                                                                cta.disabled && "opacity-60 cursor-not-allowed active:scale-100"
                                                                            )}
                                                                        >
                                                                            {ctaLabel}
                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "p-6 rounded-[2rem] border text-center",
                                                isDark ? "bg-card border-border" : "bg-card border-border shadow-sm"
                                            )}>
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                    <Zap className="w-7 h-7 text-white" />
                                                </div>
                                                <h3 className={cn("text-[18px] font-black tracking-tight mb-2 font-outfit", textColor)}>Share your link to get brand requests</h3>
                                                <p className={cn("text-[13px] leading-relaxed opacity-70 mb-5", textColor)}>
                                                    Brand briefs submitted through your link will appear here.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        setCollabSubTab('pending');
                                                        const next = new URLSearchParams(searchParams);
                                                        next.set('tab', 'deals');
                                                        next.set('subtab', 'pending');
                                                        setSearchParams(next, { replace: true });
                                                    }}
                                                    className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[13px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                >
                                                    View New Offers
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : collabSubTab === 'completed' ? (
                                    <motion.div
                                        key="completed"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className={cn("p-5 rounded-2xl border mb-5", cardBgColor, borderColor)}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className={cn("text-xl font-bold", textColor)}>Completed</h2>
                                            {completedDealsCount > 0 && (
                                                <span className="px-3 py-1 bg-info/10 text-info rounded-full text-xs font-bold">
                                                    {completedDealsCount} closed
                                                </span>
                                            )}
                                        </div>

                                        {completedDealsCount > 0 ? (
                                            <div className="space-y-4">
                                                {completedDealsList.slice(0, 10).map((deal: any, idx: number) => {
                                                    const ux = getCreatorDealCardUX(deal);
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
                                                                isDark ? "bg-card active:bg-secondary/50" : "bg-card shadow-sm active:bg-background"
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0 shadow-sm">
                                                                        {getBrandIcon(deal.brand_logo || deal.brand_logo_url || deal.logo_url || deal.raw?.brand_logo || deal.raw?.brand_logo_url || (deal as any).brand?.logo_url, deal.category, deal.brand_name)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className={cn("text-[15px] font-bold tracking-tight truncate", textColor)}>{deal.brand_name}</h4>
                                                                        <span className={cn("text-[10px] uppercase font-black tracking-widest opacity-40 mt-0.5", textColor)}>{deal.category || 'Brand'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 pl-3">
                                                                    <div className={cn("text-[17px] font-black tracking-tight leading-none", isDark ? "text-foreground" : "text-muted-foreground")}>
                                                                        ₹{(deal.deal_amount || deal.exact_budget || 0).toLocaleString()}
                                                                    </div>
                                                                    <p className={cn("text-[8px] font-black uppercase tracking-widest opacity-40 mt-1.5", isDark ? "text-muted-foreground" : "text-muted-foreground")}>Earned</p>
                                                                </div>
                                                            </div>

                                                            <div className={cn("text-[11px] font-semibold", isDark ? "text-primary" : "text-primary")}>
                                                                ✅ Completed
                                                            </div>
                                                            <button type="button"
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    triggerHaptic();
                                                                    setSelectedItem(deal);
                                                                    setSelectedType('deal');
                                                                }}
                                                                className={cn(
                                                                    "mt-4 w-full h-12 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95",
                                                                    isDark ? "bg-secondary/50 hover:bg-secondary/15 text-foreground" : "bg-background text-foreground hover:bg-background"
                                                                )}
                                                            >
                                                                {ux.cta || 'View Summary'}
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "p-6 rounded-[2rem] border text-center",
                                                isDark ? "bg-card border-border" : "bg-card border-border shadow-sm"
                                            )}>
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                    <CheckCircle2 className="w-7 h-7 text-white" />
                                                </div>
                                                <h3 className={cn("text-[18px] font-black tracking-tight mb-2 font-outfit", textColor)}>Share your link to get brand requests</h3>
                                                <p className={cn("text-[13px] leading-relaxed opacity-70", textColor)}>
                                                    Share your collab link to receive brand briefs here.
                                                </p>
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
                                                                    : "bg-card shadow-sm hover:shadow-md active:bg-background"
                                                            )}
                                                        >
                                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                <span
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                                                        isDark ? "bg-warning/10 text-warning border-warning/20" : "bg-warning text-warning border-warning"
                                                                    )}
                                                                >
                                                                    <AlertTriangle className={cn("w-3.5 h-3.5", isDark ? "text-warning" : "text-warning")} strokeWidth={3} />
                                                                    Action required
                                                                </span>
                                                            </div>
                                                            <div className="flex items-start justify-between mb-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-border shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300">
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
                                                                    <div className={cn("text-[17px] font-black tracking-tight leading-none", isDark ? "text-foreground" : "text-muted-foreground")}>
                                                                        ₹{Number(deal.deal_amount || 0).toLocaleString()}
                                                                    </div>
                                                                    <p className={cn("text-[8px] font-black uppercase tracking-widest opacity-40 mt-1.5", isDark ? "text-muted-foreground" : "text-muted-foreground")}>Campaign budget</p>
                                                                </div>
                                                            </div>

                                                            <button type="button"
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
                                                                idx === 0 && !req.isConfirmedDeal
                                                                    ? "p-5 rounded-[24px] border-2 transition-all duration-300 group active:scale-[0.99] relative cursor-pointer shadow-lg"
                                                                    : "p-4 rounded-2xl border transition-all duration-300 group active:scale-[0.99] relative cursor-pointer",
                                                                borderColor,
                                                                idx === 0 && !req.isConfirmedDeal
                                                                    ? (
                                                                        isDark
                                                                            ? "bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.92))] border-emerald-400/30 hover:bg-[#111827]/95 shadow-[0_12px_30px_rgba(16,185,129,0.14)]"
                                                                            : "bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] border-emerald-200 shadow-[0_16px_35px_rgba(16,185,129,0.08)]"
                                                                    )
                                                                    : (
                                                                        isDark
                                                                            ? "bg-[#111827]/40 hover:bg-[#111827]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                                                            : "bg-card shadow-sm hover:shadow-md active:bg-background"
                                                                    )
                                                            )}
                                                        >
                                                            {idx === 0 && !req.isConfirmedDeal && (
                                                                <div className="absolute top-4 right-4">
                                                                    <span className={cn(
                                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.16em] border",
                                                                        isDark ? "bg-emerald-500/12 text-emerald-300 border-emerald-400/20" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                    )}>
                                                                        New offer
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                                                    isDark ? "bg-warning/10 text-warning border-warning/20" : "bg-warning text-warning border-warning"
                                                                )}>
                                                                    <AlertTriangle className={cn("w-3.5 h-3.5", isDark ? "text-warning" : "text-warning")} strokeWidth={3} />
                                                                    Action required
                                                                </span>
                                                            </div>
                                                            <div className="flex items-start justify-between mb-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-border shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300">
                                                                        {getBrandIcon(req.brand_logo || req.brand_logo_url || req.logo_url || req.raw?.brand_logo || req.raw?.brand_logo_url || req.raw?.logo_url, req.category, req.brand_name)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className={cn("text-[15px] font-bold tracking-tight", textColor)}>{req.brand_name}</h4>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <ShieldCheck className="w-3 h-3 text-info" />
                                                                            <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", textColor)}>Verified Brand</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={cn(
                                                                        idx === 0 && !req.isConfirmedDeal ? "text-[28px]" : "text-[22px]",
                                                                        "font-black font-outfit tracking-tight",
                                                                        isDark ? "text-foreground" : "text-muted-foreground"
                                                                    )}>
                                                                        ₹{amount.toLocaleString()}
                                                                    </p>
                                                                    <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-60 mt-1", isDark ? "text-primary" : "text-primary")}>
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
                                                                                <span key={i} className={cn("text-[12px] font-black bg-background/10 px-2.5 py-1 rounded-lg", isDark ? "text-foreground" : "text-muted-foreground")}>
                                                                                    {d}
                                                                                </span>
                                                                            ));
                                                                        })()}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "flex items-center gap-1.5 ml-auto px-2.5 py-1.5 rounded-lg border",
                                                                        expTone === 'danger'
                                                                            ? (isDark ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-destructive text-destructive border-destructive")
                                                                            : expTone === 'warn'
                                                                                ? (isDark ? "bg-warning/10 text-warning border-warning/20" : "bg-warning text-warning border-warning")
                                                                                : (isDark ? "bg-card text-foreground/70 border-border" : "bg-card text-muted-foreground border-border")
                                                                    )}>
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                            {sentText ? `${sentText} • ${expiresDays}d left` : `${expiresDays}d left`}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Expected Payment Time callout */}
                                                                <div className={cn("flex items-start gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold leading-relaxed border", isDark ? "bg-[#1C2C2A]/70 text-primary border-primary/20" : "bg-primary text-primary border-primary")}>
                                                                    <Landmark className="w-3.5 h-3.5 shrink-0 mt-[2px]" />
                                                                    Payment released after content approval
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <button type="button"
                                                                    onClick={(e) => { e.stopPropagation(); triggerHaptic(); setSelectedItem(req); setSelectedType('offer'); }}
                                                                    className={cn(
                                                                        "w-full rounded-[16px] text-[12px] font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5",
                                                                        idx === 0 && !req.isConfirmedDeal
                                                                            ? "h-12 bg-emerald-600 text-white shadow-emerald-500/20"
                                                                            : "h-11 bg-info text-foreground shadow-blue-500/20"
                                                                    )}
                                                                >
                                                                    Review offer
                                                                    <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                                                                </button>

                                                                <div className="flex items-center justify-between">
                                                                    <button type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            triggerHaptic();
                                                                            setSelectedItem(req);
                                                                            setSelectedType('offer');
                                                                            toast.message("Counter inside offer details", { description: "Open offer → Counter." });
                                                                        }}
                                                                        className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-foreground/70 hover:text-foreground" : "text-muted-foreground hover:text-muted-foreground")}
                                                                    >
                                                                        Counter
                                                                    </button>
                                                                    <button type="button"
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
                                                                        className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-foreground/60 hover:text-foreground" : "text-muted-foreground hover:text-muted-foreground")}
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
                                            <div className={cn(
                                                "p-6 rounded-[2rem] border text-center",
                                                isDark ? "bg-card border-border" : "bg-card border-border shadow-sm"
                                            )}>
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                    <Handshake className="w-7 h-7 text-white" />
                                                </div>
                                                <h3 className={cn("text-[18px] font-black tracking-tight mb-2 font-outfit", textColor)}>No new offers yet</h3>
                                                <p className={cn("text-[13px] leading-relaxed opacity-70 mb-5", textColor)}>
                                                    Share your creator link to start receiving structured brand offers here.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        handleShareOnWhatsApp();
                                                    }}
                                                    className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[13px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                >
                                                    Share Link
                                                </button>
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
                        <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 min-h-screen relative bg-transparent")}>
                            <AnimatePresence mode="wait">
                                {!activeSettingsPage ? (
                                    <motion.div
                                        key="settings-main"
                                        initial={{ opacity: 0, x: 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="w-full"
                                    >
                                        <div className={cn("px-5 pt-14 pb-4 bg-transparent")}>
                                            <h1 className={cn("text-[32px] leading-none font-black tracking-tight", textColor)}>Account</h1>
                                            <p className={cn("text-[13px] mt-1 font-medium opacity-60", textColor)}>
                                                Manage your creator profile, link, payouts, and alerts
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {/* 1. TOP CARD (Identity + quick actions) */}
                                            <div className="px-4">
                                                <div className={cn(
                                                    "p-5 rounded-[28px] transition-all border shadow-sm relative overflow-hidden",
                                                    isDark ? "bg-card border-[#2C2C2E]" : "bg-white border-[#E5E7EB]"
                                                )}>
                                                    <div className={cn(
                                                        "absolute inset-x-0 top-0 h-24 opacity-80 pointer-events-none",
                                                        isDark
                                                            ? "bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10"
                                                            : "bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50"
                                                    )} />
                                                    <div className="relative flex items-start gap-4 mb-5">
                                                        <div className="relative shrink-0">
                                                            <div className="w-20 h-20 rounded-[24px] overflow-hidden border border-border">
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
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveSettingsPage('personal')}
                                                                className={cn(
                                                                    "absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm active:scale-95",
                                                                    isDark ? "bg-card border-[#2C2C2E] text-foreground" : "bg-white border-white text-[#0F172A]"
                                                                )}
                                                            >
                                                                <Camera className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <h2 className={cn("text-[30px] leading-none font-black tracking-tight", textColor)}>
                                                                    {profile?.first_name || username || 'Creator'}
                                                                </h2>
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.16em] border",
                                                                    isDark ? "bg-primary/10 text-primary border-primary/20" : "bg-blue-50 text-blue-600 border-blue-100"
                                                                )}>
                                                                    <ShieldCheck className="w-3 h-3" />
                                                                    Verified
                                                                </span>
                                                            </div>
                                                            <p className={cn("text-[18px] font-semibold opacity-55", textColor)}>
                                                                @{username || 'creator'}
                                                            </p>
                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                <div className={cn("px-3 py-2 rounded-2xl border", isDark ? "bg-background border-border" : "bg-background border-[#E5E7EB]")}>
                                                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.16em] opacity-45 mb-1", textColor)}>Creator link</p>
                                                                    <p className={cn("text-[12px] font-bold", textColor)}>
                                                                        {profile?.instagram_handle ? 'Ready' : 'Setup needed'}
                                                                    </p>
                                                                </div>
                                                                <div className={cn("px-3 py-2 rounded-2xl border", isDark ? "bg-background border-border" : "bg-background border-[#E5E7EB]")}>
                                                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.16em] opacity-45 mb-1", textColor)}>New offers</p>
                                                                    <p className={cn("text-[12px] font-bold", textColor)}>{pendingOffersCount}</p>
                                                                </div>
                                                                <div className={cn("px-3 py-2 rounded-2xl border", isDark ? "bg-background border-border" : "bg-background border-[#E5E7EB]")}>
                                                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.16em] opacity-45 mb-1", textColor)}>Pending ₹</p>
                                                                    <p className={cn("text-[12px] font-bold", textColor)}>₹{pendingAmount.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative grid grid-cols-2 gap-3 mb-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveSettingsPage('portfolio')}
                                                            className={cn(
                                                                "h-12 rounded-2xl font-black text-[13px] active:scale-95 transition-all flex items-center justify-center gap-2",
                                                                isDark ? "bg-primary text-white" : "bg-primary text-white shadow-lg shadow-primary/15"
                                                            )}
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                            Edit Public Profile
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(`/${username || 'creator'}`, '_blank')}
                                                            className={cn(
                                                                "h-12 rounded-2xl border font-bold text-[13px] active:scale-95 transition-all flex items-center justify-center gap-2",
                                                                isDark ? "bg-card border-border text-foreground" : "bg-white border-border text-black shadow-sm"
                                                            )}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Preview Link
                                                        </button>
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center justify-between gap-3 p-3 rounded-2xl border",
                                                        isDark ? "bg-background border-border" : "bg-[#F8FAFC] border-[#E5E7EB]"
                                                    )}>
                                                        <div className="min-w-0">
                                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.18em] opacity-45 mb-1", textColor)}>Creator link</p>
                                                            <p className={cn("text-[13px] font-bold truncate", textColor)}>
                                                                creatorarmour.com/{profile?.instagram_handle || username || 'creator'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleCopyStorefront}
                                                            className={cn(
                                                                "shrink-0 h-10 px-4 rounded-xl font-black text-[12px] active:scale-95 transition-all",
                                                                isDark ? "bg-primary/10 text-primary border border-primary/20" : "bg-white text-primary border border-primary/20"
                                                            )}
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Feedback */}
                                            {activeDealsCount === 0 && pendingOffersCount === 0 ? (
                                                <div className="px-4">
                                                    <div className={cn("p-4 rounded-2xl border", isDark ? "bg-[#111827]/40 border-border" : "bg-green-50 border-green-100")}>
                                                        <p className={cn("text-sm font-bold mb-1", isDark ? "text-foreground" : "text-green-800")}>Share your link to get brand requests</p>
                                                        <p className={cn("text-xs opacity-70 mb-3", isDark ? "text-foreground" : "text-green-700")}>Brand briefs from your collab link will appear here.</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleShareOnWhatsApp}
                                                            className={cn(
                                                                "h-10 px-4 rounded-xl font-black text-[12px] active:scale-95 transition-all",
                                                                isDark ? "bg-primary text-white" : "bg-[#16A34A] text-white"
                                                            )}
                                                        >
                                                            Share link now
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* 2. QUICK NAV */}
                                            <div className="px-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setActiveTab('deals'); setCollabSubTab('pending'); }}
                                                        className={cn("h-14 rounded-2xl border font-bold text-[12px] active:scale-95 transition-all flex flex-col items-center justify-center leading-tight", isDark ? "bg-card border-border text-foreground" : "bg-white border-border text-black shadow-sm")}
                                                    >
                                                        <span className="text-primary text-[16px] font-black">{pendingOffersCount}</span>
                                                        New offers
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('payments')}
                                                        className={cn("h-14 rounded-2xl border font-bold text-[12px] active:scale-95 transition-all flex flex-col items-center justify-center leading-tight", isDark ? "bg-card border-border text-foreground" : "bg-white border-border text-black shadow-sm")}
                                                    >
                                                        <span className="text-primary text-[16px] font-black">₹{pendingAmount.toLocaleString()}</span>
                                                        Pending payouts
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 3. CREATOR PROFILE */}
                                            <div className="pt-2">
                                                <SectionHeader title="Profile & Link" isDark={isDark} />
                                                <SettingsGroup isDark={isDark}>
                                                    <SettingsRow icon={<FileText />} iconBg="bg-primary" label="Public Portfolio" subtext="Bio, proof, and what brands see" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('portfolio')} />
                                                    <SettingsRow icon={<Link2 />} iconBg="bg-violet-500" label="Creator Link" subtext="Manage your public intake page" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('collab-link')} />
                                                    <SettingsRow icon={<User />} iconBg="bg-slate-500" label="Personal Information" subtext="Name, identity, and legal details" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('personal')} />
                                                </SettingsGroup>
                                            </div>

                                            {/* 4. MONEY */}
                                            <div>
                                                <SectionHeader title="Money" isDark={isDark} />
                                                <SettingsGroup isDark={isDark}>
                                                    <SettingsRow icon={<Landmark />} iconBg="bg-indigo-500" label="Payout Methods" subtext="Manage UPI and bank accounts" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('payouts')} />
                                                    <SettingsRow icon={<CreditCard />} iconBg="bg-cyan-500" label="Earnings & History" subtext="Revenue, payouts, and statements" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('earnings')} />
                                                </SettingsGroup>
                                            </div>

                                            {/* 5. APP PREFERENCES */}
                                            <div>
                                                <SectionHeader title="App Preferences" isDark={isDark} />
                                                <SettingsGroup isDark={isDark}>
                                                    <SettingsRow icon={<Bell />} iconBg="bg-rose-500" label="Notifications" subtext="Offer alerts, contracts, and payments" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('notifications')} />
                                                    <SettingsRow icon={isDark ? <Sun /> : <Moon />} iconBg="bg-background" label="Appearance" subtext="Dark mode and theme" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('dark-mode')} />
                                                </SettingsGroup>
                                            </div>

                                            {/* 6. TRUST & SUPPORT */}
                                            <div>
                                                <SectionHeader title="Trust & Support" isDark={isDark} />
                                                <SettingsGroup isDark={isDark}>
                                                    <SettingsRow icon={<ShieldCheck />} iconBg="bg-info" label="Armour Verification" subtext="Trust features and fraud protection" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('verification')} />
                                                    <SettingsRow icon={<Info />} iconBg="bg-slate-500" label="About Creator Armour" subtext="Version, help, and support" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('about')} />
                                                </SettingsGroup>
                                            </div>

                                            {/* 7. SESSION */}
                                            <div>
                                                <SectionHeader title="Session" isDark={isDark} />
                                                <SettingsGroup isDark={isDark}>
                                                    <SettingsRow icon={<LogOut />} iconBg="bg-destructive" label="Log Out" subtext="Securely sign out of your account" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('logout')} />
                                                </SettingsGroup>
                                            </div>
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
                                <button type="button" className={cn("p-2.5 rounded-xl border flex items-center justify-center", cardBgColor, borderColor)}>
                                    <Download className={cn("w-5 h-5", secondaryTextColor)} />
                                </button>
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
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/50 rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/50 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between text-foreground/90 mb-3">
                                        <div className="space-y-0.5">
                                            <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-85 text-foreground">Pending Amount</span>
                                            <span className="block text-[11px] font-semibold text-foreground/70">Released after content approval</span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-secondary/12 backdrop-blur-md border border-border">
                                            <Clock className="w-4 h-4 text-foreground" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-black text-foreground mb-5 flex items-baseline gap-1 font-outfit">
                                        <span className="text-2xl font-bold opacity-75">₹</span>
                                        <AnimatedCounter value={brandDeals.reduce((sum, d) => sum + (d.status?.toLowerCase() !== 'completed' ? (d.deal_amount || 0) : 0), 0)} />
                                    </div>
                                    <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-xl bg-black/10 backdrop-blur-md border border-border w-fit">
                                        <div className="w-5 h-5 rounded-full bg-secondary/15 flex items-center justify-center border border-border">
                                            <ShieldCheck className="w-3 h-3 text-foreground/90" />
                                        </div>
                                        <span className="text-[9px] font-black text-foreground tracking-[0.15em] uppercase">Creator Armour protection active</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Secondary Stats Row */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2", textColor)}>Paid This Month</p>
                                    <div className={cn("text-lg font-bold font-outfit", isDark ? "text-primary" : "text-primary")}>₹{monthlyRevenue.toLocaleString()}</div>
                                </div>
                                <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2", textColor)}>Total Earnings</p>
                                    <div className={cn("text-lg font-bold font-outfit", textColor)}>₹{allTimeRevenue.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Transaction List */}
                            <div className="space-y-3">
                                {brandDeals.length > 0 ? (
                                    brandDeals.map((deal: any, idx: number) => (
                                        (() => {
                                            const payUx = getCreatorPaymentListUX(deal);
                                            const badgeClass = payUx.tone === 'success'
                                                ? (isDark ? "bg-primary/12 text-primary border-primary/20" : "bg-primary/10 text-primary border-primary/15")
                                                : payUx.tone === 'warning'
                                                    ? (isDark ? "bg-warning/14 text-warning border-warning/25" : "bg-warning/10 text-warning border-warning/15")
                                                    : payUx.tone === 'neutral'
                                                        ? (isDark ? "bg-secondary/50 text-foreground/80 border-border" : "bg-background/5 text-muted-foreground border-border")
                                                        : (isDark ? "bg-info/14 text-info border-sky-400/25" : "bg-info/10 text-info border-sky-500/15");

                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => { triggerHaptic(); setSelectedPayment(deal); }}
                                                className={cn("p-5 rounded-2xl border flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer", cardBgColor, borderColor)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center text-lg font-black", borderColor, isDark ? "bg-card" : "bg-background")}>
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
                                        <div className="w-16 h-16 rounded-full bg-background/10 flex items-center justify-center mx-auto mb-4 border border-border">
                                            <CreditCard className={cn("w-8 h-8 opacity-20", textColor)} />
                                        </div>
                                        <h3 className={cn("text-[18px] font-black tracking-tight mb-2 font-outfit", textColor)}>No payments yet</h3>
                                        <p className={cn("text-sm font-bold opacity-30", textColor)}>Complete your first brand deal to start earning</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic();
                                                handleShareOnWhatsApp();
                                            }}
                                            className="mt-4 h-11 px-5 rounded-2xl bg-primary text-white font-black text-[13px] shadow-lg shadow-primary/20 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Share link to get first offer
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── NAVIGATION BAR (Redesigned) ─── */}
                <div
                    className={cn('fixed bottom-0 inset-x-0 border-t z-[1100] transition-all duration-500', isDark ? 'border-[#1F2937] bg-[#0B0F14]/90' : 'border-border bg-secondary/90')}
                    style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
                >
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-4 py-3 pb-safe gap-1" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className={cn("flex flex-col items-center justify-center gap-1 min-w-[64px] h-[54px] px-2 rounded-2xl transition-all", activeTab === 'dashboard' ? (isDark ? 'bg-white/8 shadow-[0_8px_20px_rgba(0,0,0,0.18)]' : 'bg-white shadow-sm border border-[#E5E7EB]') : 'bg-transparent')}>
                            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? (isDark ? 'text-foreground' : 'text-[#111827]') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-foreground font-bold' : 'text-[#111827] font-bold') : cn('font-medium', secondaryTextColor))}>Home</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('deals'); }} className={cn("flex flex-col items-center justify-center gap-1 min-w-[64px] h-[54px] px-2 rounded-2xl transition-all", activeTab === 'deals' ? (isDark ? 'bg-white/8 shadow-[0_8px_20px_rgba(0,0,0,0.18)]' : 'bg-white shadow-sm border border-[#E5E7EB]') : 'bg-transparent')}>
                            <Briefcase className={cn('w-[22px] h-[22px]', activeTab === 'deals' ? (isDark ? 'text-foreground' : 'text-[#111827]') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'deals' ? (isDark ? 'text-foreground font-bold' : 'text-[#111827] font-bold') : cn('font-medium', secondaryTextColor))}>Deals</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className={cn("flex flex-col items-center justify-center gap-1 min-w-[64px] h-[54px] px-2 rounded-2xl transition-all", activeTab === 'payments' ? (isDark ? 'bg-white/8 shadow-[0_8px_20px_rgba(0,0,0,0.18)]' : 'bg-white shadow-sm border border-[#E5E7EB]') : 'bg-transparent')}>
                            <CreditCard className={cn('w-[22px] h-[22px]', activeTab === 'payments' ? (isDark ? 'text-foreground' : 'text-[#111827]') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'payments' ? (isDark ? 'text-foreground font-bold' : 'text-[#111827] font-bold') : cn('font-medium', secondaryTextColor))}>Payments</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className={cn("flex flex-col items-center justify-center gap-1 min-w-[64px] h-[54px] px-2 rounded-2xl transition-all", activeTab === 'profile' ? (isDark ? 'bg-white/8 shadow-[0_8px_20px_rgba(0,0,0,0.18)]' : 'bg-white shadow-sm border border-[#E5E7EB]') : 'bg-transparent')}>
                            <User className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-foreground' : 'text-[#111827]') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'profile' ? (isDark ? 'text-foreground font-bold' : 'text-[#111827] font-bold') : cn('font-medium', secondaryTextColor))}>Account</span>
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
                                    isDark ? "bg-background border-border" : "bg-card border-border"
                                )}
                            >
                                <div className="w-12 h-1 bg-background/20 rounded-full mx-auto mb-6" />
                                <div className="max-w-md mx-auto">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-foreground" : "text-muted-foreground")}>Manage your deal page</h2>
                                            <p className={cn("text-[13px] mt-1 opacity-60", isDark ? "text-foreground" : "text-muted-foreground")}>Share your profile, review offers, and keep your page current.</p>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowActionSheet(false)}
                                            className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-card" : "bg-background")}
                                        >
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        </motion.button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 mb-6">
                                        <button type="button"
                                            onClick={() => {
                                                handleShareStorefront();
                                                setShowActionSheet(false);
                                            }}
                                            className={cn(
                                                'p-4 rounded-2xl border text-left transition-all active:scale-[0.99]',
                                                isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-primary/30 hover:from-emerald-400 hover:to-sky-400 text-foreground shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-primary/40 hover:from-emerald-500 hover:to-sky-500 text-foreground shadow-lg'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-secondary/50">
                                                    <Share2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-black uppercase tracking-widest">Share deal page</p>
                                                    <p className="text-[12px] opacity-75 mt-1">Send your profile page to brands in one tap</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button type="button"
                                            onClick={() => {
                                                handleCopyStorefront();
                                                setShowActionSheet(false);
                                            }}
                                            className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
                                        >
                                            <p className={cn('text-[13px] font-bold', textColor)}>Copy deal page</p>
                                            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>creatorarmour.com/{username}</p>
                                        </button>

                                        <button type="button"
                                            onClick={() => { setShowActionSheet(false); window.open(`/${username}`, '_blank'); }}
                                            className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
                                        >
                                            <p className={cn('text-[13px] font-bold', textColor)}>Preview page</p>
                                            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>See what brands see before you share it</p>
                                        </button>

                                        <button type="button"
                                            onClick={() => { setShowActionSheet(false); setActiveTab('deals'); setCollabSubTab('pending'); }}
                                            className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
                                        >
                                            <p className={cn('text-[13px] font-bold', textColor)}>Review offers</p>
                                            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Open pending brand requests and respond faster</p>
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all group", isDark ? "hover:bg-card" : "hover:bg-background")}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-background/10 flex items-center justify-center">
                                                    <QrCode className="w-4 h-4 text-muted-foreground group-hover:text-info transition-colors" />
                                                </div>
                                                <p className={cn("font-bold text-[14px]", isDark ? "text-foreground" : "text-muted-foreground")}>Generate QR Code</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all group", isDark ? "hover:bg-card" : "hover:bg-background")}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-background/10 flex items-center justify-center">
                                                    <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <p className={cn("font-bold text-[14px]", isDark ? "text-foreground" : "text-muted-foreground")}>Test Intake Form</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                                            <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-primary/20 rounded-full blur-[140px]" />
                                            <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-info/18 rounded-full blur-[160px]" />
                                            <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-primary/12 rounded-full blur-[170px]" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
                                            <div className="absolute inset-0 bg-background" />
                                        </div>
                                    )}

                                    {/* Fixed Header */}
                                    <div className={cn(
                                        "px-5 py-3.5 flex items-center justify-between border-b sticky top-0 z-20",
                                        isDark ? "bg-[#061318]/70 backdrop-blur-xl border-border" : "bg-secondary/95 backdrop-blur-md border-border"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <button type="button"
                                                onClick={closeItemDetail}
                                                className={cn("w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90", borderColor, isDark ? "bg-card hover:bg-secondary/50" : "bg-card hover:bg-background")}
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
                                        <button type="button"
                                            onClick={() => { triggerHaptic(); setShowItemMenu(true); }}
                                            className={cn("w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90", borderColor, isDark ? "bg-card" : "bg-card")}
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
                                                        ? (isDark ? "bg-primary/10 border-primary/20" : "bg-primary border-primary")
                                                        : (isDark ? "bg-warning/10 border-warning/20" : "bg-warning border-warning")
                                                )}>
                                                    <span className={cn("text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5", selectedType === 'deal' ? (isDark ? 'text-primary' : 'text-primary') : (isDark ? 'text-warning' : 'text-warning'))}>
                                                        {selectedType === 'deal' ? '🟢 Active Collaboration' : <><AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} /> Awaiting Your Decision</>}
                                                    </span>
                                                </div>

                                                {/* Campaign Type Tag */}
                                                {selectedItem.collab_type === 'barter' ? (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-warning bg-warning/10 px-2 py-0.5 rounded-md">Free products Campaign</span>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">Paid Campaign</span>
                                                )}

                                                {/* Hero Budget */}
                                                <p className={cn("text-[38px] font-black leading-none my-2 font-outfit tracking-tight", isDark ? "text-foreground" : "text-muted-foreground")}>
                                                    {renderBudgetValue(selectedItem)} <span className={cn("text-[20px] font-bold opacity-60 ml-1", textColor)}>Offer</span>
                                                </p>

                                                {/* Deliverables */}
                                                <div className={cn("flex items-center justify-center flex-wrap gap-2 text-[14px] font-bold mt-1", isDark ? "text-muted-foreground" : "text-muted-foreground")}>
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
                                                        <div className="flex items-center justify-center gap-1.5 mt-2 bg-destructive/10 text-destructive px-3 py-1 rounded-full shadow-sm">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span className="text-[11px] font-black uppercase tracking-wider">Deadline: {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Brand Logo & Name */}
                                            <div className={cn("flex items-center justify-center gap-3 w-full border-t pt-5 mt-1", isDark ? "border-border" : "border-border")}>
                                                <div className={cn("w-8 h-8 rounded-xl border overflow-hidden flex items-center justify-center shrink-0 shadow-sm",
                                                    selectedItem.collab_type === 'barter'
                                                        ? (isDark ? "bg-warning/5 border-warning/20" : "bg-warning border-warning")
                                                        : (isDark ? "bg-info/10 border-info/20" : "bg-info border-info")
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
                                                        <ShieldCheck className="w-3.5 h-3.5 text-info" strokeWidth={2.5} />
                                                    </div>
                                                    <p className={cn("text-[10px] font-semibold mt-0.5", secondaryTextColor, isDark ? "" : "text-muted-foreground")}>Verified Brand</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── BRAND DETAILS (Progressive Disclosure) ── */}
                                        <motion.div
                                            className={cn("rounded-xl border mb-5 overflow-hidden", cardBgColor, borderColor)}
                                            layout
                                        >
                                            {/* Collapsed trigger */}
                                            <button type="button"
                                                onClick={() => { triggerHaptic(); setShowBrandDetails(v => !v); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity"
                                            >
                                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", isDark ? "bg-info/10" : "bg-info")}>
                                                    <ShieldCheck className="w-3.5 h-3.5 text-info" strokeWidth={2} />
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
                                                        <div className={cn("border-t mx-0", isDark ? "border-border" : "border-border")} />

                                                        {/* Trust badges */}
                                                        <div className="px-4 pt-3 pb-2">
                                                            <p className={cn("text-[10px] font-black uppercase tracking-wider mb-2 opacity-40", textColor)}>Verified Identity</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {[
                                                                    { icon: '✓', label: 'GST Verified', color: 'text-primary bg-primary/10 border-primary/20' },
                                                                    { icon: '✓', label: 'Email Verified', color: 'text-primary bg-primary/10 border-primary/20' },
                                                                    { icon: '✓', label: 'Domain Verified', color: 'text-primary bg-primary/10 border-primary/20' },
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
                                                                <div key={i} className={cn("flex items-start justify-between py-2", i > 0 ? (isDark ? "border-t border-border/5" : "border-t border-border") : "")}>
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
                                                <div className={cn("rounded-2xl border px-2 py-4", isDark ? "bg-card border-border" : "bg-card border-border shadow-sm")}>
                                                    <div className="flex items-center justify-between px-2 mb-4 text-[11px] font-black uppercase tracking-wider">
                                                        <span className={isDark ? "text-info" : "text-info"}>Step 1 of 5</span>
                                                        <span className={textColor}>Offer Received</span>
                                                    </div>
                                                    <div className="flex items-center justify-between px-2 relative">
                                                        <div className={cn("absolute left-4 right-4 top-[6px] h-[3px] z-0 rounded-full", isDark ? "bg-secondary/50" : "bg-background")} />
                                                        <div className={cn("absolute left-4 w-1 top-[6px] h-[3px] z-0 rounded-full", isDark ? "bg-info" : "bg-info")} />
                                                        {['Offer', 'Accept', 'Create', 'Submit', 'Payment'].map((step, i) => (
                                                            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                                <div className={cn("w-[15px] h-[15px] rounded-full border-[3px]",
                                                                    i === 0 ? "bg-card border-info shadow-[0_0_8px_rgba(59,130,246,0.6)] box-content" : (isDark ? "bg-[#111827] border-border" : "bg-card border-border")
                                                                )} />
                                                                <span className={cn("text-[9px] font-bold uppercase", i === 0 ? (isDark ? "text-info" : "text-info") : "opacity-40")}>{step}</span>
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
                                                <div className={cn("rounded-2xl border p-4", isDark ? "bg-card border-border" : "bg-card border-border shadow-sm")}>
                                                    <p className={cn("text-[13px] leading-relaxed font-semibold whitespace-pre-wrap", isDark ? "text-foreground/80" : "text-muted-foreground")}>
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
                                                            isDark ? "bg-card border-border" : "bg-card border-border"
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
                                                <div className={cn("rounded-xl border p-3 flex items-center gap-4", isDark ? "bg-card border-border" : "bg-background border-border")}>
                                                    <div className="w-16 h-16 rounded-xl bg-warning shrink-0 overflow-hidden border border-black/5">
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
                                                                ? (isDark ? "bg-primary/10 text-primary border-primary/20" : "bg-primary text-primary border-primary")
                                                                : selectedShippingStatus === 'shipped'
                                                                    ? (isDark ? "bg-info/10 text-info border-sky-500/20" : "bg-info text-info border-sky-200")
                                                                    : selectedShippingStatus === 'issue_reported'
                                                                        ? (isDark ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200")
                                                                        : (isDark ? "bg-warning/10 text-warning border-warning/20" : "bg-warning text-warning border-warning")
                                                        )}>
                                                            {selectedShippingDelivered ? 'RECEIVED' : selectedShippingStatus === 'shipped' ? 'SHIPPED' : selectedShippingStatus === 'issue_reported' ? 'ISSUE' : 'PENDING'}
                                                        </span>
                                                    </div>

                                                    {(selectedItem.courier_name || selectedItem.tracking_number || selectedItem.tracking_url || selectedItem.expected_delivery_date) && (
                                                        <div className={cn("rounded-2xl border p-4 space-y-3", isDark ? "bg-secondary/3 border-border" : "bg-card border-border")}>
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
                                                                    className={cn("inline-flex items-center gap-2 text-[13px] font-bold underline", isDark ? "text-info" : "text-info")}
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    Track package
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}

                                                    {selectedShippingStatus === 'shipped' && (
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            <button type="button"
                                                                onClick={confirmSelectedProductReceived}
                                                                disabled={isConfirmingReceived}
                                                                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground font-black text-[14px] transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                                                            >
                                                                {isConfirmingReceived ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                Confirm Product Received
                                                            </button>
                                                            <button type="button"
                                                                onClick={() => {
                                                                    triggerHaptic();
                                                                    setShowReportIssueModal(true);
                                                                }}
                                                                className={cn("w-full py-3 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2", isDark ? "bg-card border-border text-foreground" : "bg-card border-border text-muted-foreground")}
                                                            >
                                                                <AlertCircle className="w-4 h-4" />
                                                                Report Shipping Issue
                                                            </button>
                                                        </div>
                                                    )}

                                                    {selectedShippingStatus === 'pending' && (
                                                        <div className={cn("rounded-2xl border p-4 flex items-start gap-3", isDark ? "bg-warning/5 border-warning/20" : "bg-warning border-warning")}>
                                                            <Package className={cn("w-5 h-5 mt-0.5", isDark ? "text-warning" : "text-warning")} />
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
                                                            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                                                                <Landmark className="w-4 h-4 text-info" />
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
                                                            const deadlineColor = diff < 3 ? 'text-destructive' : diff < 7 ? 'text-warning' : 'text-info';
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
                                                            const rawStatus = String(selectedItem.raw?.status || '').toLowerCase();
                                                            const hasContract = Boolean(selectedItem.contract_file_url || selectedItem.signed_contract_url || selectedItem.safe_contract_url);
                                                            const signedAt = selectedItem.signed_at || selectedItem.creator_signed_at || selectedItem.brand_signed_at || selectedItem.raw?.signed_at || null;
                                                            const contractUrl = selectedItem.contract_file_url || selectedItem.signed_contract_url || selectedItem.safe_contract_url || '';
                                                            const contractName = contractUrl
                                                                ? decodeURIComponent(contractUrl.split('/').pop() || 'collaboration-contract.pdf')
                                                                : 'Contract is being prepared';
                                                            const isContentDelivered = status.includes('content_delivered') || status.includes('awaiting_approval') || status.includes('draft_review') || rawStatus.includes('content_delivered') || rawStatus.includes('awaiting_approval');
                                                            const contractState = signedAt
                                                                ? 'Contract Active'
                                                                : hasContract
                                                                    ? 'Ready for review'
                                                                    : isContentDelivered
                                                                        ? 'Contract generated'
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
                                                                                        : isContentDelivered
                                                                                            ? 'Your contract has been auto-generated and is active.'
                                                                                            : 'The contract will appear here once the brand finalizes the setup.'}
                                                                            </p>
                                                                        </div>
                                                                        <span className={cn(
                                                                            "px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border",
                                                                            status.includes('signed')
                                                                                ? (isDark ? "bg-primary/10 text-primary border-primary/20" : "bg-primary text-primary border-primary")
                                                                                : hasContract
                                                                                    ? (isDark ? "bg-info/10 text-info border-info/20" : "bg-info text-info border-info")
                                                                                    : (isDark ? "bg-warning/10 text-warning border-warning/20" : "bg-warning text-warning border-warning")
                                                                        )}>
                                                                            {status.includes('signed') ? 'Signed' : hasContract ? 'Ready' : 'Pending'}
                                                                        </span>
                                                                    </div>

                                                                    <div className={cn("rounded-2xl border px-4 py-3 mb-4", isDark ? "bg-card border-border" : "bg-card border-border")}>
                                                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Document</p>
                                                                        <p className={cn("text-[13px] font-bold break-all", textColor)}>{contractName}</p>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                                        <button type="button"
                                                                            onClick={() => { triggerHaptic(); openDealContractReview(selectedItem); }}
                                                                            className={cn(
                                                                                "w-full py-3 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98]",
                                                                                isDark ? "bg-card text-[#0B0F14] border-white" : "bg-background text-foreground border-border"
                                                                            )}
                                                                        >
                                                                            Open Contract
                                                                        </button>
                                                                        <button type="button"
                                                                            onClick={() => { triggerHaptic(); copySelectedItemLink(); }}
                                                                            className={cn(
                                                                                "w-full py-3 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98]",
                                                                                isDark ? "bg-card text-foreground border-border" : "bg-card text-muted-foreground border-border"
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
                                                isDark ? "bg-primary/5 border-primary/20" : "bg-primary border-primary"
                                            )}>
                                                <div className="absolute inset-y-0 left-0 w-1.5 bg-primary rounded-r-full" />
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

                                                <div className="flex items-center gap-3 relative">
                                                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
                                                        <ShieldCheck className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("font-black text-[14px] leading-tight", isDark ? "text-primary" : "text-primary")}>Protected by Creator Armour</p>
                                                        <p className={cn("text-[11px] font-semibold mt-0.5", isDark ? "text-primary/70" : "text-primary/80")}>Contract + rights + dispute support</p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 relative z-10">
                                                    {[
                                                        'Contract auto-generated',
                                                        'Content rights secured',
                                                        'Dispute protection included',
                                                    ].map((t) => (
                                                        <div key={t} className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                                            <span className={cn("text-[12px] font-bold", isDark ? "text-primary/85" : "text-primary/90")}>{t}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── EARNINGS BREAKDOWN (Offers) ── */}
                                        {selectedType === 'offer' && (
                                            <div className="mb-6">
                                                <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Earnings Breakdown</h4>
                                                <div className={cn("rounded-2xl border p-4", isDark ? "bg-card border-border" : "bg-card border-border shadow-sm")}>
                                                    <div className="mb-5">
                                                        <p className={cn("text-[11px] font-black uppercase tracking-wider mb-1", isDark ? "text-primary" : "text-primary")}>You Receive</p>
                                                        <p className={cn("text-[32px] font-black leading-none", textColor)}>{renderBudgetValue(selectedItem)}</p>
                                                    </div>

                                                    <div className="space-y-2.5 text-[12px]">
                                                        <div className="flex items-center justify-between">
                                                            <span className={cn("font-medium opacity-70", textColor)}>Offer budget</span>
                                                            <span className={cn("font-bold", textColor)}>{renderBudgetValue(selectedItem)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className={cn("font-medium opacity-70", textColor)}>Platform fee</span>
                                                            <span className={cn("font-bold text-primary")}>₹0</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
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
                                        isDark ? "bg-[#0B0F14]/98 backdrop-blur-xl border-border" : "bg-secondary/98 backdrop-blur-xl border-border"
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
                                                        ? (selectedItem.collab_type === 'barter' ? "bg-warning text-foreground border-warning shadow-amber-500/30" : "bg-info text-foreground border-info shadow-blue-500/30")
                                                        : cn(
                                                            dealPrimaryCtaButtonClass(getDealPrimaryCta({ role: 'creator', deal: selectedItem }).tone),
                                                            isDark ? "border-border" : "border-border"
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
                                                    <button type="button"
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            if (selectedItem.isDemo) {
                                                                toast.info("This is a demo offer! 😉");
                                                                return;
                                                            }
                                                            toast.success("Messaging thread opened");
                                                        }}
                                                        className={cn("w-full py-3 rounded-2xl flex items-center justify-center gap-2 border transition-all active:scale-95",
                                                            isDark ? "bg-card border-border hover:bg-secondary/50 text-foreground" : "bg-background border-border hover:bg-background text-muted-foreground")}
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        <span className="font-bold text-[14px]">Ask Brand Question</span>
                                                    </button>

                                                    <div className="flex gap-2.5">
                                                        <button type="button"
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
                                                            <Edit3 className="w-3.5 h-3.5 opacity-50 text-muted-foreground" />
                                                            <span className={cn("font-bold text-[13px] opacity-70", isDark ? "text-foreground" : "text-muted-foreground")}>Suggest New Price</span>
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                if (selectedItem.isDemo) {
                                                                    toast.info("You can't decline a demo offer! 😉");
                                                                    return;
                                                                }
                                                                const itemId = selectedItem?.id ?? selectedItem?.raw?.id;
                                                                if (!itemId || String(itemId).trim().length < 10) {
                                                                    toast.error("Couldn't identify this offer. Please re-open it from the list.", { id: 'decline-error' });
                                                                    return;
                                                                }
                                                                if (selectedType !== 'offer') {
                                                                    toast.error("Please open the offer details first.", { id: 'decline-error' });
                                                                    return;
                                                                }
                                                                if (onDeclineRequest) {
                                                                    try {
                                                                        await onDeclineRequest(selectedItem);
                                                                    } catch (err: any) {
                                                                        // Error already handled & toasted inside handleDeclineRequest
                                                                        console.error('Decline error:', err);
                                                                    }
                                                                }
                                                                closeItemDetail();
                                                            }}
                                                            className={cn("flex-1 py-3 border-none flex items-center justify-center gap-1.5 transition-all active:scale-95 text-destructive/80")}
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 opacity-50 text-destructive/60" />
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
                                                        isDark ? "bg-background border-border" : "bg-card border-border"
                                                    )}
                                                >
                                                    <div className="w-12 h-1 bg-background/20 rounded-full mx-auto mb-5" />
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
                                                                className={cn("w-10 h-10 rounded-full flex items-center justify-center border", borderColor, isDark ? "bg-card" : "bg-background")}
                                                            >
                                                                <X className={cn("w-4 h-4", textColor)} />
                                                            </motion.button>
                                                        </div>

                                                        <div className={cn("rounded-2xl border overflow-hidden", borderColor)}>
                                                            <button type="button"
                                                                onClick={async () => { triggerHaptic(); await copySelectedItemLink(); setShowItemMenu(false); }}
                                                                className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-card hover:bg-secondary/50" : "bg-card hover:bg-background")}
                                                            >
                                                                <span className="flex items-center gap-3">
                                                                    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-card" : "bg-background")}>
                                                                        <Copy className={cn("w-4 h-4", isDark ? "text-primary" : "text-primary")} />
                                                                    </span>
                                                                    <span>
                                                                        <p className={cn("text-[14px] font-bold", textColor)}>Copy link</p>
                                                                        <p className={cn("text-[12px] opacity-60", textColor)}>Share this offer/deal</p>
                                                                    </span>
                                                                </span>
                                                                <ChevronRight className={cn("w-4 h-4 opacity-40", textColor)} />
                                                            </button>
                                                            <div className={cn("h-px", isDark ? "bg-secondary/50" : "bg-background")} />
                                                            <button type="button"
                                                                onClick={async () => { triggerHaptic(); await shareSelectedItemLink(); setShowItemMenu(false); }}
                                                                className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-card hover:bg-secondary/50" : "bg-card hover:bg-background")}
                                                            >
                                                                <span className="flex items-center gap-3">
                                                                    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-card" : "bg-background")}>
                                                                        <Share2 className={cn("w-4 h-4", isDark ? "text-info" : "text-info")} />
                                                                    </span>
                                                                    <span>
                                                                        <p className={cn("text-[14px] font-bold", textColor)}>Share</p>
                                                                        <p className={cn("text-[12px] opacity-60", textColor)}>Send via WhatsApp, etc.</p>
                                                                    </span>
                                                                </span>
                                                                <ChevronRight className={cn("w-4 h-4 opacity-40", textColor)} />
                                                            </button>
                                                            <div className={cn("h-px", isDark ? "bg-secondary/50" : "bg-background")} />

                                                            {selectedType === 'deal' && (() => {
                                                                const statusLower = String(selectedItem?.status || '').toLowerCase();
                                                                const isCompleted = statusLower.includes('completed') || statusLower === 'paid';
                                                                if (isCompleted) return null;

                                                                return (
                                                                    <>
                                                                        <button type="button"
                                                                            onClick={() => {
                                                                                triggerHaptic();
                                                                                setShowItemMenu(false);
                                                                                setShowProgressSheet(true);
                                                                            }}
                                                                            className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-card hover:bg-secondary/50" : "bg-card hover:bg-background")}
                                                                        >
                                                                            <span className="flex items-center gap-3">
                                                                                <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-card" : "bg-background")}>
                                                                                    <TrendingUp className={cn("w-4 h-4", isDark ? "text-secondary" : "text-secondary")} />
                                                                                </span>
                                                                                <span>
                                                                                    <p className={cn("text-[14px] font-bold", textColor)}>Update progress</p>
                                                                                    <p className={cn("text-[12px] opacity-60", textColor)}>Move the deal to the next stage</p>
                                                                                </span>
                                                                            </span>
                                                                            <ChevronRight className={cn("w-4 h-4 opacity-40", textColor)} />
                                                                        </button>
                                                                        <div className={cn("h-px", isDark ? "bg-secondary/50" : "bg-background")} />
                                                                    </>
                                                                );
                                                            })()}

                                                            <button type="button"
                                                                onClick={() => {
                                                                    triggerHaptic();
                                                                    const path = getSelectedItemUrl();
                                                                    if (path) navigate(path);
                                                                    else toast.error('No page available for this item.');
                                                                    setShowItemMenu(false);
                                                                }}
                                                                className={cn("w-full flex items-center justify-between px-4 py-3.5 text-left", isDark ? "bg-card hover:bg-secondary/50" : "bg-card hover:bg-background")}
                                                            >
                                                                <span className="flex items-center gap-3">
                                                                    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-card" : "bg-background")}>
                                                                        <Eye className={cn("w-4 h-4", isDark ? "text-foreground/80" : "text-muted-foreground")} />
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
                        "sm:max-w-[520px] border-border rounded-[2rem] p-0 overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain",
                        isDark ? "bg-[#0B0F14] text-foreground shadow-black/60" : "bg-card text-muted-foreground shadow-slate-200"
                    )}
                >
                    <DialogHeader>
                        <DialogTitle className={cn("flex items-center gap-2 px-6 pt-6 text-2xl font-black tracking-tight", isDark ? "text-foreground" : "text-muted-foreground")}>
                            <Send className="w-6 h-6 text-primary" />
                            {String(selectedItem?.status || '').toLowerCase().includes('revision_requested') ||
                                String(selectedItem?.status || '').toLowerCase().includes('changes_requested') ||
                                String((selectedItem as any)?.brand_approval_status || '').toLowerCase().includes('changes_requested')
                                ? 'Submit Revision'
                                : 'Deliver Content'}
                        </DialogTitle>
                        <DialogDescription className={cn("px-6 pb-2 text-sm font-medium leading-relaxed opacity-60", isDark ? "text-foreground" : "text-muted-foreground")}>
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
                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-foreground/70" : "text-muted-foreground/60")}>
                                Main Content Link (Required)
                            </label>
                            <input
                                value={deliverContentUrlDraft}
                                onChange={(e) => setDeliverContentUrlDraft(e.target.value)}
                                placeholder="Paste Instagram/Drive link (full URL)"
                                className={cn(
                                    "w-full rounded-2xl px-4 py-3.5 text-[13px] font-semibold outline-none transition-all border",
                                    isDark ? "bg-card border-border text-foreground placeholder:text-foreground/40 focus:border-primary/50" : "bg-background border-border text-muted-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                )}
                                inputMode="url"
                                autoComplete="url"
                                autoCapitalize="none"
                                autoCorrect="off"
                            />
                            <p className={cn("text-[11px] font-semibold px-1", isDark ? "text-foreground/45" : "text-muted-foreground")}>
                                Examples: `instagram.com/reel/...` or `drive.google.com/...`
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-foreground/70" : "text-muted-foreground/60")}>
                                Content Status (Required)
                            </label>
                            <div className={cn("grid grid-cols-2 gap-2 rounded-2xl p-1 border", isDark ? "bg-card border-border" : "bg-background border-border")}>
                                <button type="button"
                                    onClick={() => setDeliverContentStatusDraft('draft')}
                                    className={cn(
                                        "h-14 rounded-2xl font-black text-[12px] transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight",
                                        deliverContentStatusDraft === 'draft'
                                            ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground shadow-[0_10px_30px_rgba(16,185,129,0.20)] ring-1 ring-white/10"
                                            : isDark ? "text-foreground/85 hover:bg-card" : "text-muted-foreground hover:bg-card"
                                    )}
                                    aria-pressed={deliverContentStatusDraft === 'draft'}
                                >
                                    <span>Draft for review</span>
                                    <span className={cn("text-[10px] font-bold opacity-75", deliverContentStatusDraft === 'draft' ? "text-foreground/90" : isDark ? "text-foreground/55" : "text-muted-foreground")}>
                                        Not posted yet
                                    </span>
                                </button>
                                <button type="button"
                                    onClick={() => setDeliverContentStatusDraft('posted')}
                                    className={cn(
                                        "h-14 rounded-2xl font-black text-[12px] transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight",
                                        deliverContentStatusDraft === 'posted'
                                            ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground shadow-[0_10px_30px_rgba(16,185,129,0.20)] ring-1 ring-white/10"
                                            : isDark ? "text-foreground/85 hover:bg-card" : "text-muted-foreground hover:bg-card"
                                    )}
                                    aria-pressed={deliverContentStatusDraft === 'posted'}
                                >
                                    <span>Already posted</span>
                                    <span className={cn("text-[10px] font-bold opacity-75", deliverContentStatusDraft === 'posted' ? "text-foreground/90" : isDark ? "text-foreground/55" : "text-muted-foreground")}>
                                        Live on profile
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-foreground/70" : "text-muted-foreground/60")}>
                                Caption (Optional)
                            </label>
                            <textarea
                                value={deliverCaptionDraft}
                                onChange={(e) => setDeliverCaptionDraft(e.target.value)}
                                placeholder="Paste your caption here..."
                                className={cn(
                                    "w-full min-h-[88px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none transition-all border resize-none",
                                    isDark ? "bg-card border-border text-foreground placeholder:text-foreground/40 focus:border-primary/50" : "bg-background border-border text-muted-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-foreground/70" : "text-muted-foreground/60")}>
                                Additional Links (Optional)
                            </label>
                            <textarea
                                value={deliverAdditionalLinksDraft}
                                onChange={(e) => setDeliverAdditionalLinksDraft(e.target.value)}
                                placeholder={"Add any extra links (one per line)\nhttps://drive.google.com/...\nhttps://instagram.com/p/..."}
                                className={cn(
                                    "w-full min-h-[88px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none transition-all border resize-none",
                                    isDark ? "bg-card border-border text-foreground placeholder:text-foreground/40 focus:border-primary/50" : "bg-background border-border text-muted-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={cn("text-[11px] font-black uppercase tracking-[0.14em] px-1", isDark ? "text-foreground/70" : "text-muted-foreground/60")}>
                                Message to Brand (Optional)
                            </label>
                            <textarea
                                value={deliverMessageDraft}
                                onChange={(e) => setDeliverMessageDraft(e.target.value)}
                                placeholder="Any context for review (timelines, instructions, etc.)"
                                className={cn(
                                    "w-full min-h-[72px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none transition-all border resize-none",
                                    isDark ? "bg-card border-border text-foreground placeholder:text-foreground/40 focus:border-primary/50" : "bg-background border-border text-muted-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                )}
                            />
                        </div>
                    </div>

                    <div className={cn(
                        "sticky bottom-0 border-t px-6 backdrop-blur",
                        isDark ? "bg-[#0B0F14]/92 border-border" : "bg-secondary/92 border-border"
                    )}>
                        <div className="grid grid-cols-2 gap-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                            <button type="button"
                                onClick={() => {
                                    triggerHaptic();
                                    setShowDeliverContentModal(false);
                                }}
                                disabled={isSubmittingContent}
                                className={cn(
                                    "h-12 rounded-2xl font-black text-[12px] border transition-all active:scale-[0.98] disabled:opacity-60",
                                    isDark ? "bg-card border-border text-foreground hover:bg-secondary/50" : "bg-card border-border text-muted-foreground hover:bg-background"
                                )}
                            >
                                Cancel
                            </button>
                            <button type="button"
                                onClick={submitDealContent}
                                disabled={isSubmittingContent}
                                className={cn(
                                    "h-12 rounded-2xl font-black text-[12px] transition-all active:scale-[0.98] disabled:opacity-60",
                                    "bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground shadow-[0_12px_38px_rgba(16,185,129,0.22)]"
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
                        "sm:max-w-[520px] border-border rounded-[2rem] p-0 overflow-hidden shadow-2xl",
                        isDark ? "bg-[#0B0F14] text-foreground shadow-black/60" : "bg-card text-muted-foreground shadow-slate-200"
                    )}
                >
                    <DialogHeader>
                        <DialogTitle className={cn("flex items-center gap-2 px-6 pt-6 text-2xl font-black tracking-tight", isDark ? "text-foreground" : "text-muted-foreground")}>
                            <AlertCircle className="w-6 h-6 text-rose-500" />
                            Report Shipping Issue
                        </DialogTitle>
                        <DialogDescription className={cn("px-6 pb-2 text-sm font-medium leading-relaxed opacity-60", isDark ? "text-foreground" : "text-muted-foreground")}>
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
                                isDark ? "bg-card border-border text-foreground placeholder:text-foreground/40 focus:border-rose-500/50" : "bg-background border-border text-muted-foreground placeholder:text-muted-foreground focus:border-rose-500/50"
                            )}
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                            <button type="button"
                                onClick={() => {
                                    setShowReportIssueModal(false);
                                    setReportIssueReason('');
                                }}
                                className={cn("h-12 rounded-2xl border text-[14px] font-black transition-all active:scale-[0.98]", isDark ? "bg-card border-border text-foreground" : "bg-card border-border text-muted-foreground")}
                            >
                                Cancel
                            </button>
                            <button type="button"
                                onClick={reportSelectedShippingIssue}
                                disabled={isReportingIssue || !reportIssueReason.trim()}
                                className="h-12 rounded-2xl bg-rose-600 text-foreground text-[14px] font-black transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
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
                <DialogContent className={cn("sm:max-w-[440px] border-border rounded-[2rem] p-0 overflow-hidden shadow-2xl", isDark ? "bg-[#0B0F14] text-foreground shadow-black/60" : "bg-card text-muted-foreground shadow-slate-200")}>
                    <DialogHeader>
                        <DialogTitle className={cn("flex items-center gap-2 px-6 pt-6 text-2xl font-black tracking-tight", isDark ? "text-foreground" : "text-muted-foreground")}>
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            Sign Agreement
                        </DialogTitle>
                        <DialogDescription className={cn("px-6 pb-2 text-sm font-medium leading-relaxed opacity-60", isDark ? "text-foreground" : "text-muted-foreground")}>
                            {creatorSigningStep === 'send'
                                ? 'We will send a secure OTP to your registered email to verify your identity and sign the contract.'
                                : 'Enter the 6-digit code sent to your email to complete the signing process.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5">
                        {creatorSigningStep === 'send' ? (
                            <div className="space-y-6">
                                <div className={cn("p-4 rounded-2xl flex items-start gap-3 border",
                                    isDark ? "bg-primary/5 border-primary/20" : "bg-primary/50 border-primary")}>
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-primary" />
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
                                    className="w-full bg-primary hover:bg-primary text-foreground h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-background disabled:text-muted-foreground"
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

                                {import.meta.env.DEV && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Local E2E testing: bypass OTP requirement.
                                      void handleSignAsCreator();
                                    }}
                                    className={cn(
                                      "w-full h-12 rounded-2xl border font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.98]",
                                      isDark
                                        ? "bg-card border-border text-foreground hover:bg-secondary/40"
                                        : "bg-background border-border text-muted-foreground hover:bg-secondary/40"
                                    )}
                                  >
                                    Skip OTP (Dev)
                                  </button>
                                )}
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
                                            isDark ? "bg-card border-border text-foreground focus:border-primary/50" : "bg-background border-border text-muted-foreground focus:border-primary/50"
                                        )}
                                    />
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[11px] font-bold opacity-40 italic">Exp. in 10 minutes</p>
                                        <button type="button"
                                            onClick={() => {
                                                setCreatorSigningStep('send');
                                                setCreatorOTP('');
                                            }}
                                            disabled={isVerifyingCreatorOTP || isSigningAsCreator}
                                            className="text-[11px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                                        >
                                            Resend
                                        </button>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={handleVerifyCreatorOTP}
                                    disabled={isVerifyingCreatorOTP || creatorOTP.length !== 6 || isSigningAsCreator}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-primary hover:bg-primary text-foreground h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-background dark:disabled:bg-background disabled:text-muted-foreground"
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

                    <div className={cn("flex items-center gap-2 text-[10px] font-bold opacity-40 border-t px-6 py-5", isDark ? "border-border/5" : "border-border")}>
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>Aadhar Verified · Secure E-signature by Creator Armour</span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* iOS install guide for push notifications */}
            <Dialog open={showPushInstallGuide} onOpenChange={setShowPushInstallGuide}>
                <DialogContent className={cn("sm:max-w-[440px] border-border text-foreground rounded-2xl p-0 overflow-hidden shadow-2xl shadow-black/60", isDark ? "bg-neutral-950/98" : "bg-background")}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 px-6 pt-6 text-2xl font-semibold tracking-tight text-foreground">
                            <Bell className="w-5 h-5 text-primary" />
                            Enable Deal Alerts
                        </DialogTitle>
                        <DialogDescription className="text-neutral-300 px-6 pb-2 text-base leading-relaxed">
                            On iPhone and iPad, push notifications work only when CreatorArmour is installed to your Home Screen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5 space-y-3">
                        <div className="p-4 bg-primary/12 border border-primary/30 rounded-xl">
                            <p className="text-sm font-semibold text-primary">How to install</p>
                            <ol className="mt-2 space-y-1 text-sm text-foreground/80 list-decimal pl-5">
                                <li>Tap the Share button in Safari</li>
                                <li>Select “Add to Home Screen”</li>
                                <li>Open CreatorArmour from your Home Screen</li>
                            </ol>
                        </div>

                        <div className="flex gap-2">
                            <button type="button"
                                onClick={() => setShowPushInstallGuide(false)}
                                className="flex-1 rounded-xl bg-primary hover:bg-primary text-foreground text-sm font-semibold px-4 py-3 transition-colors"
                            >
                                Got it
                            </button>
                            <button type="button"
                                onClick={() => setShowPushInstallGuide(false)}
                                className="rounded-xl border border-border text-foreground/85 hover:text-foreground hover:bg-secondary/50 text-sm px-4 py-3 transition-colors"
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
                                isDark ? "bg-[#0B0F14] border-border" : "bg-card border-border"
                            )}>
                                <div className="flex items-center gap-3">
                                    <button type="button"
                                        onClick={() => { triggerHaptic(); setSelectedPayment(null); }}
                                        className={cn("w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90", borderColor, isDark ? "bg-card hover:bg-secondary/50" : "bg-card hover:bg-background")}
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
                                        ? (isDark ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary border-primary text-primary")
                                        : (isDark ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-destructive border-destructive text-destructive")
                                )}>
                                    {isPaid ? 'Paid' : 'Overdue'}
                                </span>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-40 space-y-4">

                                {/* ── BRAND HEADER ── */}
                                <div className={cn("rounded-2xl border p-4 flex items-start gap-4", cardBgColor, borderColor)}>
                                    <div className={cn("w-14 h-14 rounded-2xl border overflow-hidden flex items-center justify-center shrink-0",
                                        isDark ? "bg-card border-border" : "bg-background border-border"
                                    )}>
                                        {getBrandIcon(pay.brand_logo_url || pay.logo_url, pay.category, pay.brand_name)}
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("text-[20px] font-black tracking-tight leading-tight", textColor)}>{pay.brand_name || 'Brand'}</p>
                                        <div className="flex items-center gap-1.5 mt-1 mb-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-info" strokeWidth={2.5} />
                                            <span className="text-[12px] font-bold text-info">Verified Brand</span>
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
                                        ? (isDark ? "bg-primary/5 border-primary/25" : "bg-primary border-primary")
                                        : (isDark ? "bg-destructive/5 border-destructive/25" : "bg-destructive border-destructive")
                                )}>
                                    <div className="absolute inset-y-0 left-0 w-1 rounded-r-full" style={{ background: isPaid ? '#10b981' : '#ef4444' }} />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    <div className="relative">
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isPaid ? (isDark ? "text-primary/70" : "text-primary/70") : (isDark ? "text-destructive/70" : "text-destructive/70"))}>
                                            Payment Status
                                        </p>
                                        <p className={cn("text-[22px] font-black leading-tight mb-0.5", isPaid ? (isDark ? "text-primary" : "text-primary") : (isDark ? "text-destructive" : "text-destructive"))}>
                                            {isPaid ? 'RECEIVED' : (daysPast > 0 ? 'OVERDUE' : 'PENDING')}
                                        </p>
                                        <p className={cn("text-3xl font-black font-outfit mb-3", textColor)}>{renderBudgetValue(pay)}</p>
                                        {isPaid ? (
                                            <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>Paid on {dueDateStr}</p>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>Due on: {dueDateStr}</p>
                                                {daysPast > 0 && <p className="text-[11px] font-black text-destructive">{daysPast} day{daysPast > 1 ? 's' : ''} past due</p>}
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
                                        { label: 'Deal Type', value: pay.collab_type === 'barter' ? '🎁 Free products' : '💰 Paid Campaign' },
                                        { label: 'Payment Terms', value: pay.payment_terms || 'Direct Bank Transfer' },
                                    ].map((row, i) => (
                                        <div key={i} className={cn("flex items-center justify-between px-4 py-3", i > 0 ? (isDark ? "border-t border-border/5" : "border-t border-border") : "")}>
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
                                                            ? "bg-primary border-primary text-foreground"
                                                            : step.warn
                                                                ? "bg-destructive/10 border-destructive text-destructive"
                                                                : step.active
                                                                    ? (isDark ? "bg-warning/10 border-warning text-warning" : "bg-warning border-warning text-warning")
                                                                    : (isDark ? "bg-card border-border text-foreground/20" : "bg-background border-border text-muted-foreground")
                                                    )}>
                                                        {step.done ? '✓' : step.warn ? '⚠' : step.active ? '⏳' : '·'}
                                                    </div>
                                                    {i < timelineSteps.length - 1 && (
                                                        <div className={cn("w-0.5 h-6 mt-1", step.done ? "bg-primary/40" : (isDark ? "bg-secondary/50" : "bg-background"))} />
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "text-[13px] font-semibold pt-0.5 pb-5",
                                                    step.done
                                                        ? (isDark ? "text-primary" : "text-primary")
                                                        : step.warn
                                                            ? "text-destructive"
                                                            : step.active
                                                                ? (isDark ? "text-warning" : "text-warning")
                                                                : (isDark ? "text-foreground/30" : "text-muted-foreground")
                                                )}>{step.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── CONTRACT ── */}
                                <div className={cn("rounded-2xl border p-4", isDark ? "bg-primary/5 border-primary/20" : "bg-primary border-primary")}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className={cn("text-[13px] font-black leading-tight", isDark ? "text-primary" : "text-primary")}>Creator Armour Protected</p>
                                            <p className={cn("text-[11px] font-semibold", isDark ? "text-primary/60" : "text-primary/70")}>Content Rights Agreement</p>
                                        </div>
                                    </div>
                                    <button type="button"
                                        onClick={() => { triggerHaptic(); import('sonner').then(m => m.toast('Contract download coming soon')); }}
                                        className={cn(
                                            "w-full py-2.5 rounded-xl text-[13px] font-black border flex items-center justify-center gap-2 active:scale-[0.98] transition-all",
                                            isDark ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/10 border-primary/30 text-primary"
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
                                        <div key={i} className={cn("flex items-center justify-between px-4 py-3", i > 0 ? (isDark ? "border-t border-border/5" : "border-t border-border") : "")}>
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
                                                className={cn("text-[12px] font-black text-info border border-info/20 px-3 py-1.5 rounded-xl active:scale-95 transition-all", isDark ? "bg-info/10" : "bg-info")}
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
                                        <div className={cn("rounded-xl p-3 border", isDark ? "bg-card border-border" : "bg-background border-border")}>
                                            <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50 mb-1", textColor)}>Response Time</p>
                                            <p className={cn("text-[15px] font-black", textColor)}>~3 hours</p>
                                        </div>
                                        <div className={cn("rounded-xl p-3 border", isDark ? "bg-card border-border" : "bg-background border-border")}>
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
                                    isDark ? "bg-[#0B0F14] border-border" : "bg-card border-border"
                                )}>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            triggerHaptic();
                                            import('sonner').then(m => m.toast.success('Payment reminder sent to brand!', { description: 'They will be notified via email.' }));
                                        }}
                                        className="w-full py-3.5 rounded-2xl bg-warning text-foreground font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
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
                                                "flex-1 py-3 rounded-2xl flex items-center justify-center gap-1.5 border font-black text-[13px] active:scale-95 transition-all text-destructive",
                                                isDark ? "bg-destructive/10 border-destructive/20" : "bg-destructive border-destructive"
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
                                                isDark ? "bg-card border-border" : "bg-background border-border",
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
