import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { trackEvent } from '@/lib/utils/analytics';
import { DashboardEmptyState } from '../components/dashboard/EmptyState';
import { PaymentsTab } from '../components/dashboard/PaymentsTab';
import { AccountTab } from '../components/dashboard/AccountTab';
import { Tag, User, Search, ShieldCheck, Shield, Scale, Handshake, Camera, Plus, LayoutDashboard, CreditCard, Briefcase, Menu, Instagram, Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, Bell, ChevronRight, Zap, Rocket, Link2, CheckCircle2, Download, Clock, Info, Globe, Star, LogOut, Copy, Share2, QrCode, Eye, MoreHorizontal, Landmark, FileText, Smartphone, TrendingUp, BarChart3, Mail, Phone, MessageCircle, MessageSquare, Edit3, Send, X, XCircle, ExternalLink, AlertCircle, AlertTriangle, ArrowRight, Package, Flag, MapPin, Languages, Lock as LockIcon, ArrowUpRight, Wallet, HelpCircle, Sparkles, Youtube, Twitter, Heart, Trash2, Smartphone as SmartphoneIcon, Users, Calendar, ShoppingBag, Video, Film, BookOpen, GraduationCap, Laugh, Coffee, Layers, Flame, Clapperboard, BadgeCheck, Check, IndianRupee, Utensils, Building2, Plane } from 'lucide-react';
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
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { dealPrimaryCtaButtonClass, getDealPrimaryCta } from '@/lib/deals/primaryCta';
import FiverrPackageEditor from '@/components/profile/FiverrPackageEditor';
import { useInstagramSync } from '@/lib/hooks/useInstagramSync';
import { safeAvatarSrc, withCacheBuster } from '@/lib/utils/image';

import DealSearchFilter from '@/components/dashboard/DealSearchFilter';
import { generateAIBios } from '@/utils/aiBioGenerator';
import { CITY_OPTIONS } from '@/constants/cities';
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
import { uploadFile } from '@/lib/services/fileService';
import type { PortfolioItem } from '@/types';
import { DiscoveryVideoUpload } from '@/components/dashboard/DiscoveryVideoUpload';
import { CreatorDiscoveryStack } from '@/components/creator-dashboard/CreatorDiscoveryStack';

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
    /** Non-empty means the backend request for offers failed; UI must not silently show empty lists. */
    offersError?: string;
    /** Non-empty means the backend request for deals failed; UI must not silently show empty lists. */
    dealsError?: string;
    /**
     * If true, the dashboard may render demo-only UI (like the Interactive Demo Offer placeholder).
     * Default behavior is to avoid showing demo items for real accounts.
     */
    showDemoOffer?: boolean;
    /** Show skeleton loading for deals/offers section (overrides local state) */
    isLoadingDealsOverride?: boolean;
    /** Show skeleton loading for profile section */
    isLoadingProfile?: boolean;
    /** Real profile views count from database */
    profileViewsToday?: number;
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
        <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", c.bg, c.text)}>
            {c.label}
        </span>
    );
};

const COMPLAINT_CATEGORIES = [
    { id: 'food', label: 'Food & Dining', icon: 'Utensils', examples: 'Zomato, Swiggy' },
    { id: 'ecommerce', label: 'E-Commerce', icon: 'ShoppingBag', examples: 'Amazon, Flipkart' },
    { id: 'quick-commerce', label: 'Quick Commerce', icon: 'Zap', examples: 'Zepto, Blinkit' },
    { id: 'travel', label: 'Travel & Stay', icon: 'Plane', examples: 'MMT, Oyo' },
    { id: 'banking', label: 'Banking & Fintech', icon: 'CreditCard', examples: 'Paytm, Banks' },
    { id: 'other', label: 'Others', icon: 'MoreHorizontal', examples: 'General issues' },
];

const POPULAR_COMPANIES: Record<string, string[]> = {
    food: ['Zomato', 'Swiggy', 'KFC', 'Domino\'s', 'Pizza Hut', 'Other'],
    ecommerce: ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Meesho', 'Other'],
    'quick-commerce': ['Zepto', 'Blinkit', 'Instamart', 'BigBasket', 'Other'],
    travel: ['MakeMyTrip', 'Goibibo', 'Oyo', 'Airbnb', 'IndiGo', 'Other'],
    banking: ['Paytm', 'PhonePe', 'Google Pay', 'HDFC Bank', 'ICICI Bank', 'Other'],
    other: ['Airtel', 'Jio', 'Urban Company', 'Netflix', 'Other'],
};

const renderBudgetValue = (item: any) => {
    // Try all possible amount field names
    const exact = Number(
        item?.deal_amount ?? item?.exact_budget ?? item?.amount ??
        item?.total_amount ?? item?.budget ??
        (item?.amounts && item.amounts[0])
    );
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

const resolveCreatorDealProductImage = (item: any) => {
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
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    if (/^www\./i.test(raw)) return `https://${raw}`;
    return raw;
};

const isPortfolioVideoUrl = (value: string) => /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(String(value || '').trim());

const inferPortfolioPlatform = (value: string) => {
    const href = String(value || '').trim().toLowerCase();
    if (!href) return 'external';
    if (isPortfolioVideoUrl(href)) return 'upload';
    if (href.includes('instagram.com')) return 'instagram';
    if (href.includes('youtube.com') || href.includes('youtu.be')) return 'youtube';
    return 'external';
};

const normalizePortfolioItems = (rawItems: any, legacyLinks?: string[] | null): PortfolioItem[] => {
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

const buildPortfolioSlots = (rawItems: any, legacyLinks?: string[] | null): PortfolioItem[] => {
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

const getCreatorDealCardUX = (deal: any) => {
    const rawStatus = normalizeDealStatus(deal);

    const isCompleted = rawStatus.includes('completed') || rawStatus === 'paid';
    const isRevisionRequested = rawStatus.includes('revision_requested') || rawStatus.includes('changes_requested') || rawStatus.includes('brand_revision_requested');
    const isRevisionDone = rawStatus.includes('revision_done') || rawStatus.includes('revision_submitted');
    const requiresShipping = inferCreatorRequiresShipping(deal);
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
        cta = 'Submit Revision';
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

const DashboardLoadingStage = ({ isDark, tab = 'analytics' }: { isDark: boolean; tab?: string }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {tab === 'dashboard' ? (
                <>
                    {/* Skeleton for Welcome Header */}
                    <div className="relative z-10 -mt-2 mb-6">
                        <div className={cn(
                            "absolute inset-0 -z-10 overflow-hidden rounded-b-[40px] border-b",
                            isDark ? "bg-[#0B1A14] border-emerald-900/20" : "bg-emerald-600 border-emerald-700"
                        )}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>
                        <div className="px-6 pt-8 pb-12 space-y-3">
                            <div className={cn("h-3 w-32 rounded-full", isDark ? "bg-white/10" : "bg-white/20")} />
                            <div className={cn("h-8 w-64 rounded-xl", isDark ? "bg-white/10" : "bg-white/20")} />
                            <div className={cn("h-4 w-48 rounded-lg", isDark ? "bg-white/10" : "bg-white/20")} />
                        </div>
                    </div>

                    <div className="px-5 space-y-6">
                        {/* Skeleton for Earnings Card */}
                        <div className={cn("h-40 rounded-[32px] border relative overflow-hidden", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>

                        {/* Skeleton for Offers Section */}
                        <div className={cn("p-8 rounded-[40px] border space-y-6", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")}>
                            <div className="flex items-center justify-between">
                                <div className={cn("h-6 w-40 rounded-lg", isDark ? "bg-white/10" : "bg-slate-100")} />
                                <div className={cn("h-4 w-20 rounded-full", isDark ? "bg-white/10" : "bg-slate-100")} />
                            </div>
                            {[0, 1].map(i => (
                                <div key={i} className={cn("h-24 rounded-3xl border relative overflow-hidden", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Skeleton for Analytics Header */}
                    <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn("w-6 h-6 rounded-full", isDark ? "bg-white/10" : "bg-slate-200")} />
                            <div className={cn("h-4 w-32 rounded-lg", isDark ? "bg-white/10" : "bg-slate-200")} />
                            <div className={cn("w-11 h-11 rounded-full", isDark ? "bg-white/10" : "bg-slate-200")} />
                        </div>
                        <div className="space-y-3">
                            <div className={cn("h-7 w-32 rounded-lg", isDark ? "bg-white/10" : "bg-slate-200")} />
                            <div className={cn("h-4 w-full rounded-lg", isDark ? "bg-white/10" : "bg-slate-200")} />
                        </div>
                    </div>

                    <div className="px-5 space-y-6">
                        {/* Skeleton for Performance Card */}
                        <div className={cn("h-32 rounded-3xl border relative overflow-hidden", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>

                        {/* Skeleton for Filter */}
                        <div className={cn("h-12 rounded-2xl border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")} />

                        {/* Skeleton for Insights */}
                        <div className={cn("h-48 rounded-[32px] border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")} />

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18, duration: 0.35 }}
                            className="space-y-3"
                        >
                            <ShimmerSkeleton className="h-24 w-full rounded-3xl" />
                            <div className="grid grid-cols-2 gap-3">
                                <ShimmerSkeleton className="h-24 rounded-2xl" />
                                <ShimmerSkeleton className="h-24 rounded-2xl" />
                                     </div>
                                         {/* Quick Actions / Lifestyle Shield */}
                                         <div className="px-5 space-y-4">
                                             <div className={cn(
                                                 "p-6 rounded-[32px] border relative overflow-hidden group",
                                                 isDark ? "bg-[#0B1324] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/40"
                                             )}>
                                                 <div className="flex items-center gap-4 relative z-10">
                                                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                         <Shield className="w-6 h-6" />
                                                     </div>
                                                     <div className="flex-1 min-w-0">
                                                         <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-40 mb-0.5", textColor)}>Consumer Protection</p>
                                                         <h3 className={cn("text-lg font-black tracking-tight italic uppercase", textColor)}>Lifestyle Shield</h3>
                                                     </div>
                                                 </div>
                                                 <p className={cn("text-xs font-medium opacity-40 leading-relaxed mt-4 relative z-10", textColor)}>
                                                     Got cheated by a brand or service? File a legal notice in minutes.
                                                 </p>
                                                 <div className="flex gap-3 mt-6 relative z-10">
                                                     <button 
                                                         onClick={() => { triggerHaptic(); setActiveTab('profile'); setActiveSettingsPage('consumer-complaints'); }}
                                                         className="flex-1 bg-primary text-white font-black italic py-3 rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20"
                                                     >
                                                         File Notice
                                                     </button>
                                                     <button 
                                                         onClick={() => {
                                                             triggerHaptic();
                                                             window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20a%20consumer%20complaint`, '_blank');
                                                         }}
                                                         className={cn(
                                                             "px-5 py-3 rounded-xl border flex items-center justify-center transition-all active:scale-95",
                                                             isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                                                         )}
                                                     >
                                                         <MessageSquare className="w-4 h-4 text-emerald-500" />
                                                     </button>
                                                 </div>
                                                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                             </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                 <button 
                                                     onClick={() => {
                                                         triggerHaptic();
                                                         window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20a%20legal%20issue`, '_blank');
                                                     }}
                                                     className={cn(
                                                         "p-5 rounded-[2.5rem] border flex flex-col gap-4 text-left group transition-all active:scale-95",
                                                         isDark ? "bg-[#0F172A] border-white/5" : "bg-slate-50 border-slate-200"
                                                     )}
                                                 >
                                                     <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                         <Landmark className="w-5 h-5" />
                                                     </div>
                                                     <div>
                                                         <p className={cn("text-[13px] font-black italic leading-tight mb-1", textColor)}>Contact Lawyer</p>
                                                         <p className={cn("text-[10px] font-bold opacity-30 uppercase tracking-widest", textColor)}>Legal Support</p>
                                                     </div>
                                                 </button>
                                                 <button 
                                                     onClick={() => {
                                                         triggerHaptic();
                                                         window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20the%20app`, '_blank');
                                                     }}
                                                     className={cn(
                                                         "p-5 rounded-[2.5rem] border flex flex-col gap-4 text-left group transition-all active:scale-95",
                                                         isDark ? "bg-[#0F172A] border-white/5" : "bg-slate-50 border-slate-200"
                                                     )}
                                                 >
                                                     <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                         <Clock className="w-5 h-5" />
                                                     </div>
                                                     <div>
                                                         <p className={cn("text-[13px] font-black italic leading-tight mb-1", textColor)}>24/7 Response</p>
                                                         <p className={cn("text-[10px] font-bold opacity-30 uppercase tracking-widest", textColor)}>Fast Support</p>
                                                     </div>
                                                 </button>
                                             </div>
                                         </div>
                                 </motion.div>
                    </div>
                </>
            )}
        </div>
    );
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
const SettingsRow = ({ icon, label, subtext, iconColorClass, hasChevron, isDark, onClick, rightElement, labelClassName }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "flex items-center gap-4 py-4 px-5 active:opacity-60 transition-all cursor-pointer group",
            isDark ? "hover:bg-white/5 active:bg-white/10" : "hover:bg-slate-50 active:bg-slate-100"
        )}
    >
        <div className={cn("w-6 h-6 flex items-center justify-center shrink-0", iconColorClass)}>
            {icon && React.cloneElement(icon, { size: 20, strokeWidth: 1.5 })}
        </div>
        <div className="flex-1 min-w-0">
            <p className={cn("text-[15px] font-bold leading-tight", isDark ? "text-white" : "text-[#111827]", labelClassName)}>{label}</p>
            {subtext && <p className={cn("text-[12px] font-medium leading-tight mt-1 opacity-70", isDark ? "text-white/80" : "text-[#6B7280]")}>{subtext}</p>}
        </div>
        {rightElement}
        {hasChevron && !rightElement && <ChevronRight className={cn("w-5 h-5 opacity-30", isDark ? "text-white" : "text-slate-400")} />}
    </div>
);

const SettingsGroup = ({ children, isDark, className }: any) => (
    <div className={cn(
        "mx-5 overflow-hidden rounded-[2.5rem] border mb-6",
        isDark ? "bg-[#0b1324]/40 border-white/10 divide-white/5 shadow-2xl shadow-black/20" : "bg-white border-slate-100 divide-slate-50 shadow-xl shadow-slate-200/40",
        "divide-y backdrop-blur-xl",
        className
    )}>
        {children}
    </div>
);

const SectionHeader = ({ title, isDark }: any) => (
    <p className={cn(
        "px-6 mb-3 mt-8 text-[11px] font-black uppercase tracking-[0.25em] opacity-80",
        isDark ? "text-white/30" : "text-slate-400"
    )}>
        {title}
    </p>
);

const ToggleSwitch = ({ active, onToggle, isDark }: any) => (
    <button type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
            "w-[44px] h-[26px] rounded-full relative transition-all duration-300 ease-in-out px-1 flex items-center shadow-inner",
            active ? (isDark ? "bg-primary" : "bg-primary") : (isDark ? "bg-white/10" : "bg-slate-200")
        )}
    >
        <motion.div
            animate={{ x: active ? 18 : 0, scale: active ? 1.05 : 1 }}
            className="w-5 h-5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
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
        const part = nonPincodeParts[0];
        // Heuristic: If it has numbers or is quite long, it's probably an address, not just a city name
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

const buildProfileFormData = (profile: any, userEmail?: string | null) => {
    const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.full_name || '';
    const parsedLocation = parseLocationParts(profile?.location);
    const portfolioItems = buildPortfolioSlots(profile?.portfolio_items || profile?.collab_past_work_items, profile?.portfolio_links);
    const normalizeNicheLabel = (value: string) => {
        const raw = String(value || '').trim().toLowerCase();
        const aliases: Record<string, string> = {
            beauty: 'Beauty',
            fashion: 'Fashion',
            lifestyle: 'Lifestyle',
            tech: 'Tech & Gadgets',
            'tech & gadgets': 'Tech & Gadgets',
            fitness: 'Fitness',
            food: 'Food',
            travel: 'Travel',
            gaming: 'Gaming',
            education: 'Education',
            parenting: 'Parenting',
            pets: 'Pets',
            finance: 'Finance',
            art: 'Art',
            entertainment: 'Entertainment',
            sports: 'Sports',
            business: 'Business',
            wellness: 'Wellness',
            automotive: 'Automotive',
            spirituality: 'Spirituality',
            'food/cooking': 'Food',
            'food cooking': 'Food',
            'business/finance': 'Business',
            'business finance': 'Business',
            'fitness/health': 'Fitness',
            'fitness health': 'Fitness',
        };
        if (aliases[raw]) return aliases[raw];
        return value;
    };
    const normalizeVibeLabel = (value: string) => {
        const raw = String(value || '').trim().toLowerCase();
        const aliases: Record<string, string> = {
            'experimental': 'Experimental',
            'aesthetic': 'Aesthetic',
            'relatable': 'Relatable',
            'informative': 'Informative',
            'high energy': 'High Energy',
            'minimalist': 'Minimalist',
            'luxury': 'Luxury',
            'bold': 'Bold',
            'fun': 'Fun',
            'professional': 'Professional',
            'authentic': 'Authentic',
            'cinematic': 'Cinematic',
        };
        return aliases[raw] || value;
    };
    return {
        full_name: fullName,
        email: profile?.email || userEmail || '',
        phone: profile?.phone || '',
        bio: profile?.bio || '',
        pincode: profile?.pincode || parsedLocation.pincode || '',
        city: profile?.city || profile?.collab_region_label || parsedLocation.city || '',
        address: profile?.address || profile?.shipping_address || parsedLocation.address || '',
        instagram_handle: profile?.instagram_handle || '',
        media_kit_url: profile?.media_kit_url || '',
        open_to_collabs: profile?.open_to_collabs ?? true,

        collaboration_preference: profile?.collaboration_preference || 'Hybrid',
        avg_rate_reel: profile?.avg_rate_reel || profile?.suggested_reel_rate || '5000',
        suggested_reel_rate: profile?.suggested_reel_rate || profile?.avg_rate_reel || '5000',
        story_price: profile?.story_price || '2000',
        content_niches: Array.isArray(profile?.content_niches) && profile.content_niches.length > 0 
            ? profile.content_niches.map(normalizeNicheLabel) 
            : ['Lifestyle', 'Fashion'],
        content_vibes: Array.isArray(profile?.content_vibes) && profile.content_vibes.length > 0 
            ? profile.content_vibes.map(normalizeVibeLabel) 
            : ['Aesthetic', 'Relatable'],
        bank_account_name: profile?.bank_account_name || '',
        instagram_followers: profile?.instagram_followers || profile?.followers_count || profile?.followers || '',
        payout_upi: profile?.payout_upi || profile?.bank_upi || profile?.upi_id || 'creator@okaxis',
        deal_templates: Array.isArray(profile?.deal_templates) && profile.deal_templates.length > 0 
            ? profile.deal_templates 
            : (() => {
                const baselineRate = Number(profile?.avg_rate_reel || profile?.suggested_reel_rate || 5000);
                return [
                  { 
                    id: 'basic', 
                    name: '🚀 Starter Collab', 
                    price: String(baselineRate), 
                    description: 'High-performing Reel optimized for organic reach. Best for first-time brand discovery.',
                    deliverables: ['1 Reel (15-30s)', 'Organic reach focus', 'Basic editing'],
                    duration: '5 Days' 
                  },
                  { 
                    id: 'standard', 
                    name: '⭐ Growth Campaign', 
                    price: String(Math.round(baselineRate * 2)), 
                    description: 'Includes 30-day usage rights so brands can run ads and drive conversions.',
                    deliverables: ['1 Premium Reel (30-60s)', '30-day usage rights (for ads)', 'Script + hook optimization', '1 Story shoutout'],
                    duration: '7 Days' 
                  },
                  { 
                    id: 'barter', 
                    name: '🎁 Product Exchange', 
                    price: '0', 
                    description: 'Product unboxing or review with no paid usage rights. Best for authentic product proof.',
                    deliverables: ['Product unboxing / review', '1 Story mention', 'No paid usage rights'],
                    duration: '14 Days' 
                  }
                ];
              })(),
        // NEW: Audience Demographics
        audience_gender_split: profile?.audience_gender_split || '65% Female • 35% Male',
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
        portfolio_items: portfolioItems,
        portfolio_links: portfolioItems.map((item) => item.sourceUrl || '').filter(Boolean),
        past_brands: Array.isArray(profile?.past_brands) ? profile.past_brands : [],
        // NEW: CTA & Social Customization
        collab_cta_trust_note: profile?.collab_cta_trust_note || '',
        collab_cta_dm_note: profile?.collab_cta_dm_note || '',
        collab_cta_platform_note: profile?.collab_cta_platform_note || '',
        // NEW: Discovery Media
        discovery_video_url: profile?.discovery_video_url || null,
        portfolio_videos: Array.isArray(profile?.portfolio_videos) ? profile.portfolio_videos : [],
        instagram_profile_photo: profile?.instagram_profile_photo || profile?.avatar_url || null,
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
    offersError,
    dealsError,
    isLoadingDealsOverride = false,
    isLoadingProfile = false,
    profileViewsToday = 0
}: MobileDashboardProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const signOutMutation = useSignOut();
    const updateDealProgress = useUpdateDealProgress();
    const updateProfile = useUpdateProfile();
    const { session, user, refetchProfile } = useSession();
    const userId = user?.id || session?.user?.id || '';
    
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
    const rawTab = searchParams.get('tab');
    // Normalize legacy tabs:
    // - 'account' -> 'profile'
    // - 'collabs' -> 'deals' (older deep-links used /creator-dashboard?tab=collabs)
    const tabMap: Record<string, string> = { dashboard: 'dashboard', deals: 'deals', collabs: 'deals', payments: 'payments', profile: 'profile', account: 'profile' };
    const activeTab = (tabMap[rawTab || ''] || 'dashboard') as 'dashboard' | 'deals' | 'discovery' | 'payments' | 'profile';
    const setActiveTab = (tab: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        // If we navigate away from deals, clear deals-specific params so we don't get forced back.
        if (tab !== 'deals') {
            next.delete('subtab');
            next.delete('requestId');
            next.delete('dealId');
        }
        setSearchParams(next, { replace: true });
    };

    const requestIdParam = (searchParams.get('requestId') || '').trim() || null;
    const dealIdParam = (searchParams.get('dealId') || '').trim() || null;
    const subtabParam = (searchParams.get('subtab') as 'active' | 'pending' | 'completed' | null) || null;

    const [collabSubTab, setCollabSubTab] = useState<'active' | 'pending' | 'completed'>('pending');
    const [showSharingTips, setShowSharingTips] = useState(false);
    const hasHandledDeepLinkRef = useRef(false);
    useEffect(() => {
        // Don't force-switch tabs just because a stale `subtab` is present in the URL.
        // Deals-specific params are cleared by `setActiveTab` when leaving the deals tab.
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
    
    const totalFollowers = (profile?.platforms || []).reduce((acc: number, p: any) => acc + (p.followers || 0), 0) || 50000;
    const pricingEstimate = (() => {
        if (totalFollowers < 5000) return { range: '₹1,500–₹3,500', label: '<5k' };
        if (totalFollowers < 20000) return { range: '₹3,000–₹7,000', label: '5k–20k' };
        if (totalFollowers < 100000) return { range: '₹6,000–₹18,000', label: '20k–100k' };
        if (totalFollowers < 500000) return { range: '₹15,000–₹45,000', label: '100k–500k' };
        return { range: '₹50,000+', label: '500k+' };
    })();

    // Meta Theme Color Manager: Makes the browser status bar match the app's tab color
    useEffect(() => {
        if (typeof document === 'undefined') return;
        
        let themeColor = '#061318'; // Default dark
        if (theme === 'light') {
            themeColor = '#FAFAFA';
        } else {
            // Tab-specific colors for dark mode to make it feel like a unified native app
            const tabColors: Record<string, string> = {
                dashboard: '#03110C', // Deep emerald
                deals: '#0B0F14',      // Charcoal
                payments: '#081018',   // Deep blue
                profile: '#0B0F14',    // Charcoal
            };
            themeColor = tabColors[activeTab] || '#061318';
        }

        // Update or create meta tag
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', themeColor);
        
        // Also update apple-mobile-web-app-status-bar-style if needed
        let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!appleMeta) {
            appleMeta = document.createElement('meta');
            appleMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
            document.head.appendChild(appleMeta);
        }
        appleMeta.setAttribute('content', 'black-translucent');
    }, [activeTab, theme]);

    // Prevent context menu for a more native feel on mobile
    useEffect(() => {
        const preventContextMenu = (e: MouseEvent) => {
            // Allow context menu on inputs and textareas
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }
            e.preventDefault();
        };

        window.addEventListener('contextmenu', preventContextMenu);
        return () => window.removeEventListener('contextmenu', preventContextMenu);
    }, []);

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

    // ============================================
    // AUTO-LOCALIZATION (Fix for Flaky Instagram DPs)
    // ============================================
    const [autoLocalizeAttempted, setAutoLocalizeAttempted] = useState(false);
    useEffect(() => {
        const localize = async () => {
            // Only attempt once per session and only if we have a profile to work with
            if (autoLocalizeAttempted || !userId || !profile) return;
            
            // Check if we have an external Insta photo but NO internal avatar_url
            // Or if the internal avatar_url is NOT a supabase link yet
            const instaPhoto = profile.instagram_profile_photo;
            const localPhoto = profile.avatar_url;
            
            const isExternal = instaPhoto && (instaPhoto.includes('fbcdn.net') || instaPhoto.includes('instagram.com'));
            const isLocalMissing = !localPhoto || !localPhoto.includes('supabase.co');
            
            if (isExternal && isLocalMissing) {
                setAutoLocalizeAttempted(true);
                try {
                    // Use wsrv.nl proxy to avoid CORS when fetching the image blob
                    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(instaPhoto)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) return;
                    
                    const blob = await response.blob();
                    const file = new File([blob], `avatar-${userId}.jpg`, { type: 'image/jpeg' });
                    
                    const { url } = await uploadFile(file, {
                        category: 'document',
                        userId,
                        folder: 'avatars'
                    });
                    
                    if (url) {
                        await supabase
                            .from('profiles')
                            .update({ avatar_url: url })
                            .eq('id', userId);
                        
                        // Refetch profile so SessionContext and UI get the new permanent URL
                        if (refetchProfile) refetchProfile();
                    }
                } catch (err) {
                    console.error('[AutoLocalizeAvatar] Background sync failed:', err);
                }
            }
        };
        
        localize();
    }, [userId, profile, autoLocalizeAttempted, refetchProfile]);

    const getSelectedItemUrl = () => {
        if (!selectedItem) return null;
        const itemId = String(selectedItem?.id || selectedItem?.raw?.id || '').trim();
        if (!itemId) return null;

        if (selectedType === 'offer') return `/collab-requests/${itemId}/brief`;
        if (selectedType === 'deal') return `/creator-dashboard?tab=deals&subtab=active&dealId=${itemId}`;
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
    const [hasFiledComplaint, setHasFiledComplaint] = useState(false);
    const [filedComplaints, setFiledComplaints] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('nb_filed_complaints');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('nb_filed_complaints', JSON.stringify(filedComplaints));
    }, [filedComplaints]);
    const [complaintStep, setComplaintStep] = useState<'initial' | 'category' | 'company' | 'details' | 'submitting'>('initial');
    const [selectedComplaintCategory, setSelectedComplaintCategory] = useState<string | null>(null);
    const [selectedComplaintCompany, setSelectedComplaintCompany] = useState<string | null>(null);
    const [complaintDescription, setComplaintDescription] = useState('');

    const resetComplaintForm = () => {
        setComplaintStep('initial');
        setSelectedComplaintCategory(null);
        setSelectedComplaintCompany(null);
        setComplaintDescription('');
    };
    const [activeSettingsAnchor, setActiveSettingsAnchor] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string>('identity');
    const [showPushInstallGuide, setShowPushInstallGuide] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);
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
    const [isLoadingDealsLocal, setIsLoadingDeals] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const isLoadingDeals = isLoadingDealsOverride || isLoadingDealsLocal;
    const hasDataLoadError = Boolean(offersError || dealsError);
    const contractSectionRef = useRef<HTMLDivElement | null>(null);
    const pricingSectionRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        if (activeSettingsPage === 'portfolio' && activeSettingsAnchor === 'pricing') {
            window.setTimeout(() => {
                pricingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveSettingsAnchor(null);
            }, 50);
        }
    }, [activeSettingsPage, activeSettingsAnchor]);

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
    // Only treat a handle as "real" when it comes from profile data; avoid defaulting to a fake
    // 'creator' handle which causes the dashboard to show a misleading "offer/collab link" card.
    const username = instagramHandle || usernameFallback || '';
    // Use DiceBear instead of ui-avatars.com (avoids external CDN dependency)
    const avatarSeed = username || 'creator';
    const avatarFallbackUrl = `https://api.dicebear.com/7.x/initials/svg?name=${encodeURIComponent(avatarSeed)}&backgroundColor=10B981&textColor=ffffff`;
    const resolveAvatarUrl = (candidate: any) => {
        const raw = String(candidate || '').trim();
        if (!raw) return '';
        let url = '';
        if (/^(https?:)?\/\//i.test(raw)) url = raw.startsWith('//') ? `https:${raw}` : raw;
        if (/^(data:|blob:)/i.test(raw)) return raw;
        
        // Proxy through wsrv.nl for ultra-fast CDN caching and compression (skips blob/data URIs and Supabase links which are already optimized)
        if (url && (url.includes('instagram.com') || url.includes('fbcdn.net'))) {
             return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=256&h=256&fit=cover`;
        }
        
        return url;
    };
    const avatarUrl =
        resolveAvatarUrl(profile?.instagram_profile_photo) ||
        resolveAvatarUrl(profile?.avatar_url) ||
        resolveAvatarUrl(liveCollabProfile?.profile_photo) ||
        avatarFallbackUrl;
    const avatarVersionedUrl = withCacheBuster(avatarUrl, profile?.updated_at) || avatarUrl;
    const rawDisplayName = liveCollabProfile?.name || 
        profile?.full_name || 
        (profile?.first_name ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}` : null) || 
        profile?.username || 
        'Creator';
    
    const decodedName = typeof rawDisplayName === 'string' 
        ? rawDisplayName.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
                        .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        : rawDisplayName;
    
    const displayName = (typeof decodedName === 'string' ? decodedName.trim().split(/\s+/)[0] : decodedName) || 'Creator';

    const uniqBy = <T,>(items: T[], keyFn: (row: T) => string) => {
        const seen = new Set<string>();
        const out: T[] = [];
        for (const item of items) {
            const k = String(keyFn(item) || '').trim();
            if (!k || seen.has(k)) continue;
            seen.add(k);
            out.push(item);
        }
        return out;
    };

    const dealFingerprint = (row: any) => {
        const signedKey = row?.signed_contract_path || row?.signed_contract_url || row?.signed_pdf_url || null;
        if (signedKey) return `signed:${String(signedKey)}`;
        const contractKey = row?.safe_contract_url || row?.contract_file_url || null;
        if (contractKey) return `contract:${String(contractKey)}`;
        const creator = String(row?.creator_id || row?.profiles?.id || '');
        const amount = String(row?.deal_amount || row?.exact_budget || '');
        const due = String(row?.due_date || row?.deadline || '');
        const deliverables = String(row?.deliverables || row?.collab_type || '').toLowerCase();
        return `fallback:${creator}:${amount}:${due}:${deliverables}`;
    };

    const uniqDeals = (rows: any[]) => {
        const byFingerprint = uniqBy(rows, (r) => dealFingerprint(r));
        const withId = byFingerprint.filter((x) => String(x?.id || x?.raw?.id || '').trim());
        const withoutId = byFingerprint.filter((x) => !String(x?.id || x?.raw?.id || '').trim());
        return [...uniqBy(withId, (x) => String(x?.id || x?.raw?.id || '').trim()), ...withoutId];
    };

    const offerKeyFromDeal = (deal: any) => {
        const idKey = String(
            deal?.collab_request_id ||
            deal?.request_id ||
            deal?.collabRequestId ||
            deal?.raw?.collab_request_id ||
            deal?.raw?.request_id ||
            ''
        ).trim();
        if (idKey) return { idKey, comboKey: '' };
        const brand = String(deal?.brand_name || deal?.brand?.name || deal?.raw?.brand_name || '').trim();
        const type = String(deal?.collab_type || deal?.raw?.collab_type || '').trim();
        const amt = String(deal?.deal_amount || deal?.exact_budget || deal?.raw?.deal_amount || '').trim();
        const comboKey = [brand, type, amt].filter(Boolean).join('|');
        return { idKey: '', comboKey };
    };

    const existingOfferKeys = React.useMemo(() => {
        const ids = new Set<string>();
        const combos = new Set<string>();
        for (const d of uniqDeals(brandDeals || [])) {
            const { idKey, comboKey } = offerKeyFromDeal(d);
            if (idKey) ids.add(idKey);
            if (comboKey) combos.add(comboKey);
        }
        return { ids, combos };
    }, [brandDeals]);
    const collabRequestImageByDealKey = React.useMemo(() => {
        const byRequestId = new Map<string, any>();
        const byCombo = new Map<string, any>();
        for (const req of (collabRequests || [])) {
            const requestId = String(req?.id || req?.request_id || '').trim();
            const comboKey = [
                req?.brand_name,
                req?.collab_type,
                req?.exact_budget || req?.budget_amount || req?.deal_amount
            ].filter(Boolean).join('|');
            if (requestId) byRequestId.set(requestId, req);
            if (comboKey) byCombo.set(comboKey, req);
        }
        return { byRequestId, byCombo };
    }, [collabRequests]);
    const hydrateDealWithRequestMedia = React.useCallback((deal: any) => {
        const existingProductImage = resolveCreatorDealProductImage(deal);
        if (existingProductImage) return deal;

        const requestId = String(
            deal?.collab_request_id ||
            deal?.request_id ||
            deal?.collabRequestId ||
            deal?.raw?.collab_request_id ||
            deal?.raw?.request_id ||
            ''
        ).trim();
        const comboKey = [
            deal?.brand_name || deal?.brand?.name || deal?.raw?.brand_name,
            deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type,
            deal?.deal_amount || deal?.exact_budget || deal?.raw?.deal_amount
        ].filter(Boolean).join('|');

        const matchedRequest =
            (requestId ? collabRequestImageByDealKey.byRequestId.get(requestId) : null) ||
            (comboKey ? collabRequestImageByDealKey.byCombo.get(comboKey) : null) ||
            null;

        const recoveredImage = resolveCreatorDealProductImage(matchedRequest);
        if (!recoveredImage) return deal;

        return {
            ...deal,
            barter_product_image_url: recoveredImage,
            raw: deal?.raw ? { ...deal.raw, barter_product_image_url: recoveredImage } : deal?.raw,
        };
    }, [collabRequestImageByDealKey]);
    const pendingOffersDeduplicated = React.useMemo(() => {
        const seen = new Set<string>();
        return (collabRequests || []).filter((req: any) => {
            // Dedupe by request ID primarily; fall back to brand+type+budget combo
            const idKey = String(req?.id || req?.request_id || '').trim();
            const comboKey = [req.brand_name, req.collab_type, req.exact_budget || req.budget_amount || req.deal_amount].filter(Boolean).join('|');
            const key = idKey || comboKey;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            // Only include truly pending collab requests as "New Offers".
            // (Confirmed deals live in `brandDeals` and should never show offer CTAs like "deliver content".)
            const status = String(req?.status || '').toLowerCase().trim();
            if (!(status === 'pending' || Boolean(req?.isDemo))) return false;

            // Cross-endpoint dedupe: if a deal already exists for this request, don't show it as "New Offer".
            if (idKey && existingOfferKeys.ids.has(idKey)) return false;
            if (!idKey && comboKey && existingOfferKeys.combos.has(comboKey)) return false;
            return true;
        });
    }, [collabRequests, existingOfferKeys]);
    const displayOffers = React.useMemo(() => {
        return pendingOffersDeduplicated;
    }, [pendingOffersDeduplicated]);
    const pendingOffersCount = displayOffers.length;
    const completedDealsList = React.useMemo(() => {
        return uniqDeals((brandDeals || []).filter((d: any) => {
            const s = normalizeDealStatus(d);
            // Completed, paid, OR declined/cancelled/rejected
            return s.includes('completed') || s === 'paid' || s === 'declined' || s === 'rejected' || s === 'cancelled';
        })).map((deal: any) => hydrateDealWithRequestMedia(deal));
    }, [brandDeals, hydrateDealWithRequestMedia]);
    const activeDealsList = React.useMemo(() => {
        return uniqDeals((brandDeals || []).filter((d: any) => {
            const s = normalizeDealStatus(d);
            // Exclude completed, paid, AND rejected/cancelled/declined deals
            return !(s.includes('completed') || s === 'paid' || s === 'declined' || s === 'rejected' || s === 'cancelled');
        })).map((deal: any) => hydrateDealWithRequestMedia(deal));
    }, [brandDeals, hydrateDealWithRequestMedia]);
    const actionRequiredDealsList = React.useMemo(() => {
        return (activeDealsList || []).filter((d: any) => Boolean(getCreatorDealCardUX(d).needsCreatorAction));
    }, [activeDealsList]);
    const actionRequiredDealsCount = actionRequiredDealsList.length;
    const actionRequiredTotalCount = pendingOffersCount + actionRequiredDealsCount;
    const activeDealsCount = activeDealsList.length;
    const completedDealsCount = completedDealsList.length;
    const creatorActivities = React.useMemo(() => {
        const offerActivities = pendingOffersDeduplicated.map((req: any, idx: number) => ({
            id: `offer:${req?.id || idx}`,
            type: 'message' as const,
            title: 'New Offer Received',
            description: `${String(req?.brand_name || 'Brand')} sent ${String(req?.collab_type || 'a collab offer')}`,
            timestamp: parseDealDate(req?.created_at || req?.updated_at) || new Date(),
            imageUrl: resolveCreatorDealProductImage(req) || undefined,
        }));

        const activeDealActivities = activeDealsList.map((deal: any, idx: number) => ({
            id: `active:${deal?.id || idx}`,
            type: inferCreatorRequiresPayment(deal) ? ('deal' as const) : ('reminder' as const),
            title: 'Deal Active',
            description: `${String(deal?.brand_name || 'Brand')} • ${String(deal?.collab_type || deal?.deal_type || 'Collaboration')}`,
            timestamp: parseDealDate(deal?.updated_at || deal?.created_at) || new Date(),
            imageUrl: resolveCreatorDealProductImage(deal) || undefined,
        }));

        const completedDealActivities = completedDealsList.map((deal: any, idx: number) => ({
            id: `completed:${deal?.id || idx}`,
            type: 'payment' as const,
            title: 'Deal Completed',
            description: `${String(deal?.brand_name || 'Brand')} • ${renderBudgetValue(deal)}`,
            timestamp: parseDealDate(deal?.updated_at || deal?.created_at) || new Date(),
            imageUrl: resolveCreatorDealProductImage(deal) || undefined,
        }));

        return [...offerActivities, ...activeDealActivities, ...completedDealActivities]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 8);
    }, [pendingOffersDeduplicated, activeDealsList, completedDealsList]);

    const performanceInsightMessage = React.useMemo(() => {
        if (pendingOffersCount > 0) {
            return `You have ${pendingOffersCount} new offer${pendingOffersCount > 1 ? 's' : ''}. Reply fast to show brands you're ready to collaborate!`;
        }
        if (actionRequiredDealsCount > 0) {
            return `You have ${actionRequiredDealsCount} deal${actionRequiredDealsCount > 1 ? 's' : ''} requiring action. Complete them to boost your Trust Score.`;
        }
        if (activeDealsCount > 0) {
            return "You're doing great! Keep delivering high-quality content to unlock more premium brand invites.";
        }
        return "Share your collab link on Instagram to start receiving offers from brands directly!";
    }, [pendingOffersCount, actionRequiredDealsCount, activeDealsCount]);
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
            // For completed deals use due_date (when payment was due)
            // For active deals use created_at (work is happening now, revenue counts this month)
            const rawStatus = normalizeDealStatus(deal);
            const isCompleted = rawStatus.includes('completed') || rawStatus === 'paid';
            let dateStr: string;
            if (isCompleted) {
                dateStr = deal.payment_received_date || deal.payment_expected_date || deal.due_date || deal.created_at;
            } else {
                dateStr = deal.created_at || deal.due_date;
            }
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
                const photoUrl = creator.profile_photo || null;
                const proxiedPhoto = photoUrl && (photoUrl.includes('fbcdn.net') || photoUrl.includes('instagram.com'))
                    ? `https://wsrv.nl/?url=${encodeURIComponent(photoUrl)}`
                    : photoUrl;

                setLiveCollabProfile({
                    name: creator.name || null,
                    profile_photo: proxiedPhoto,
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
    const scrollPositionsRef = useRef<Record<string, number>>({});

    const isDark = theme === 'dark';
    // Brand-like background base (gradient overlays applied in JSX below)
    const bgColor = isDark ? '#020D0A' : '#FFFFFF';
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

    // Fix 4: Restore scroll position when switching back to a tab
    React.useEffect(() => {
        if (scrollRef.current) {
            const saved = scrollPositionsRef.current[activeTab];
            if (saved !== undefined) {
                requestAnimationFrame(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = saved;
                });
            } else {
                requestAnimationFrame(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = 0;
                });
            }
        }
    }, [activeTab]);

    // When opening a settings sub-page (like payouts), force scroll to top.
    React.useEffect(() => {
        if (!activeSettingsPage) return;
        if (!scrollRef.current) return;
        requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
        });
    }, [activeSettingsPage]);
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


    const triggerHaptic = (pattern: any = HapticPatterns.light) => {
        globalTriggerHaptic(pattern);
    };

    // Auto-sync Instagram stats if stale
    useInstagramSync(profile);

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [activeCitySuggestionField, setActiveCitySuggestionField] = useState<number | null>(null);
    const hasHydratedCollabFieldsRef = useRef(false);

    const [uploadingPortfolioSlot, setUploadingPortfolioSlot] = useState<number | null>(null);
    const [profileFormData, setProfileFormData] = useState<any>(buildProfileFormData(profile, user?.email || null));
    const profileCompleteness = useMemo(() => {
        const fields = [
            !!profileFormData.full_name?.trim(),
            !!profileFormData.bio?.trim(),
            !!profileFormData.instagram_handle?.trim(),
            !!profileFormData.avg_rate_reel,
            !!profileFormData.pricing_min || !!profileFormData.pricing_avg || !!profileFormData.pricing_max,
            profileFormData.content_niches?.length > 0,
            !!profileFormData.avg_reel_views_manual?.trim(),
            !!profileFormData.collab_region_label?.trim(),
            !!profileFormData.collab_brands_count_override?.trim(),
            !!profileFormData.media_kit_url?.trim(),
        ];
        const filled = fields.filter(Boolean).length;
        return Math.round((filled / fields.length) * 100);
    }, [profileFormData]);

    useEffect(() => {
        if (profile && !isSavingProfile) {
            const nextData = buildProfileFormData(profile, user?.email || null);
            setProfileFormData((prev: any) => ({
                ...prev,
                ...nextData,
                content_niches: Array.isArray(nextData.content_niches) && nextData.content_niches.length > 0
                    ? nextData.content_niches
                    : prev.content_niches || [],
                content_vibes: Array.isArray(nextData.content_vibes) && nextData.content_vibes.length > 0
                    ? nextData.content_vibes
                    : prev.content_vibes || [],
                top_cities: Array.isArray(nextData.top_cities) && nextData.top_cities.length > 0
                    ? nextData.top_cities
                    : prev.top_cities || [],
                audience_gender_split: nextData.audience_gender_split || prev.audience_gender_split || '',
                audience_age_range: nextData.audience_age_range || prev.audience_age_range || '',
                primary_audience_language: nextData.primary_audience_language || prev.primary_audience_language || '',
                collab_region_label: nextData.collab_region_label || prev.collab_region_label || '',
            }));
        }
    }, [profile, user?.email, isSavingProfile]);

    useEffect(() => {
        if (hasHydratedCollabFieldsRef.current) return;
        if (!session?.user?.id || activeTab !== 'profile') return;

        const hasHydratedCoreCollabFields =
            Array.isArray(profileFormData.content_niches) &&
            profileFormData.content_niches.length > 0 &&
            Array.isArray(profileFormData.content_vibes) &&
            profileFormData.content_vibes.length > 0 &&
            Boolean(profileFormData.audience_gender_split) &&
            Boolean(profileFormData.audience_age_range) &&
            (
                Boolean(profileFormData.primary_audience_language) ||
                (Array.isArray(profileFormData.top_cities) && profileFormData.top_cities.some((city: string) => String(city || '').trim()))
            );

        if (hasHydratedCoreCollabFields) {
            hasHydratedCollabFieldsRef.current = true;
            return;
        }

        let cancelled = false;
        (async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('content_niches, audience_gender_split, audience_age_range, primary_audience_language, top_cities, content_vibes, collab_region_label')
                .eq('id', session.user.id)
                .maybeSingle();

            if (cancelled || error || !data) return;

            setProfileFormData((prev: any) => ({
                ...prev,
                content_niches: Array.isArray(data.content_niches) && data.content_niches.length > 0
                    ? data.content_niches
                    : prev.content_niches || [],
                audience_gender_split: data.audience_gender_split || prev.audience_gender_split || '',
                audience_age_range: data.audience_age_range || prev.audience_age_range || '',
                primary_audience_language: data.primary_audience_language || prev.primary_audience_language || '',
                top_cities: Array.isArray(data.top_cities) && data.top_cities.length > 0
                    ? data.top_cities
                    : prev.top_cities || [],
                content_vibes: Array.isArray(data.content_vibes) && data.content_vibes.length > 0
                    ? data.content_vibes
                    : prev.content_vibes || [],
                collab_region_label: data.collab_region_label || prev.collab_region_label || '',
            }));
            hasHydratedCollabFieldsRef.current = true;
        })();

        return () => {
            cancelled = true;
        };
    }, [
        activeTab,
        session?.user?.id,
        profileFormData.audience_gender_split,
        profileFormData.audience_age_range,
        profileFormData.primary_audience_language,
        profileFormData.content_niches,
        profileFormData.top_cities,
        profileFormData.content_vibes,
    ]);

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

            const normalizedPortfolioItems = normalizePortfolioItems(profileFormData.portfolio_items, profileFormData.portfolio_links);
            const updateProfilePatch = async (
                payload: Record<string, unknown>,
                options?: { ignoreMissingColumn?: boolean; required?: boolean }
            ) => {
                const { data, error } = await (supabase as any)
                    .from('profiles')
                    .update(payload)
                    .eq('id', session.user.id)
                    .select('id')
                    .maybeSingle();

                if (!error) {
                    return { data, skipped: false };
                }

                const isMissingColumn = error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204';
                if (options?.ignoreMissingColumn && isMissingColumn) {
                    console.warn('[handleSaveProfile] Skipping unsupported profile fields:', Object.keys(payload));
                    return { data: null, skipped: true };
                }

                throw error;
            };

            const corePayload: Record<string, unknown> = {
                first_name,
                last_name,
                phone: profileFormData.phone || null,
                bio: profileFormData.bio || null,
                location: location,
                updated_at: new Date().toISOString(),
            };

            // Request updated row back so we can detect "0 rows updated" (which otherwise looks like success).
            const { data: updatedCore } = await updateProfilePatch(corePayload, { required: true });
            if (!updatedCore) {
                // Supabase returns `data: null` when no rows matched (e.g. profile id mismatch / RLS).
                // Do not show a false-positive "saved".
                toast.error('Could not save: profile row not updated. Please contact support.');
                return;
            }

            const optionalProfilePatches: Record<string, unknown>[] = [
                { instagram_profile_photo: profileFormData.instagram_profile_photo || profileFormData.avatar_url || null },
                { avatar_url: profileFormData.avatar_url || profileFormData.instagram_profile_photo || null },
                { discovery_video_url: profileFormData.discovery_video_url || null },
                { media_kit_url: profileFormData.media_kit_url || null },
                { avg_rate_reel: Number(profileFormData.avg_rate_reel) || null },
                { bank_account_name: profileFormData.bank_account_name?.trim() || null },
                { payout_upi: profileFormData.payout_upi?.trim() || null },
                { open_to_collabs: profileFormData.open_to_collabs },
                { story_price: Number(profileFormData.story_price) || null },
                { instagram_followers: Number(profileFormData.instagram_followers) || 0 },
                { city: profileFormData.city || null },
                { collaboration_preference: profileFormData.collaboration_preference || 'Hybrid' },
                { portfolio_links: normalizedPortfolioItems.map((item) => item.sourceUrl || '').filter(Boolean) },
                { collab_past_work_items: normalizedPortfolioItems },
                {
                    suggested_reel_rate: Number(profileFormData.avg_rate_reel) || null,
                    suggested_paid_range_min: Number(profileFormData.avg_rate_reel) || null,
                    suggested_paid_range_max: Number(profileFormData.avg_rate_reel) ? Number(profileFormData.avg_rate_reel) * 1.5 : null,
                    starting_price: Number(profileFormData.avg_rate_reel) || null,
                },
                { deal_templates: profileFormData.deal_templates || [] },
                { posting_frequency: profileFormData.posting_frequency || null },
                { active_brand_collabs_month: profileFormData.active_brand_collabs_month || null },
                { past_brand_count: Number(profileFormData.past_brand_count) || 0 },
                { avg_reel_views_manual: profileFormData.avg_reel_views_manual || null },
                { avg_likes_manual: profileFormData.avg_likes_manual || null },
                { collab_region_label: profileFormData.collab_region_label || null },
            ];

            if (profileFormData.audience_gender_split) {
                optionalProfilePatches.push({ audience_gender_split: profileFormData.audience_gender_split });
            }
            if (profileFormData.audience_age_range) {
                optionalProfilePatches.push({ audience_age_range: profileFormData.audience_age_range });
            }
            if (profileFormData.primary_audience_language) {
                optionalProfilePatches.push({ primary_audience_language: profileFormData.primary_audience_language });
            }
            if (Array.isArray(profileFormData.top_cities) && profileFormData.top_cities.some((city: string) => String(city || '').trim())) {
                optionalProfilePatches.push({ top_cities: profileFormData.top_cities.filter((city: string) => String(city || '').trim()) });
            }
            if (Array.isArray(profileFormData.content_niches) && profileFormData.content_niches.length > 0) {
                optionalProfilePatches.push({ content_niches: profileFormData.content_niches });
            }
            if (Array.isArray(profileFormData.content_vibes) && profileFormData.content_vibes.length > 0) {
                optionalProfilePatches.push({ content_vibes: profileFormData.content_vibes });
            }

            for (const patch of optionalProfilePatches) {
                await updateProfilePatch(patch, { ignoreMissingColumn: true });
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

    const generateVideoPosterFile = async (file: File, slotIdx: number): Promise<File | null> => {
        if (typeof document === 'undefined') return null;
        const objectUrl = URL.createObjectURL(file);
        try {
            const video = document.createElement('video');
            video.src = objectUrl;
            video.muted = true;
            video.playsInline = true;
            video.preload = 'metadata';

            await new Promise<void>((resolve, reject) => {
                video.onloadeddata = () => resolve();
                video.onerror = () => reject(new Error('Failed to load uploaded video for poster generation.'));
            });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 720;
            canvas.height = video.videoHeight || 1280;
            const context = canvas.getContext('2d');
            if (!context) return null;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.82);
            });
            if (!blob) return null;

            return new File([blob], `portfolio-poster-${slotIdx + 1}.jpg`, { type: 'image/jpeg' });
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    };

    const handlePortfolioVideoUpload = async (slotIdx: number, file: File) => {
        if (!session?.user?.id) return;
        setUploadingPortfolioSlot(slotIdx);
        try {
            const result = await uploadFile(file, {
                category: 'document',
                userId: session.user.id,
                fileName: `portfolio-video-${slotIdx + 1}`,
                folder: 'portfolio-videos',
            });
            const posterFile = await generateVideoPosterFile(file, slotIdx);
            const posterResult = posterFile
                ? await uploadFile(posterFile, {
                    category: 'document',
                    userId: session.user.id,
                    fileName: `portfolio-poster-${slotIdx + 1}`,
                    folder: 'portfolio-posters',
                })
                : null;

            setProfileFormData((prev: any) => {
                const updated = buildPortfolioSlots(prev.portfolio_items, prev.portfolio_links);
                while (updated.length <= slotIdx) {
                    updated.push({
                        id: `portfolio-item-${updated.length + 1}`,
                        sourceUrl: '',
                        title: '',
                        mediaType: 'link',
                        platform: 'external',
                    });
                }
                const existing = updated[slotIdx] || { id: `portfolio-item-${slotIdx + 1}` };
                updated[slotIdx] = {
                    ...existing,
                    id: String(existing.id || `portfolio-item-${slotIdx + 1}`),
                    sourceUrl: result.url,
                    posterUrl: posterResult?.url || existing.posterUrl || null,
                    title: existing.title || `Work Highlight ${slotIdx + 1}`,
                    mediaType: 'video',
                    platform: 'upload',
                };
                return {
                    ...prev,
                    portfolio_items: updated,
                    portfolio_links: updated.map((item) => item.sourceUrl || '').filter(Boolean),
                };
            });
            toast.success('Video uploaded. Tap Save All Changes to publish it.');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to upload video');
        } finally {
            setUploadingPortfolioSlot(null);
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
                else if (nameLower.includes('mellow')) color = 'bg-gradient-to-br from-orange-400 to-amber-600';
                else if (nameLower.includes('zomato')) color = 'bg-gradient-to-br from-rose-500 to-red-600';
                else if (nameLower.includes('swiggy')) color = 'bg-gradient-to-br from-orange-500 to-orange-600';
                else if (char >= 'A' && char <= 'E') color = 'bg-gradient-to-br from-violet-500 to-purple-600';
                else if (char >= 'F' && char <= 'J') color = 'bg-gradient-to-br from-blue-500 to-blue-600';
                else if (char >= 'K' && char <= 'O') color = 'bg-gradient-to-br from-emerald-500 to-teal-600';
                else if (char >= 'P' && char <= 'T') color = 'bg-gradient-to-br from-orange-500 to-amber-600';
                else if (char >= 'U' && char <= 'Z') color = 'bg-gradient-to-br from-pink-500 to-rose-600';

                return (
                    <div className={cn("w-full h-full flex items-center justify-center text-white font-black text-4xl shadow-inner transition-colors duration-500 rounded-inherit", color)}>
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
        const proxiedLogo = safeLogo && (safeLogo.includes('fbcdn.net') || safeLogo.includes('instagram.com'))
            ? `https://wsrv.nl/?url=${encodeURIComponent(safeLogo)}`
            : safeLogo;

        if (safeLogo) {
            const isSvg = /\.svg(\?|#|$)/i.test(safeLogo);
            return (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-inherit">
                    <img 
                        alt=""
                        src={proxiedLogo}
                        className="w-full h-full object-contain absolute inset-0 z-10 p-1.5 transition-opacity duration-300"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => { 
                            const target = e.currentTarget as HTMLElement;
                            target.style.opacity = '0';
                            // Wait a moment before completely hiding to avoid flicker
                            setTimeout(() => { target.style.display = 'none'; }, 100);
                        }}
                    />
                    <div className="absolute inset-0 z-0">
                        {fallback(category || '', name)}
                    </div>
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
        const PageHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
            <div className={cn("px-5 pt-5 pb-4 flex items-center gap-4 bg-transparent")}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveSettingsPage(null)}
                    className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all", isDark ? "bg-card border-white/5 text-foreground" : "bg-white border-slate-200 text-black shadow-sm")}
                >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                </motion.button>
                <div className="flex flex-col min-w-0">
                    <h1 className={cn("text-[20px] font-black tracking-tight truncate", textColor)}>{title}</h1>
                    {subtitle && <p className={cn("text-[10px] font-bold opacity-30 uppercase tracking-[0.15em] truncate mt-0.5", textColor)}>{subtitle}</p>}
                </div>
            </div>
        );

        switch (activeSettingsPage) {
            case 'personal':
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pb-36 touch-pan-y"
                    >
                        <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => { setActiveSettingsPage(null); setIsEditMode(false); }}
                                    className={cn("p-2 rounded-full transition-all", isDark ? "bg-slate-800" : "bg-white shadow-sm border border-slate-200")}
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </motion.button>
                                <div>
                                    <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-slate-100" : "text-slate-900")}>Profile</h1>
                                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Personal Info</p>
                                </div>
                            </div>
                            <button 
                                onClick={async () => {
                                    if (isEditMode) {
                                        await handleSaveProfile();
                                        setIsEditMode(false);
                                    } else {
                                        triggerHaptic();
                                        setIsEditMode(true);
                                    }
                                }}
                                disabled={isSavingProfile}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2",
                                    isEditMode 
                                        ? "bg-slate-900 text-white" 
                                        : "bg-blue-50 text-blue-600 border border-blue-100"
                                )}
                            >
                                {isSavingProfile ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isEditMode ? (
                                    <>Save Changes</>
                                ) : (
                                    <>Edit Profile</>
                                )}
                            </button>
                        </div>

                        <div className="px-5 space-y-7">
                        <div className="relative mb-8 pt-4">
                            <div className={cn(
                                "relative h-44 rounded-[3.5rem] overflow-hidden mb-[-60px] z-0 px-10 py-8 flex flex-col justify-end transition-all duration-700 group/banner",
                                isDark ? "bg-[#0b1324] border border-white/5" : "bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/40"
                            )}>
                                {/* Rich Mesh Gradient Background */}
                                <div className={cn(
                                    "absolute inset-0 opacity-40 transition-opacity duration-1000 group-hover/banner:opacity-60",
                                    isDark 
                                        ? "bg-[radial-gradient(at_0%_0%,rgba(16,185,129,0.3)_0,transparent_50%),radial-gradient(at_50%_0%,rgba(59,130,246,0.2)_0,transparent_50%),radial-gradient(at_100%_0%,rgba(139,92,246,0.3)_0,transparent_50%)]" 
                                        : "bg-[radial-gradient(at_0%_0%,rgba(16,185,129,0.15)_0,transparent_50%),radial-gradient(at_50%_0%,rgba(59,130,246,0.1)_0,transparent_50%),radial-gradient(at_100%_0%,rgba(139,92,246,0.15)_0,transparent_50%)]"
                                )} />
                                
                                {/* Animated Blobs */}
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 90, 0],
                                        x: [0, 50, 0],
                                        y: [0, -30, 0]
                                    }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] mix-blend-multiply pointer-events-none" 
                                />
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.3, 1],
                                        rotate: [0, -120, 0],
                                        x: [0, -40, 0],
                                        y: [0, 20, 0]
                                    }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                    className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] mix-blend-multiply pointer-events-none" 
                                />

                                <div className={cn(
                                    "absolute top-6 right-8 z-10 px-3 py-1.5 rounded-full backdrop-blur-md border",
                                    isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                                )}>
                                    <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] opacity-60", textColor)}>
                                        Profile Identity
                                    </p>
                                </div>
                            </div>

                            <div className="relative px-8 flex items-end gap-6 z-10">
                                <div className="relative group">
                                    <div className={cn(
                                        "w-28 h-28 rounded-[2.5rem] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-700",
                                        isDark ? "bg-[#061318] ring-4 ring-[#061318]" : "bg-white ring-4 ring-[#F9FAFB]"
                                    )}>
                                        <div className={cn(
                                            "w-full h-full rounded-[2.1rem] overflow-hidden border flex items-center justify-center relative",
                                            isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                                        )}>
                                            {profileFormData.instagram_profile_photo ? (
                                                <img 
                                                    src={profileFormData.instagram_profile_photo} 
                                                    alt="Profile" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className={cn("w-10 h-10", isDark ? "text-white/20" : "text-slate-300")} />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isEditMode && (
                                        <button 
                                            onClick={() => document.getElementById('avatar-input')?.click()}
                                            className={cn(
                                                "absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-90 z-20",
                                                isDark ? "bg-primary text-white hover:bg-primary/90" : "bg-primary text-white hover:bg-primary/90"
                                            )}
                                        >
                                            <Camera className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="pb-3 flex-1 min-w-0">
                                    <h2 className={cn("text-[24px] font-bold truncate tracking-tight mb-0.5", textColor)}>
                                        {profileFormData.full_name || 'Anonymous User'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full bg-primary")} />
                                        <p className={cn("text-[14px] font-bold opacity-40 uppercase tracking-widest", textColor)}>
                                            Verified Profile
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <input 
                                id="avatar-input"
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                        toast.loading('Uploading photo...');
                                        const { url } = await uploadFile(file, { 
                                            category: 'document', 
                                            userId, 
                                            folder: 'avatars' 
                                        });
                                        setProfileFormData((p: any) => ({ ...p, instagram_profile_photo: url, avatar_url: url }));
                                        toast.dismiss();
                                        toast.success('Photo uploaded!');
                                        triggerHaptic();
                                    } catch (err: any) {
                                        toast.dismiss();
                                        toast.error('Upload failed: ' + err.message);
                                    }
                                }}
                            />
                        </div>

                            {/* ── PROGRESS STATUS ── */}
                            <div className={cn(
                                "p-5 rounded-[2rem] border relative overflow-hidden transition-all duration-500",
                                isDark ? "bg-[#0B1324] border-white/5 shadow-2xl shadow-black/20" : "bg-white border-slate-200/60 shadow-xl shadow-slate-100/50"
                            )}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <p className={cn("text-[13px] font-black", textColor)}>Profile {profileCompleteness}% complete</p>
                                    </div>
                                    <p className={cn("text-[11px] font-black text-primary uppercase tracking-widest")}>+20% DEALS</p>
                                </div>
                                <div className={cn("h-3 rounded-full overflow-hidden p-0.5", isDark ? "bg-white/5" : "bg-slate-100")}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${profileCompleteness}%` }}
                                        className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                    />
                                </div>
                                
                                <Sparkles className="absolute -right-6 -bottom-6 w-24 h-24 text-primary/5 rotate-12" />
                            </div>

                            {/* ── BASIC INFO ── */}
                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-2 mb-4 opacity-40", textColor)}>1. Global Identity</p>
                                <div className={cn(
                                    "rounded-[2.25rem] border overflow-hidden p-2 space-y-1.5",
                                    isDark ? "bg-[#0B1324] border-white/5 shadow-2xl shadow-black/20" : "bg-white border-slate-200/60 shadow-xl shadow-slate-100/50"
                                )}>
                                    {/* Full Name */}
                                    <div className={cn("flex items-center gap-4 px-4 py-4 rounded-[1.75rem] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-violet-500/15" : "bg-violet-50")}>
                                            <User className="w-5 h-5 text-violet-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Full Name</p>
                                            {isEditMode ? (
                                                <input
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0", textColor)}
                                                    value={profileFormData.full_name || ''}
                                                    placeholder="Your full name"
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, full_name: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px] truncate", textColor)}>{profileFormData.full_name || <span className="opacity-20 font-bold italic">Not set</span>}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Email */}
                                    <div className={cn("flex items-center gap-4 px-4 py-4 rounded-[1.75rem] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-blue-500/15" : "bg-blue-50")}>
                                            <Mail className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Business Email</p>
                                            <p className={cn("font-black text-[15px] truncate opacity-50", textColor)}>{profileFormData.email || '—'}</p>
                                        </div>
                                        <div className={cn("px-3 py-1.5 rounded-xl border flex items-center gap-2", isDark ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200/50")}>
                                            <LockIcon className="w-3 h-3 opacity-40" />
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", textColor)}>Secure</span>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className={cn("flex items-center gap-4 px-4 py-4 rounded-[1.75rem] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-emerald-500/15" : "bg-emerald-50")}>
                                            <Phone className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Phone Number</p>
                                            {isEditMode ? (
                                                <input
                                                    inputMode="tel"
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0", textColor)}
                                                    value={profileFormData.phone || ''}
                                                    placeholder="+91 XXXXX XXXXX"
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, phone: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px]", textColor)}>{profileFormData.phone || <span className="opacity-20 font-bold italic">Not set</span>}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── LOCATION ── */}
                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-2 mb-4 opacity-40", textColor)}>2. Shipping & Base</p>
                                <div className={cn(
                                    "rounded-[2.25rem] border overflow-hidden p-2 space-y-1.5",
                                    isDark ? "bg-[#0B1324] border-white/5 shadow-2xl shadow-black/20" : "bg-white border-slate-200/60 shadow-xl shadow-slate-100/50"
                                )}>
                                    <div className={cn("flex items-center gap-4 px-4 py-4 rounded-[1.75rem] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-orange-500/15" : "bg-orange-50")}>
                                            <MapPin className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Full Address</p>
                                            {isEditMode ? (
                                                <input
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0", textColor)}
                                                    value={profileFormData.address || ''}
                                                    placeholder="123 Creator Lane, Studio B"
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, address: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px] truncate", textColor)}>{profileFormData.address || <span className="opacity-20 font-bold italic">Not set</span>}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className={cn("flex-1 px-4 py-4 rounded-[1.75rem] transition-colors animate-in slide-in-from-left-2 duration-300", isDark ? "bg-white/5" : "bg-slate-50")}>
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>City</p>
                                            {isEditMode ? (
                                                <input
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0", textColor)}
                                                    value={profileFormData.city || ''}
                                                    placeholder="Mumbai"
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, city: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px] truncate", textColor)}>{profileFormData.city || '—'}</p>
                                            )}
                                        </div>
                                        <div className={cn("flex-1 px-4 py-4 rounded-[1.75rem] transition-colors animate-in slide-in-from-right-2 duration-300", isDark ? "bg-white/5" : "bg-slate-50")}>
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Pincode</p>
                                            {isEditMode ? (
                                                <input
                                                    inputMode="numeric"
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0", textColor)}
                                                    value={profileFormData.pincode || ''}
                                                    placeholder="400001"
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, pincode: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px] truncate", textColor)}>{profileFormData.pincode || '—'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── CREATOR PROFILE ── */}
                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-2 mb-4 opacity-40", textColor)}>3. Public Display</p>
                                <div className={cn(
                                    "rounded-[2.25rem] border overflow-hidden p-2 space-y-1.5 transition-all duration-500",
                                    isDark ? "bg-[#0B1324] border-white/5 shadow-2xl shadow-black/20" : "bg-white border-slate-200/60 shadow-xl shadow-slate-100/50"
                                )}>
                                    {/* Bio */}
                                    <div className={cn("flex items-start gap-4 px-4 py-4 rounded-[1.75rem] transition-all", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5", isDark ? "bg-pink-500/15" : "bg-pink-50")}>
                                            <Edit3 className="w-5 h-5 text-pink-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", textColor)}>Bio / Headline</p>
                                                {isEditMode && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const bios = generateAIBios({
                                                                name: profileFormData.full_name || 'Creator',
                                                                niches: profileFormData.content_niches || [],
                                                                vibes: profileFormData.content_vibes || [],
                                                                city: profileFormData.city,
                                                                platform: profileFormData.primary_platform || 'Instagram'
                                                            });
                                                            // Cycle through bios
                                                            const currentIndex = bios.indexOf(profileFormData.bio || '');
                                                            const nextIndex = (currentIndex + 1) % bios.length;
                                                            setProfileFormData({ ...profileFormData, bio: bios[nextIndex] });
                                                            triggerHaptic(HapticPatterns.success);
                                                            toast.success('AI Bio Generated ✨');
                                                        }}
                                                        className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-[10px] font-black uppercase"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>AI Generate</span>
                                                    </button>
                                                )}
                                            </div>
                                            {isEditMode ? (
                                                <textarea
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0 resize-none leading-relaxed", textColor)}
                                                    rows={3}
                                                    value={profileFormData.bio || ''}
                                                    placeholder="Describe your content style..."
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, bio: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px] leading-relaxed", textColor)}>{profileFormData.bio || <span className="opacity-20 font-bold italic">Not set</span>}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Instagram */}
                                    <div className={cn("flex items-center gap-4 px-4 py-4 rounded-[1.75rem] transition-all", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-pink-500/15" : "bg-gradient-to-br from-pink-50 via-pink-100 to-orange-50")}>
                                            <Instagram className="w-5 h-5 text-pink-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Instagram Handle</p>
                                            {isEditMode ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-black text-[15px] opacity-20">@</span>
                                                    <input
                                                        className={cn("flex-1 bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0 text-pink-500", !isDark && "text-pink-600")}
                                                        value={profileFormData.instagram_handle?.replace('@', '') || ''}
                                                        placeholder="your.handle"
                                                        onChange={e => setProfileFormData((p: any) => ({ ...p, instagram_handle: e.target.value }))}
                                                    />
                                                </div>
                                            ) : (
                                                <p className={cn("font-black text-[15px] text-pink-500", !isDark && "text-pink-600")}>
                                                    {profileFormData.instagram_handle ? `@${profileFormData.instagram_handle.replace('@', '')}` : <span className="opacity-20 font-bold italic">Not linked</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Followers */}
                                    <div className={cn("flex flex-col gap-3 px-4 py-4 rounded-[1.75rem] transition-all", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-indigo-500/15" : "bg-indigo-50")}>
                                                <Users className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Follower Count</p>
                                                {!isEditMode && (
                                                    <p className={cn("font-black text-[15px]", textColor)}>
                                                        {profileFormData.instagram_followers ? (
                                                            Number(profileFormData.instagram_followers) < 1000 ? '<1k' :
                                                            Number(profileFormData.instagram_followers) <= 10000 ? '1k–10k' :
                                                            Number(profileFormData.instagram_followers) <= 50000 ? '10k–50k' : '50k+'
                                                        ) : <span className="opacity-20 font-bold italic">Not set</span>}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isEditMode && (
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                {[
                                                    { label: '<1k', value: 500 },
                                                    { label: '1k–10k', value: 5000 },
                                                    { label: '10k–50k', value: 25000 },
                                                    { label: '50k+', value: 75000 }
                                                ].map((range) => {
                                                    const isSelected = (
                                                        (range.value === 500 && Number(profileFormData.instagram_followers) < 1000) ||
                                                        (range.value === 5000 && Number(profileFormData.instagram_followers) >= 1000 && Number(profileFormData.instagram_followers) <= 10000) ||
                                                        (range.value === 25000 && Number(profileFormData.instagram_followers) > 10000 && Number(profileFormData.instagram_followers) <= 50000) ||
                                                        (range.value === 75000 && Number(profileFormData.instagram_followers) > 50000)
                                                    );
                                                    return (
                                                        <button
                                                            key={range.label}
                                                            type="button"
                                                            onClick={() => { triggerHaptic(); setProfileFormData({ ...profileFormData, instagram_followers: range.value }); }}
                                                            className={cn(
                                                                "py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95",
                                                                isSelected
                                                                    ? (isDark ? "bg-primary border-primary text-white" : "bg-emerald-500 border-emerald-500 text-white shadow-md")
                                                                    : (isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 border-slate-200 text-slate-400")
                                                            )}
                                                        >
                                                            {range.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Media Kit */}
                                    <div className={cn("flex items-center gap-4 px-4 py-4 rounded-[1.75rem] transition-all", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-blue-500/15" : "bg-blue-50")}>
                                            <Globe className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Media Kit / URL</p>
                                            {isEditMode ? (
                                                <input
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0 text-blue-500", !isDark && "text-blue-600")}
                                                    value={profileFormData.media_kit_url || ''}
                                                    placeholder="https://..."
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, media_kit_url: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px] truncate text-blue-500 underline underline-offset-4 decoration-current/30", !isDark && "text-blue-600")}>
                                                    {profileFormData.media_kit_url || <span className="opacity-20 font-bold italic">Not set</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── PAYOUT METHOD ── */}
                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-2 mb-4 opacity-40", textColor)}>4. Payout Method</p>
                                <div className={cn(
                                    "rounded-[2.25rem] border overflow-hidden p-2 space-y-1.5 transition-all duration-500",
                                    isDark ? "bg-[#0B1324] border-white/5 shadow-2xl shadow-black/20" : "bg-white border-slate-200/60 shadow-xl shadow-slate-100/50"
                                )}>
                                    <div className={cn("flex items-center gap-4 px-4 py-4 rounded-[1.75rem] transition-all", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-blue-500/15" : "bg-blue-50")}>
                                            <Landmark className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-50", textColor)}>Payout UPI ID</p>
                                            {isEditMode ? (
                                                <input
                                                    className={cn("w-full bg-transparent outline-none font-black text-[15px] p-0 border-none focus:ring-0 text-blue-500", !isDark && "text-blue-600")}
                                                    value={profileFormData.payout_upi || ''}
                                                    placeholder="yourname@upi"
                                                    onChange={e => setProfileFormData((p: any) => ({ ...p, payout_upi: e.target.value }))}
                                                />
                                            ) : (
                                                <p className={cn("font-black text-[15px] truncate text-blue-500", !isDark && "text-blue-600")}>
                                                    {profileFormData.payout_upi || <span className="opacity-20 font-bold italic">Not set</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── ACTION BUTTON ── */}
                            {isEditMode && (
                                <div className="pt-4 pb-12">
                                    <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        type="button"
                                        onClick={async () => { await handleSaveProfile(); setIsEditMode(false); }}
                                        disabled={isSavingProfile}
                                        className={cn(
                                            "w-full py-5 rounded-[22px] font-black text-[12px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl group relative overflow-hidden",
                                            isDark ? "bg-primary text-white shadow-primary/20" : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {isSavingProfile ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                <span>Finalizing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-5 h-5 text-white" />
                                                <span>Save All Changes</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            case 'portfolio':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Your Public Profile" />
                        <div className="px-4 space-y-6">
                            <div ref={pricingSectionRef}>
                                <SectionHeader title="Pricing" isDark={isDark} />
                                <SettingsGroup isDark={isDark}>
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-1.5">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Reel Rate</p>
                                            <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                                <span className="text-info font-black">₹</span>
                                                <input
                                                    className="bg-transparent outline-none font-medium text-[16px] flex-1"
                                                    inputMode="numeric"
                                                    placeholder="5000"
                                                    value={profileFormData.avg_rate_reel || ''}
                                                    onChange={(e) => setProfileFormData((p: any) => ({ ...p, avg_rate_reel: e.target.value, suggested_reel_rate: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Story Rate</p>
                                            <div className="flex items-center gap-2 border-b py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                                <span className="text-info font-black">₹</span>
                                                <input
                                                    className="bg-transparent outline-none font-medium text-[16px] flex-1"
                                                    inputMode="numeric"
                                                    placeholder="2000"
                                                    value={profileFormData.story_price || ''}
                                                    onChange={(e) => setProfileFormData((p: any) => ({ ...p, story_price: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Package Summary</p>
                                            <div className={cn("rounded-2xl px-4 py-3 text-[13px] font-medium", isDark ? "bg-card text-foreground/80" : "bg-secondary/30 text-black/70")}>
                                                Create or update packages in your public profile to show brands your rates in a cleaner format.
                                            </div>
                                        </div>
                                    </div>
                                </SettingsGroup>
                            </div>
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
                            <div className="px-4 pt-4">
                                <button type="button" onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-info text-foreground font-bold py-3 rounded-xl active:scale-95 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Save Public Profile'}
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
            case 'collab-link':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20 touch-pan-y">
                        <PageHeader 
                            title="Money Generator Setup" 
                            subtitle="Optimize your profile to start getting paid" 
                        />
                        
                        <div className="px-4 space-y-7">
                            {/* ── 0. PREVIEW & STATUS ── */}
                            <div className="space-y-3">
                                <div className={cn("p-4 rounded-[28px] border flex items-center justify-between", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", profileFormData.open_to_collabs ? (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600 shadow-sm") : "bg-slate-500/10 text-slate-400")}>
                                            <Zap className={cn("w-6 h-6", profileFormData.open_to_collabs && "animate-pulse")} />
                                        </div>
                                        <div>
                                            <p className={cn("text-[14px] font-black uppercase tracking-tight", textColor)}>🟢 Profile is LIVE</p>
                                            <p className={cn("text-[11px] opacity-60 font-bold", textColor)}>{profileFormData.open_to_collabs ? "Brands can discover and pay you now" : "Profile hidden from brands"}</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        active={profileFormData.open_to_collabs}
                                        onToggle={(val) => { triggerHaptic(); setProfileFormData((p: any) => ({ ...p, open_to_collabs: val })); if (val) toast.success("You're now LIVE to brands!"); }}
                                        isDark={isDark}
                                    />
                                </div>

                                <div className={cn("p-4 rounded-[28px] border flex items-center gap-4", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-primary/20" : "bg-emerald-50")}>
                                        <Globe className={cn("w-6 h-6", isDark ? "text-primary" : "text-emerald-600")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[13px] font-black truncate opacity-50 uppercase tracking-widest", textColor)}>Public Link</p>
                                        <p className={cn("text-[14px] font-black truncate", textColor)}>creatorarmour.com/{username}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button"
                                            onClick={() => { triggerHaptic(); window.open(`https://creatorarmour.com/${username}`, '_blank'); }}
                                            className={cn("p-2.5 rounded-xl border transition-all active:scale-95", isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-700 shadow-sm")}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                        <button type="button"
                                            onClick={() => { navigator.clipboard.writeText(`creatorarmour.com/${username}`); toast.success('Link copied!'); triggerHaptic(); }}
                                            className={cn("px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all active:scale-95 shadow-lg", isDark ? "bg-primary text-white shadow-primary/20" : "bg-emerald-600 text-white shadow-emerald-500/30")}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-60 mb-3 px-1", textColor)}>1. Identity</p>
                                <div className={cn("rounded-[28px] border p-5 space-y-6", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5 px-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Instagram Handle</p>
                                                <Instagram className="w-3.5 h-3.5 text-pink-500 opacity-60" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-[13px]">@</span>
                                                <input
                                                    type="text"
                                                    value={profileFormData.instagram_handle || ''}
                                                    onChange={(e) => setProfileFormData({ ...profileFormData, instagram_handle: e.target.value.replace('@', '') })}
                                                    placeholder="your.handle"
                                                    className={cn("w-full pl-8 pr-4 py-3.5 rounded-2xl border text-[13px] font-semibold outline-none transition-all", isDark ? "bg-[#0B0F14] border-border text-foreground focus:border-primary/50" : "bg-[#F9FAFB] border-[#E5E7EB] text-black focus:border-emerald-400 focus:bg-white")}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 px-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Bio / Pitch Title</p>
                                                <Edit3 className="w-3.5 h-3.5 text-primary opacity-60" />
                                            </div>
                                            <input
                                                type="text"
                                                value={profileFormData.bio || ''}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                                                placeholder="e.g. Minimalist Tech & Lifestyle Content"
                                                className={cn("w-full px-4 py-3.5 rounded-2xl border text-[13px] font-semibold outline-none transition-all", isDark ? "bg-[#0B0F14] border-border text-foreground focus:border-primary/50" : "bg-[#F9FAFB] border-[#E5E7EB] text-black focus:border-emerald-400 focus:bg-white")}
                                            />
                                        </div>

                                        <div className="space-y-1.5 px-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Base City / Location</p>
                                                <MapPin className="w-3.5 h-3.5 text-primary opacity-60" />
                                            </div>
                                            <input
                                                type="text"
                                                value={profileFormData.collab_region_label || ''}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, collab_region_label: e.target.value })}
                                                placeholder="e.g. Mumbai, India"
                                                className={cn("w-full px-4 py-3.5 rounded-2xl border text-[13px] font-semibold outline-none transition-all", isDark ? "bg-[#0B0F14] border-border text-foreground focus:border-primary/50" : "bg-[#F9FAFB] border-[#E5E7EB] text-black focus:border-emerald-400 focus:bg-white")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-60 mb-3 px-1", textColor)}>2. 👥 Who follows you?</p>
                                <p className={cn("text-[9px] font-bold opacity-40 px-1 mb-3 -mt-2", textColor)}>(This helps brands match you with better deals)</p>
                                <div className={cn("rounded-[28px] border p-5 space-y-6", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-3 px-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Gender Split</p>
                                                <Users className="w-3.5 h-3.5 opacity-20" />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'women', label: 'Mostly Women', value: 'Women 70%+', color: 'text-pink-500', icon: 'User' },
                                                    { id: 'balanced', label: 'Balanced', value: 'Balanced Mix', color: 'text-violet-500', icon: 'Users' },
                                                    { id: 'men', label: 'Mostly Men', value: 'Men 70%+', color: 'text-sky-500', icon: 'User' }
                                                ].map((split) => {
                                                    const isSelected = profileFormData.audience_gender_split === split.value;
                                                    return (
                                                        <button 
                                                            key={split.id}
                                                            type="button"
                                                            onClick={() => { triggerHaptic(); setProfileFormData({ ...profileFormData, audience_gender_split: isSelected ? '' : split.value }); }}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 gap-2",
                                                                isSelected 
                                                                    ? (isDark ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" : "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/10")
                                                                    : (isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center mb-0.5",
                                                                isSelected ? "bg-white/20 text-white" : (isDark ? "bg-white/5 " + split.color : "bg-white " + split.color)
                                                            )}>
                                                                {split.icon === 'Users' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px] font-black tracking-tight text-center leading-tight",
                                                                isSelected ? "text-white" : (isDark ? "text-white/60" : "text-slate-600")
                                                            )}>
                                                                {split.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 px-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Primary Age Range</p>
                                                <Calendar className="w-3.5 h-3.5 opacity-20" />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {['13–17', '18–24', '25–34', '35–44', '45+'].map((age) => {
                                                    const isSelected = profileFormData.audience_age_range === age;
                                                    return (
                                                        <button 
                                                            key={age}
                                                            type="button"
                                                            onClick={() => { triggerHaptic(); setProfileFormData({ ...profileFormData, audience_age_range: isSelected ? '' : age }); }}
                                                            className={cn(
                                                                "px-3 py-2 rounded-xl text-[11px] font-black border transition-all active:scale-95",
                                                                isSelected 
                                                                    ? (isDark ? "bg-primary/20 border-primary/40 text-primary" : "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10")
                                                                    : (isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-[#F3F4F6] border-[#E5E7EB] text-[#374151]")
                                                            )}
                                                        >
                                                            {age}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-3 px-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Audience Top 3 Cities</p>
                                                <MapPin className="w-3.5 h-3.5 opacity-20" />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 relative">
                                                {[0, 1, 2].map((idx) => (
                                                    <div key={idx} className="relative">
                                                        <input 
                                                            className={cn(
                                                                "h-12 w-full px-3 rounded-2xl border font-black text-[11px] outline-none transition-all focus:ring-2 focus:ring-primary/20",
                                                                isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                                            )}
                                                            placeholder={`City ${idx + 1}`}
                                                            value={profileFormData.top_cities?.[idx] || ''}
                                                            onFocus={() => setActiveCitySuggestionField(idx)}
                                                            onBlur={() => setTimeout(() => setActiveCitySuggestionField(null), 200)}
                                                            onChange={(e) => {
                                                                const newCities = [...(profileFormData.top_cities || ['', '', ''])];
                                                                newCities[idx] = e.target.value;
                                                                setProfileFormData({ ...profileFormData, top_cities: newCities });
                                                            }}
                                                        />
                                                        {activeCitySuggestionField === idx && profileFormData.top_cities?.[idx]?.length > 1 && (
                                                            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover p-1 shadow-xl max-h-32 overflow-y-auto">
                                                                {CITY_OPTIONS.filter(c => c.toLowerCase().includes(profileFormData.top_cities[idx].toLowerCase())).slice(0, 5).map(city => (
                                                                    <button
                                                                        key={city}
                                                                        type="button"
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            const newCities = [...(profileFormData.top_cities || ['', '', ''])];
                                                                            newCities[idx] = city;
                                                                            setProfileFormData({ ...profileFormData, top_cities: newCities });
                                                                            setActiveCitySuggestionField(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-accent rounded-lg transition-colors"
                                                                    >
                                                                        {city}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="px-1 text-[9px] font-medium leading-relaxed opacity-40 italic">
                                                Tip: Use specific city names to help brands find you in local searches.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-1.5 mt-2 pt-4 border-t border-slate-100/10">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        <p className={cn("text-[11px] font-bold text-center", textColor)}>
                                            Add audience data <span className={isDark ? "text-primary/80" : "text-emerald-600"}> (+20% deals)</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-60 mb-1 px-1", textColor)}>3. 🎥 Show Brands Your Style</p>
                                <p className={cn("text-[9px] font-black text-primary uppercase tracking-wider px-1 mb-3")}>Your First Impression (MOST IMPORTANT)</p>
                                <div className={cn("rounded-[28px] border p-5", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                    <DiscoveryVideoUpload 
                                        userId={userId}
                                        isDark={isDark}
                                        discoveryVideoUrl={profileFormData.discovery_video_url}
                                        portfolioVideos={profileFormData.portfolio_videos}
                                        onUpdate={(data) => setProfileFormData({ ...profileFormData, ...data })}
                                    />
                                </div>
                            </div>

                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-60 mb-3 px-1", textColor)}>4. Vibe & Niche</p>
                                <div className={cn("rounded-[28px] border p-5 space-y-7", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                        <div className="space-y-3 px-1">
                                            <div className="flex items-end justify-between gap-3">
                                                <div className="flex flex-col">
                                                    <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Select Your Vibe</p>
                                                    <p className="text-[9px] text-primary/60 font-black uppercase tracking-tighter">Choose max 3</p>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
                                                    {(profileFormData.content_vibes || []).length}/3
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: 'Aesthetic', icon: <Sparkles className="w-3.5 h-3.5" /> },
                                                { label: 'Relatable', icon: <Handshake className="w-3.5 h-3.5" /> },
                                                { label: 'Informative', icon: <Info className="w-3.5 h-3.5" /> },
                                                { label: 'High Energy', icon: <Zap className="w-3.5 h-3.5" /> },
                                                { label: 'Minimalist', icon: <Layers className="w-3.5 h-3.5" /> },
                                                { label: 'Luxury', icon: <Star className="w-3.5 h-3.5" /> },
                                                { label: 'Bold', icon: <Flame className="w-3.5 h-3.5" /> },
                                                { label: 'Fun', icon: <Laugh className="w-3.5 h-3.5" /> },
                                                { label: 'Professional', icon: <Briefcase className="w-3.5 h-3.5" /> },
                                                { label: 'Authentic', icon: <User className="w-3.5 h-3.5" /> },
                                                { label: 'Cinematic', icon: <Film className="w-3.5 h-3.5" /> },
                                                { label: 'Experimental', icon: <Video className="w-3.5 h-3.5" /> }
                                            ].map((vibe) => {
                                                const isSelected = (profileFormData.content_vibes || []).includes(vibe.label);
                                                return (
                                                    <button type="button" key={vibe.label}
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            const current = profileFormData.content_vibes || [];
                                                            if (isSelected) setProfileFormData((p: any) => ({ ...p, content_vibes: current.filter((v: string) => v !== vibe.label) }));
                                                            else {
                                                                if (current.length >= 3) { toast.error('Choose max 3 vibes'); return; }
                                                                setProfileFormData((p: any) => ({ ...p, content_vibes: [...current, vibe.label] }));
                                                            }
                                                        }}
                                                        className={cn(
                                                            "px-3.5 py-2.5 rounded-2xl text-[11px] font-black tracking-tight border flex flex-col items-center gap-1.5 transition-all active:scale-95 relative overflow-hidden min-w-[102px]",
                                                            isSelected 
                                                                ? (isDark ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10")
                                                                : (isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 border-slate-200 text-slate-500")
                                                        )}
                                                    >
                                                        {vibe.recommended && !isSelected && (
                                                            <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-primary/20 text-primary text-[6px] font-black uppercase tracking-tighter rounded-bl-lg">
                                                                Popular
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            {vibe.icon}
                                                            {vibe.label}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-3 px-1">
                                        <div className="flex items-end justify-between gap-3">
                                            <div className="flex flex-col">
                                                <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Your Main Niches</p>
                                                <p className="text-[9px] text-primary/60 font-black uppercase tracking-tighter">Choose your content topics</p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
                                                {(profileFormData.content_niches || []).length} selected
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                'Beauty', 'Fashion', 'Lifestyle', 'Tech & Gadgets', 'Fitness',
                                                'Food', 'Travel', 'Gaming', 'Education', 'Parenting',
                                                'Pets', 'Finance', 'Art', 'Entertainment', 'Sports',
                                                'Business', 'Wellness', 'Automotive', 'Spirituality'
                                            ].map((niche) => {
                                                const isSelected = (profileFormData.content_niches || []).includes(niche);
                                                return (
                                                    <button type="button" key={niche}
                                                        onClick={() => {
                                                            triggerHaptic();
                                                            const current = profileFormData.content_niches || [];
                                                            if (isSelected) setProfileFormData((p: any) => ({ ...p, content_niches: current.filter((v: string) => v !== niche) }));
                                                            else setProfileFormData((p: any) => ({ ...p, content_niches: [...current, niche] }));
                                                        }}
                                                        className={cn(
                                                            "px-3 py-2 rounded-xl text-[10px] font-black tracking-tight border transition-all active:scale-95",
                                                            isSelected 
                                                                ? (isDark ? "bg-primary/20 text-primary border-primary/40 shadow-lg shadow-primary/10" : "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10")
                                                                : (isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 border-slate-200 text-slate-500")
                                                        )}
                                                    >
                                                        {niche}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-3 px-1">
                                        <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Main Platform</p>
                                        <div className="flex gap-2">
                                            {[
                                                { label: 'Instagram', icon: <Instagram className="w-3.5 h-3.5" /> },
                                                { label: 'YouTube', icon: <Youtube className="w-3.5 h-3.5" /> },
                                                { label: 'Twitter/X', icon: <Twitter className="w-3.5 h-3.5" /> }
                                            ].map((plat) => (
                                                <button type="button" key={plat.label}
                                                    onClick={() => { triggerHaptic(); setProfileFormData((p: any) => ({ ...p, primary_platform: plat.label })); }}
                                                    className={cn(
                                                        "flex-1 py-3.5 rounded-2xl border flex items-center justify-center gap-2 text-[11px] font-black transition-all",
                                                        (profileFormData.primary_platform || 'Instagram') === plat.label
                                                            ? (isDark ? "bg-primary/20 border-primary/40 text-primary" : "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm")
                                                            : (isDark ? "bg-transparent border-white/10 text-white/30" : "bg-white border-[#E5E7EB] text-[#6B7280]")
                                                    )}
                                                >
                                                    {plat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-60 mb-1 px-1", textColor)}>5. Earnings & Packages</p>
                                <div className={cn("mb-3 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2")}>
                                    <Sparkles className="w-3 h-3 text-emerald-500" />
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">💡 Tip: Creators with pricing get 2x more deals</p>
                                </div>
                                <div className="space-y-8">
                                    <div className={cn("rounded-[28px] border", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                        <div className="p-5 bg-primary/5">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", textColor)}>Baseline Reel Rate</p>
                                                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-black text-primary">₹</span>
                                                <input
                                                    type="number"
                                                    value={profileFormData.avg_rate_reel || ''}
                                                    onChange={(e) => setProfileFormData({ ...profileFormData, avg_rate_reel: e.target.value })}
                                                    placeholder="5000"
                                                    className={cn("w-full bg-transparent border-none text-[28px] font-black outline-none placeholder:opacity-20", textColor)}
                                                />
                                            </div>
                                            <p className="mt-2 text-[10px] font-bold opacity-60 leading-tight">
                                                This sets your starting price for custom collab offers.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className={cn("rounded-[28px] border", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                        <div className="p-0">
                                            <FiverrPackageEditor
                                                templates={profileFormData.deal_templates || []}
                                                avg_rate_reel={Number(profileFormData.avg_rate_reel)}
                                                isDark={isDark}
                                                onChange={(pkgs) => setProfileFormData(p => ({ ...p, deal_templates: pkgs }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── 5. PAST WORK ── */}
                            <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-60 mb-3 px-1", textColor)}>6. Past Partnerships</p>
                                <div className={cn("rounded-[28px] border p-5 space-y-7", isDark ? "bg-card border-border shadow-2xl shadow-black/20" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                    {/* Media Kit (Option 3) */}
                                    <div className="space-y-3 px-1">
                                        <div className="flex items-center justify-between">
                                            <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-50", textColor)}>Detailed Media Kit (PDF/Drive)</p>
                                            <BadgeCheck className="w-3.5 h-3.5 text-primary opacity-60" />
                                        </div>
                                        <input
                                            type="url"
                                            value={profileFormData.media_kit_url || ''}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, media_kit_url: e.target.value })}
                                            placeholder="Canva or Google Drive link..."
                                            className={cn("w-full px-4 py-3.5 rounded-2xl border text-[13px] font-semibold outline-none transition-all", isDark ? "bg-[#0B0F14] border-border text-foreground focus:border-primary/50" : "bg-[#F9FAFB] border-[#E5E7EB] text-black focus:border-emerald-400 focus:bg-white")}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── SAVE ACTION ── */}
                            <div className="pt-8 pb-10">
                                <motion.button 
                                    whileTap={{ scale: 0.97 }}
                                    type="button" 
                                    onClick={handleSaveProfile} 
                                    disabled={isSavingProfile}
                                    className={cn(
                                        "w-full py-5 rounded-[22px] font-black uppercase tracking-[0.1em] text-[12px] flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl relative overflow-hidden group",
                                        isDark 
                                            ? "bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white shadow-primary/20" 
                                            : "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-emerald-500/30"
                                    )}
                                >
                                    {/* Glass Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    {isSavingProfile ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Syncing Profile...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                <Zap className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="drop-shadow-sm">🚀 Go Live & Start Getting Deals</span>
                                        </>
                                    )}
                                </motion.button>
                                
                                <div className="mt-6 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-1.5 opacity-30">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        <p className={cn("text-center text-[10px] font-black uppercase tracking-widest", textColor)}>
                                            Changes are instant
                                        </p>
                                    </div>
                                    <p className={cn("text-center text-[11px] font-bold opacity-30 px-10 leading-tight uppercase tracking-tighter", textColor)}>
                                        View your public landing page to see updates
                                    </p>
                                </div>
                            </div>
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

                        {/* STICKY BOTTOM CTA */}
                        <div className={cn(
                            "fixed bottom-0 left-0 right-0 p-4 z-50 flex items-center gap-3",
                            isDark ? "bg-[#0B1324]/95 border-t border-white/10" : "bg-white/95 border-t border-slate-200 shadow-lg"
                        )} style={{ backdropFilter: 'blur(20px)' }}>
                            <button 
                                onClick={async () => {
                                    triggerHaptic();
                                    if (isEditMode) {
                                        await handleSaveProfile();
                                        setIsEditMode(false);
                                    } else {
                                        setIsEditMode(true);
                                    }
                                }}
                                disabled={isSavingProfile}
                                className={cn(
                                    "flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]",
                                    isEditMode 
                                        ? (isDark ? "bg-primary text-white" : "bg-primary text-white")
                                        : (isDark ? "bg-white/10 text-white border border-white/20" : "bg-slate-100 text-slate-900 border border-slate-200")
                                )}
                            >
                                {isSavingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                onClick={() => {
                                    triggerHaptic();
                                    window.open(`/${profileFormData.instagram_handle || username}`, '_blank');
                                }}
                                className={cn(
                                    "py-3.5 px-5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]",
                                    isDark ? "bg-white/10 text-white border border-white/20" : "bg-slate-100 text-slate-900 border border-slate-200"
                                )}
                            >
                                Preview
                            </button>
                        </div>
                    </motion.div>
                );
            case 'delete':
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                        <div className={cn("w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative", isDark ? "bg-[#0F172A] border border-white/5" : "bg-white")}>
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
                            
                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h2 className={cn("text-2xl font-black mb-3", textColor)}>Delete Account?</h2>
                                <p className={cn("text-sm opacity-50 leading-relaxed mb-8", textColor)}>
                                    This will permanently remove your profile, deals, and earnings history. This action cannot be undone.
                                </p>
                                
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={async () => {
                                            triggerHaptic();
                                            setActiveSettingsPage(null);
                                            navigate('/delete-account');
                                        }}
                                        className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20"
                                    >
                                        Yes, Delete Everything
                                    </button>
                                    <button 
                                        onClick={() => { triggerHaptic(); setActiveSettingsPage(null); }}
                                        className={cn("w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all", isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500")}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'consumer-complaints':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="pb-20 touch-pan-y">
                        <PageHeader 
                            title="Consumer Complaints" 
                            subtitle={
                                complaintStep === 'initial' ? "File a legal notice for your consumer issues" :
                                complaintStep === 'category' ? "Select issue category" :
                                complaintStep === 'company' ? "Select the company" :
                                complaintStep === 'details' ? "Describe your issue" :
                                "Filing your complaint..."
                            }
                            onBack={complaintStep !== 'initial' ? () => {
                                triggerHaptic();
                                if (complaintStep === 'category') setComplaintStep('initial');
                                else if (complaintStep === 'company') setComplaintStep('category');
                                else if (complaintStep === 'details') setComplaintStep('company');
                            } : undefined}
                        />

                        <div className="px-4">
                            <AnimatePresence mode="wait">
                                {complaintStep === 'initial' && (
                                    <motion.div key="initial" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                                        <div className={cn("p-8 rounded-[2.5rem] relative overflow-hidden", isDark ? "bg-card border border-[#2C2C2E]" : "bg-card border-[#E5E5EA] shadow-sm")}>
                                            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
                                                <Shield className="w-9 h-9 text-primary" />
                                            </div>
                                            <h3 className={cn("text-2xl font-black tracking-tight mb-2", textColor)}>File New Complaint</h3>
                                            <p className={cn("text-sm opacity-50 leading-relaxed mb-6", textColor)}>Got cheated by a brand or service? File a professional legal notice in minutes.</p>
                                            <button 
                                                onClick={() => { triggerHaptic(); setComplaintStep('category'); }}
                                                className="w-full bg-primary text-white font-black py-4 rounded-2xl text-[13px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/25 mb-3"
                                            >
                                                Start New Filing
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    triggerHaptic();
                                                    window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20a%20consumer%20complaint`, '_blank');
                                                }}
                                                className={cn("w-full py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all border flex items-center justify-center gap-2", isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}
                                            >
                                                <MessageSquare className="w-4 h-4 text-emerald-500" />
                                                Contact Lawyer
                                            </button>
                                        </div>

                                        <div className="px-1">
                                            <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-30 mb-4", textColor)}>Why Lifestyle Shield?</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { label: 'Legal Power', desc: 'Verified notices', icon: <Scale className="w-4 h-4" /> },
                                                    { label: 'High Success', desc: '92% resolution', icon: <TrendingUp className="w-4 h-4" /> }
                                                ].map((feat, i) => (
                                                    <div key={i} className={cn("p-4 rounded-2xl border", isDark ? "bg-card border-border" : "bg-white border-slate-100")}>
                                                        <div className="text-primary mb-2">{feat.icon}</div>
                                                        <p className={cn("text-[12px] font-black", textColor)}>{feat.label}</p>
                                                        <p className={cn("text-[10px] font-bold opacity-40", textColor)}>{feat.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {complaintStep === 'category' && (
                                    <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-2 gap-4">
                                        {COMPLAINT_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    triggerHaptic();
                                                    console.log('[LifestyleShield] Selected Category:', cat.id);
                                                    setSelectedComplaintCategory(cat.id);
                                                    setComplaintStep('company');
                                                }}
                                                className={cn(
                                                    "p-5 rounded-[2rem] border transition-all text-left group active:scale-95 relative z-20",
                                                    isDark ? "bg-card border-border hover:border-primary/50" : "bg-white border-slate-100 hover:border-primary/50 shadow-sm"
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform pointer-events-none">
                                                    {cat.id === 'food' && <Utensils className="w-5 h-5" />}
                                                    {cat.id === 'ecommerce' && <ShoppingBag className="w-5 h-5" />}
                                                    {cat.id === 'quick-commerce' && <Zap className="w-5 h-5" />}
                                                    {cat.id === 'travel' && <Plane className="w-5 h-5" />}
                                                    {cat.id === 'banking' && <CreditCard className="w-5 h-5" />}
                                                    {cat.id === 'other' && <MoreHorizontal className="w-5 h-5" />}
                                                </div>
                                                <p className={cn("font-black text-sm pointer-events-none", textColor)}>{cat.label}</p>
                                                <p className={cn("text-[10px] font-bold opacity-30 mt-1 pointer-events-none", textColor)}>{cat.examples}</p>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {complaintStep === 'company' && selectedComplaintCategory && (
                                    <motion.div key="company" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                        <div className="px-1 mb-2">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-30", textColor)}>Popular Companies</p>
                                        </div>
                                        {(POPULAR_COMPANIES[selectedComplaintCategory] || []).map((company) => (
                                            <button
                                                key={company}
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setSelectedComplaintCompany(company);
                                                    setComplaintStep('details');
                                                }}
                                                className={cn(
                                                    "w-full p-5 rounded-2xl border flex items-center justify-between group active:scale-[0.98] transition-all",
                                                    isDark ? "bg-card border-border hover:bg-white/5" : "bg-white border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-500/5 flex items-center justify-center border border-slate-500/10">
                                                        <Building2 className="w-5 h-5 opacity-40" />
                                                    </div>
                                                    <span className={cn("font-black text-[15px]", textColor)}>{company}</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {complaintStep === 'details' && (
                                    <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                        <div className="space-y-2 group">
                                            <label className={cn("text-[11px] font-black uppercase tracking-widest ml-1 opacity-40 transition-colors group-focus-within:opacity-100 group-focus-within:text-primary", textColor)}>What went wrong?</label>
                                            <textarea 
                                                value={complaintDescription}
                                                onChange={(e) => setComplaintDescription(e.target.value)}
                                                placeholder={`Tell us what happened with ${selectedComplaintCompany}...`}
                                                className={cn(
                                                    "w-full min-h-[200px] p-5 rounded-3xl border-2 text-[15px] font-medium transition-all outline-none resize-none",
                                                    isDark ? "bg-white/5 border-white/5 focus:border-primary/50 text-white" : "bg-slate-50 border-slate-100 focus:border-primary/50 text-slate-900"
                                                )}
                                            />
                                        </div>

                                        <button 
                                            disabled={complaintDescription.length < 10}
                                            onClick={() => {
                                                triggerHaptic();
                                                setComplaintStep('submitting');
                                                setTimeout(() => {
                                                    const newComplaint = {
                                                        id: `NB-${Math.floor(1000 + Math.random() * 9000)}`,
                                                        company: selectedComplaintCompany,
                                                        category: COMPLAINT_CATEGORIES.find(c => c.id === selectedComplaintCategory)?.label,
                                                        description: complaintDescription,
                                                        status: 'Under Review',
                                                        filedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    };
                                                    setFiledComplaints(prev => [newComplaint, ...prev]);
                                                    setHasFiledComplaint(true);
                                                    toast.success("Complaint Filed!", {
                                                        description: "Our legal team will review your case and prepare the notice.",
                                                        duration: 5000,
                                                    });
                                                    resetComplaintForm();
                                                    setActiveSettingsPage('my-complaints');
                                                }, 2000);
                                            }}
                                            className={cn(
                                                "w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all active:scale-95 shadow-xl",
                                                complaintDescription.length >= 10 ? "bg-primary text-white shadow-primary/25" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                            )}
                                        >
                                            Submit Complaint
                                        </button>
                                    </motion.div>
                                )}

                                {complaintStep === 'submitting' && (
                                    <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-pulse" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h4 className={cn("text-xl font-black mb-2", textColor)}>Securely Filing...</h4>
                                            <p className={cn("text-sm opacity-50", textColor)}>We are sending your case to our legal team.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            case 'my-complaints':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="pb-20 touch-pan-y">
                        <PageHeader 
                            title="My Complaints" 
                            subtitle="Track your active legal cases" 
                        />
                        <div className="px-4 space-y-4">
                            {filedComplaints.length > 0 ? (
                                filedComplaints.map((complaint) => (
                                    <div key={complaint.id} className={cn("p-6 rounded-[2rem] relative overflow-hidden", isDark ? "bg-[#1C1C1E] border border-white/5" : "bg-white border border-slate-100 shadow-sm")}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                                    <Scale className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className={cn("font-black text-sm", textColor)}>{complaint.id}</h4>
                                                    <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">{complaint.company}</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                                {complaint.status}
                                            </div>
                                        </div>
                                        <div className="space-y-3 pt-3 border-t border-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] opacity-40">Category</span>
                                                <span className={cn("text-[11px] font-bold", textColor)}>{complaint.category}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] opacity-40">Filed Date</span>
                                                <span className={cn("text-[11px] font-bold", textColor)}>{complaint.filedDate}</span>
                                            </div>
                                        </div>
                                        <button className={cn("w-full mt-5 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all active:scale-95", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                            View Case Details
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className={cn("flex flex-col items-center justify-center min-h-[40vh] p-8 rounded-[2.5rem] border border-dashed", isDark ? "border-white/10" : "border-slate-200")}>
                                    <FileText className="w-12 h-12 opacity-20 mb-4" />
                                    <p className={cn("font-bold opacity-40", textColor)}>No active complaints found</p>
                                    <p className={cn("text-[11px] opacity-30 mt-1", textColor)}>All your legal notices will appear here.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            case 'logout':
                triggerHaptic();
                if (signOutMutation.mutate) {
                    signOutMutation.mutate();
                } else {
                    // Fallback: clear auth state directly using sync Supabase import
                    try {
                        const { supabase } = require('@/integrations/supabase/client');
                        supabase.auth.signOut({ scope: 'global' });
                    } catch (_) { /* ignore */ }
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/login';
                }
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
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/20 via-sky-400/15 to-transparent" />
                    <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-emerald-500/25 rounded-full blur-[120px]" />
                    <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-sky-500/20 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-emerald-500/15 rounded-full blur-[150px]" />
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
                    onNavigate={(path) => { 
                        if (path === '/lifestyle/consumer-complaints') {
                            setActiveTab('profile');
                            setActiveSettingsPage('consumer-complaints');
                        } else if (path === '/dashboard/consumer-complaints') {
                            setActiveTab('profile');
                            setActiveSettingsPage('my-complaints');
                        } else if (!path.startsWith('http')) navigate(path); 
                        setShowMenu(false); 
                    }}
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

                    {/* PWA Install Banner (Android only) - Now Common */}
                    {canInstall && (
                        <div className="mx-5 mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-primary/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-info flex items-center justify-center">
                                    <Download className="w-4 h-4 text-foreground" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-foreground">Add to home screen</p>
                                    <p className="text-[11px] text-muted-foreground">Add to home screen for faster access</p>
                                </div>
                            </div>
                            <button onClick={promptInstall} className="text-[11px] font-bold px-4 py-2 rounded-full bg-info text-foreground active:scale-95">Install</button>
                        </div>
                    )}

                    {/* Command Header - Now Sticky and Common across all tabs */}
                    <div 
                        className={cn(
                            "sticky top-0 z-50 px-5 pb-2 transition-all duration-300 mb-0 border-b",
                            isDark ? "bg-[#03110C]/90 backdrop-blur-xl border-white/5" : "bg-white/90 backdrop-blur-xl border-slate-200"
                        )}
                        style={{ 
                            paddingTop: 'max(env(safe-area-inset-top), 8px)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-1">
                            {/* Left: Sidebar Menu */}
                            <button type="button" onClick={() => handleAction('menu')} aria-label="Open menu" className={cn("w-10 h-10 -ml-1 rounded-xl flex items-center justify-center transition-all active:scale-95", isDark ? 'bg-white/5 text-foreground/70' : 'bg-secondary/50 text-muted-foreground')}>
                                <Menu className="w-5 h-5" strokeWidth={2} />
                            </button>

                            {/* Center: Wordmark */}
                            <div className="flex flex-col items-center gap-0">
                                <div className="flex items-center gap-1.5 font-black text-[15px] tracking-tight">
                                    <ShieldCheck className={cn("w-4 h-4", isDark ? "text-primary" : "text-primary")} strokeWidth={2.5} />
                                    <span className={cn(isDark ? "text-white" : "text-slate-900")}>Creator Armour</span>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                {/* Theme Toggle */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic();
                                        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                                    }}
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                                        isDark ? 'bg-white/5 text-foreground/70' : 'bg-white text-muted-foreground border'
                                    )}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        {isDark ? (
                                            <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                                <Moon className="w-[18px] h-[18px]" />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                                <Sun className="w-[18px] h-[18px]" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>

                                {/* Bell */}
                                <button 
                                    type="button" 
                                    onClick={() => handleAction('notifications')} 
                                    className={cn(
                                        'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95', 
                                        isDark ? 'bg-white/5 text-foreground/70' : 'bg-white text-muted-foreground border'
                                    )}
                                >
                                    <Bell className="w-[22px] h-[22px]" />
                                    {collabRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full border-2 text-[9px] font-black flex items-center justify-center text-white" style={{ borderColor: isDark ? '#0B0F14' : '#FFFFFF' }}>
                                            {collabRequests.length}
                                        </span>
                                    )}
                                    {shouldShowPushPrompt && (
                                        <span className="absolute bottom-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse border border-white" />
                                    )}
                                </button>

                                {/* Avatar */}
                                <button 
                                    type="button" 
                                    onClick={() => setActiveTab('profile')} 
                                    className={cn(
                                        "w-10 h-10 rounded-xl border p-0.5 overflow-hidden transition-all active:scale-95", 
                                        isDark ? 'border-white/10 bg-white/5' : 'border-border bg-white'
                                    )}
                                >
                                    <div className="w-full h-full rounded-[10px] overflow-hidden">
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
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ─── DASHBOARD TAB ─── */}
                    {activeTab === 'dashboard' && (
                        <>
                            {isLoadingDeals ? (
                                <DashboardLoadingStage isDark={isDark} tab="dashboard" />
                            ) : (() => {
                                const hasDeals = activeDealsCount > 0 || completedDealsCount > 0;

                                return (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="space-y-6 pb-20"
                                    >
                                        {/* Welcome Header */}
                                        <div className="relative z-10 -mt-2 mb-6">
                                            <div className={cn(
                                                "absolute inset-0 -z-10 bg-gradient-to-br overflow-hidden rounded-b-[40px] border-b",
                                                isDark 
                                                    ? "from-emerald-950 via-[#0B1A14] to-[#0A101A] border-emerald-900/30 shadow-[0_4px_40px_rgba(16,185,129,0.1)]" 
                                                    : "from-emerald-600 via-emerald-700 to-emerald-900 border-emerald-800 shadow-xl"
                                            )}>
                                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[80px] -mr-[200px] -mt-[200px] pointer-events-none mix-blend-screen" />
                                                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[60px] -ml-[150px] -mb-[150px] pointer-events-none mix-blend-screen" />
                                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                                            </div>

                                            <div className="px-6 pt-8 pb-12">
                                                <motion.p 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4 }}
                                                    className={cn(
                                                        'text-[11px] font-black uppercase tracking-[0.3em] mb-1', 
                                                        isDark ? "text-emerald-400" : "text-emerald-100/80"
                                                    )}
                                                >
                                                    {hasDeals ? "CREATOR DASHBOARD" : "GET STARTED"}
                                                </motion.p>
                                                <motion.h1 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: 0.05 }}
                                                    className={cn(
                                                        "text-[26px] font-black tracking-tighter leading-tight italic mb-2 truncate w-full whitespace-nowrap", 
                                                        isDark ? "text-white" : "text-white"
                                                    )}
                                                >
                                                    {hasDeals ? `Welcome back, ${displayName} 👋` : `Welcome, ${displayName} 👋`}
                                                </motion.h1>
                                                <motion.p 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: 0.1 }}
                                                    className={cn(
                                                        "text-[15px] font-medium leading-relaxed", 
                                                        isDark ? "text-emerald-100/70" : "text-emerald-50/90"
                                                    )}
                                                >
                                                    {hasDeals 
                                                        ? "Your performance and incoming offers are ready for you below."
                                                        : "Let's get your creator profile live and ready to receive brand deals."}
                                                </motion.p>
                                            </div>

                                            {/* Live Activity Insight (🔥 Brands Viewed) */}
                                            <div className="px-6 pb-6 -mt-2">
                                                <motion.div
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: 0.15, duration: 0.5 }}
                                                    className={cn(
                                                        "p-4 rounded-[28px] border overflow-hidden relative group",
                                                        isDark ? "bg-white/5 border-white/10" : "bg-white/20 border-white/30"
                                                    )}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent opacity-50" />
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
                                                                <motion.div
                                                                    animate={{ 
                                                                        scale: [1, 1.2, 1],
                                                                        filter: ["drop-shadow(0 0 0px #f97316)", "drop-shadow(0 0 8px #f97316)", "drop-shadow(0 0 0px #f97316)"]
                                                                    }}
                                                                    transition={{ duration: 2, repeat: Infinity }}
                                                                >
                                                                    <Flame className="w-6 h-6" fill="currentColor" />
                                                                </motion.div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[14px] font-black tracking-tight text-white">
                                                                    {profileViewsToday > 0 
                                                                        ? `${profileViewsToday} Brands viewed your profile` 
                                                                        : "Your profile is active today"}
                                                                </p>
                                                                <p className="text-[11px] font-medium text-white/50">
                                                                    {profileViewsToday > 0 
                                                                        ? "Trending now in brand discovery" 
                                                                        : "Share your link to attract brands"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {profileViewsToday > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Live</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Total Earnings Section - Only after 1 deal completes */}
                                        {completedDealsCount > 0 && (
                                            <div className="px-5">
                                                <motion.div
                                                    initial={{ scale: 0.97, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: 0.08 }}
                                                    className={cn(
                                                        "p-6 rounded-[32px] overflow-hidden border relative",
                                                        isDark ? "bg-[#0B1220] border-[#223046]" : "bg-white border-[#E5E7EB] shadow-sm"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute inset-0",
                                                        isDark
                                                            ? "bg-[linear-gradient(135deg,rgba(16,185,129,0.25),rgba(14,165,233,0.18),rgba(37,99,235,0.25))]"
                                                            : "bg-[linear-gradient(135deg,#10B981_0%,#0EA5E9_50%,#2563EB_100%)] opacity-95"
                                                    )} />
                                                    <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(800px 220px at 20% 0%, rgba(255,255,255,0.35), transparent 60%)" }} />

                                                    <div className="relative z-10 text-white">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">TOTAL EARNINGS</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => { triggerHaptic(); setActiveTab('payments'); }}
                                                                className="h-8 px-3 rounded-full bg-black/20 backdrop-blur-md border border-white/15 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95"
                                                            >
                                                                Details
                                                                <ArrowRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        <div className="mt-4 text-[32px] leading-none font-black font-outfit tabular-nums">
                                                            ₹{monthlyRevenue.toLocaleString()}
                                                        </div>

                                                        <div className="mt-4 flex items-center gap-3">
                                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/15 text-[11px] font-black">
                                                                <TrendingUp className="w-3.5 h-3.5" />
                                                                Performance Up
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}

                                        {/* Incoming Offers Preview */}
                                        {pendingOffersCount > 0 ? (
                                            <div className="px-5">
                                                <div className={cn(
                                                    "p-8 rounded-[40px] border",
                                                    isDark ? "bg-[#111820] border-white/5 shadow-2xl shadow-emerald-500/5" : "bg-white border-slate-200 shadow-sm"
                                                )}>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h3 className={cn("text-xl font-black italic uppercase tracking-tight", textColor)}>
                                                            Incoming Offers ({pendingOffersCount})
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => { triggerHaptic(); setActiveTab('deals'); setCollabSubTab('pending'); }}
                                                            className={cn("text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1")}
                                                        >
                                                            VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {pendingOffersDeduplicated.slice(0, 3).map((req: any, idx: number) => {
                                                            const amount = Number(req?.exact_budget || req?.deal_amount || req?.barter_value || 0);
                                                            const productImage = resolveCreatorDealProductImage(req);
                                                            return (
                                                                <div
                                                                    key={String(req?.id || idx)}
                                                                    onClick={() => { triggerHaptic(); setSelectedItem(req); setSelectedType('offer'); }}
                                                                    className={cn(
                                                                        "p-5 rounded-3xl border flex items-center gap-5 active:scale-[0.98] transition-all",
                                                                        isDark ? "bg-white/5 border-white/10 hover:bg-white/[0.08]" : "bg-slate-50 border-slate-200"
                                                                    )}
                                                                >
                                                                    <div className="w-16 h-16 rounded-2xl border overflow-hidden shrink-0 bg-black/20 shadow-lg">
                                                                        {productImage ? (
                                                                            <img src={productImage} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                {getBrandIcon(req?.brand_logo_url, req?.category, req?.brand_name)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className={cn("font-black text-lg italic tracking-tight truncate", textColor)}>{req?.brand_name || 'Brand'}</p>
                                                                        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-primary">₹{amount.toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="shrink-0">
                                                                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/25">
                                                                            <ArrowRight className="w-5 h-5" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Empty State */
                                            <div className={cn(
                                                "mx-5 p-8 rounded-[40px] border flex flex-col items-center text-center",
                                                isDark ? "bg-[#111820] border-white/5" : "bg-white border-slate-200 shadow-sm"
                                            )}>
                                                <div className="w-20 h-20 mb-6 relative">
                                                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                                    <div className="relative w-full h-full bg-gradient-to-br from-primary/30 to-transparent rounded-3xl flex items-center justify-center border border-white/10">
                                                        <Sparkles className="w-10 h-10 text-primary" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-black italic mb-2">No brand requests yet 👀</h3>
                                                <p className="text-sm opacity-50 font-medium mb-8 px-4 leading-relaxed">
                                                    When brands submit briefs through your collab link, they'll appear here for you to review and accept.
                                                </p>
                                                <button 
                                                    onClick={() => {
                                                        const url = `https://creatorarmour.com/${profile?.username || 'creator'}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success("Link copied!");
                                                        triggerHaptic('success');
                                                    }}
                                                    className="w-full bg-primary hover:bg-primary/90 text-white font-black italic rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                                                >
                                                    <Link2 className="w-5 h-5" />
                                                    Share Your Link
                                                </button>
                                            </div>
                                        )}




                                        {/* Link & WhatsApp Section */}
                                        <div className={cn(
                                            "mx-5 p-6 rounded-[32px] border space-y-6",
                                            isDark ? "bg-[#111820] border-white/5" : "bg-white border-slate-200 shadow-sm"
                                        )}>
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Your Creator Link</p>
                                                    <div className="flex items-center gap-1.5 opacity-40">
                                                        <LockIcon className="w-3 h-3" />
                                                        <p className="text-[9px] font-bold">Secure Link</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className={cn(
                                                        "flex-1 px-4 py-3 rounded-xl border font-medium text-sm truncate",
                                                        isDark ? "bg-black border-white/10" : "bg-slate-50 border-slate-200"
                                                    )}>
                                                        creatorarmour.com/{profile?.username || 'creator'}
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`https://creatorarmour.com/${profile?.username || 'creator'}`);
                                                            toast.success('Copied!');
                                                        }}
                                                        className={cn(
                                                            "px-6 rounded-xl font-black italic text-sm border transition-all active:scale-95",
                                                            isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const url = `https://wa.me/?text=${encodeURIComponent(`Check out my creator profile: https://creatorarmour.com/${profile?.username || 'creator'}`)}`;
                                                    window.open(url, '_blank');
                                                }}
                                                className="w-full bg-[#25D366] text-white font-black italic rounded-xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                            >
                                                <MessageCircle className="w-5 h-5 fill-current" />
                                                Share on WhatsApp
                                            </button>
                                        </div>

                                        {/* Preview Card */}
                                        <div className={cn(
                                            "mx-5 p-8 rounded-[32px] overflow-hidden relative border",
                                            isDark ? "bg-[#0A101A] border-white/10" : "bg-slate-900 border-slate-800"
                                        )}>
                                            <div className="relative z-10 space-y-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#22C55E]">WHAT BRANDS WILL SEE</h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden bg-white/5">
                                                        <img
                                                          src={withCacheBuster(profile?.avatar_url, profile?.updated_at) || `https://ui-avatars.com/api/?name=${profile?.business_name || 'B'}`}
                                                          className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-white italic truncate max-w-[200px]">{profile?.first_name || profile?.username || 'Creator'}</h3>
                                                        <p className="text-primary font-bold">@{profile?.username || 'creator'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-white/60 font-medium leading-relaxed">
                                                    Brands can view your portfolio, services, and send you direct collaboration offers.
                                                </p>
                                                <button 
                                                    onClick={() => window.open(`/${profile?.username || 'creator'}`, '_blank')}
                                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl px-6 py-3 text-sm font-black italic transition-all active:scale-95"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Public Profile
                                                </button>
                                            </div>
                                            <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-48 h-64 bg-white/5 rounded-3xl transform rotate-12 blur-sm pointer-events-none" />
                                            <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-48 h-64 bg-white/5 rounded-3xl transform rotate-6 border border-white/20 p-6 pointer-events-none">
                                                <div className="w-full h-24 bg-white/10 rounded-xl mb-4" />
                                                <div className="w-3/4 h-3 bg-white/20 rounded-full mb-3" />
                                                <div className="w-1/2 h-3 bg-white/10 rounded-full" />
                                                <div className="absolute top-4 right-4 flex gap-1">
                                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* More Deal Flow (Now at bottom) */}
                                        <div className="px-5 mb-10">
                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.16 }}
                                                className={cn(
                                                    "relative overflow-hidden rounded-[28px] border p-5",
                                                    isDark ? "bg-[#101922] border-white/5 shadow-[0_12px_35px_rgba(0,0,0,0.18)]" : "bg-white border-slate-200 shadow-sm"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "absolute inset-0 pointer-events-none",
                                                        isDark
                                                            ? "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_42%)]"
                                                            : "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.08),transparent_40%)]"
                                                    )}
                                                />

                                                <div className="relative z-10 space-y-4">
                                                    <div className="flex items-start gap-3.5">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-[16px] shrink-0 flex items-center justify-center border",
                                                            isDark ? "bg-emerald-500/10 border-emerald-400/15" : "bg-emerald-50 border-emerald-100"
                                                        )}>
                                                            <Instagram className={cn("w-6 h-6", isDark ? "text-emerald-300" : "text-emerald-600")} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.24em] mb-0.5", isDark ? "text-emerald-300/80" : "text-emerald-600")}>
                                                                More Deal Flow
                                                            </p>
                                                            <h3 className={cn("text-[17px] font-black tracking-tight leading-tight", textColor)}>
                                                                Add link to your Instagram bio
                                                            </h3>
                                                            <p className={cn("mt-1.5 text-[12px] leading-relaxed font-medium opacity-60", textColor)}>
                                                                Keep your collab page in your bio so brands can view packages and send offers.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "rounded-[18px] border p-3.5 space-y-1.5",
                                                        isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"
                                                    )}>
                                                        <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-40", textColor)}>
                                                            Your bio link
                                                        </p>
                                                        <p className={cn("text-[12px] font-black break-all", textColor)}>
                                                            creatorarmour.com/{username}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                handleCopyStorefront();
                                                                toast.success('Bio link copied');
                                                            }}
                                                            className={cn(
                                                                "h-[46px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[10px] active:scale-95 transition-all",
                                                                isDark
                                                                    ? "bg-gradient-to-r from-emerald-500 to-sky-500 text-white"
                                                                    : "bg-gradient-to-r from-emerald-500 to-sky-500 text-white"
                                                            )}
                                                        >
                                                            Copy Link
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                setActiveTab('profile');
                                                                setActiveSettingsPage('collab-link');
                                                            }}
                                                            className={cn(
                                                                "h-[46px] rounded-[14px] border font-black uppercase tracking-[0.12em] text-[10px] active:scale-95 transition-all",
                                                                isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                                                            )}
                                                        >
                                                            Edit Page
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                        </>
                    )}

                    {activeTab === 'analytics' && (
                        <>
                            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                                <div className="flex items-center justify-between mb-8">
                                    <button type="button" onClick={() => handleAction('menu')} aria-label="Open menu" className={cn("w-10 h-10 -ml-1 rounded-xl flex items-center justify-center transition-all active:scale-95", isDark ? "bg-white/5" : "bg-slate-100")}>
                                        <Menu className={cn("w-5 h-5", secondaryTextColor)} strokeWidth={2} />
                                    </button>

                                    <div className="flex items-center gap-1.5 font-bold text-[16px] tracking-tight">
                                        <ShieldCheck className={cn("w-4 h-4", isDark ? "text-primary" : "text-primary")} strokeWidth={2.5} />
                                        <span className={textColor}>Creator Armour</span>
                                    </div>

                                    <button type="button" onClick={() => setActiveTab('profile')} className={cn("w-10 h-10 rounded-xl border p-0.5 overflow-hidden transition-all active:scale-95 shadow-sm", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white")}>
                                        <div className="w-full h-full rounded-[10px] overflow-hidden">
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
                                {isLoadingDeals ? (
                                    <DashboardLoadingStage isDark={isDark} />
                                ) : (
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
                                )}
                            </div>

                            <div className="px-5 mb-8">
                                <DealSearchFilter
                                    onSearch={(query: string) => setSearchQuery(query)}
                                    onFilterChange={(filters: any) => setDealFilters(filters)}
                                    isDark={isDark}
                                    totalDeals={brandDeals?.length || 0}
                                />
                            </div>

                            <div className="px-5 mb-8">
                                <EnhancedInsights isDark={isDark} brandDeals={brandDeals} />
                            </div>

                            <div className="px-5 mb-8">
                                <ActivityFeed activities={creatorActivities} isDark={isDark} maxItems={4} />
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
                        </>
                    )}

                    {/* ─── DISCOVERY TAB ─── */}
                    {activeTab === 'discovery' && (
                        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center animate-in fade-in zoom-in duration-700">
                            <div className="relative mb-10">
                                <div className="absolute inset-0 bg-rose-500/30 blur-[80px] rounded-full animate-pulse" />
                                <div className="relative w-28 h-28 bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 rounded-[2.8rem] flex items-center justify-center shadow-2xl shadow-rose-500/40 rotate-12 group transition-transform hover:rotate-0 duration-500">
                                    <Sparkles className="w-12 h-12 text-white animate-pulse" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl rotate-[-12deg] border border-slate-100">
                                    <Heart className="w-6 h-6 text-rose-500" />
                                </div>
                            </div>
                            
                            <h1 className={cn("text-4xl font-black italic uppercase tracking-tighter mb-4", isDark ? "text-white" : "text-black")}>
                                Brand Discovery
                            </h1>
                            
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-rose-500/15 border border-rose-500/20 mb-8 backdrop-blur-md">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                </span>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Future Section</span>
                            </div>

                            <div className={cn(
                                "max-w-[320px] p-6 rounded-[32px] border relative overflow-hidden",
                                isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-xl shadow-rose-500/5"
                            )}>
                                <div className="relative z-10">
                                    <h3 className={cn("text-lg font-black italic mb-3", textColor)}>Brand Opportunities</h3>
                                    <p className={cn("text-[14px] font-medium leading-relaxed opacity-70", textColor)}>
                                        This will be the home for discovery cards where brands post active campaigns for influencers to join.
                                    </p>
                                    
                                    <div className="mt-6 flex flex-col gap-2">
                                        <div className={cn("h-4 rounded-lg w-full animate-pulse", isDark ? "bg-white/5" : "bg-slate-100")} />
                                        <div className={cn("h-4 rounded-lg w-[80%] animate-pulse", isDark ? "bg-white/5" : "bg-slate-100")} />
                                        <div className={cn("h-10 rounded-xl w-full mt-4 flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-30 border-2 border-dashed", isDark ? "border-white/10" : "border-slate-200")}>
                                            COMING SOON
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── COLLABS TAB ─── */}
                    {activeTab === 'deals' && (
                        <div className={cn("px-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20", isDark ? "" : "bg-slate-50")}>
                            {/* Toggle Header */}
                            <div className={cn(
                                "sticky top-0 z-20 -mx-5 px-5 pt-2 pb-3 mb-4",
                                isDark ? "bg-[#061318]/70 backdrop-blur-xl border-b border-border" : "bg-secondary/80 backdrop-blur-xl border-b border-border"
                            )}>
                                <div className={cn("flex p-1.5 rounded-2xl", isDark ? "bg-card/50" : "bg-slate-200/50")}>
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
                                            "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                            collabSubTab === 'pending'
                                                ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] scale-[1.02]"
                                                : cn(isDark ? "opacity-40 text-foreground" : "text-slate-500 hover:opacity-100")
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
                                            "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                            collabSubTab === 'active'
                                                ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] scale-[1.02]"
                                                : cn(isDark ? "opacity-40 text-foreground" : "text-slate-500 hover:opacity-100")
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
                                            "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                            collabSubTab === 'completed'
                                                ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] scale-[1.02]"
                                                : cn(isDark ? "opacity-40 text-foreground" : "text-slate-500 hover:opacity-100")
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
                                        className="mb-8"
                                    >
                                        <div className="flex items-center justify-between mb-4 mt-2">
                                            <h2 className={cn("text-[20px] font-bold tracking-tight", isDark ? "text-foreground" : "text-slate-900")}>Active Deals</h2>
                                            <div className="flex items-center gap-1.5 cursor-pointer">
                                                <span className={cn("text-[12px] font-medium", isDark ? "text-foreground/60" : "text-slate-600")}>Sort: Deadline (Soonest)</span>
                                                <svg className={cn("w-3.5 h-3.5", isDark ? "text-foreground/40" : "text-slate-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className={cn("mb-5 p-3 rounded-[12px] flex items-center justify-between", isDark ? "bg-[#1B253C] border border-[#23304C]" : "bg-emerald-50 border border-emerald-200")}>
                                            <div className="flex flex-1 items-center gap-3">
                                                <div className={cn("shrink-0 w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center font-bold text-[10px] leading-none pb-[1px] ml-1", isDark ? "border-blue-400 text-blue-500" : "border-emerald-400 text-emerald-600")}>i</div>
                                                <p className={cn("text-[12px] font-semibold leading-snug", isDark ? "text-blue-200/90" : "text-emerald-800")}>Complete and deliver on time to build trust and get more deals.</p>
                                            </div>
                                            <button className={cn("ml-3 shrink-0 px-3.5 py-1.5 rounded-full border text-[11px] font-bold active:scale-95 transition-all text-white bg-emerald-600")}>
                                                View Tips
                                            </button>
                                        </div>

                                        {activeDealsCount > 0 ? (
                                            <div className="space-y-4">
                                                {activeDealsList.slice(0, 10).map((deal: any, idx: number) => {
                                                    const ux = getCreatorDealCardUX(deal);
                                                    const budget = Number(deal?.deal_amount || deal?.exact_budget || 0);

                                                    // Use ux format for due text or fallback to explicit wording
                                                    let dueText = ux.daysUntilDue === null
                                                        ? null
                                                        : ux.daysUntilDue < 0
                                                            ? `OVERDUE ${Math.abs(ux.daysUntilDue)}D`
                                                            : `${ux.daysUntilDue} DAYS LEFT`;
                                                    
                                                    const productImage = resolveCreatorDealProductImage(deal);
                                                    const contractSigned =
                                                        !ux.needsSignature &&
                                                        (ux.rawStatus.includes('fully_executed') ||
                                                            ux.rawStatus === 'signed' ||
                                                            ux.rawStatus.includes('content_') ||
                                                            ux.rawStatus.includes('payment_released') ||
                                                            ux.rawStatus.includes('completed'));
                                                            
                                                    const deliverablesContent = (() => {
                                                        const raw = deal?.deliverables || deal?.raw?.deliverables;
                                                        try {
                                                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                                const types = parsed.map((d: any) => {
                                                                    if (typeof d === 'string') return d.includes('Reel') ? 'Reel' : d;
                                                                    const ct = String(d?.contentType || d?.type || '').toLowerCase();
                                                                    const count = Number(d?.count || d?.quantity || 1) || 1;
                                                                    const label = ct.includes('reel') ? 'Reel' : ct.includes('story') ? 'Story' : 'Post';
                                                                    return count > 1 ? `${label} (x${count})` : label;
                                                                });
                                                                return types.join(' + ');
                                                            }
                                                        } catch {}
                                                        return 'Reel';
                                                    })();                                                    

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
                                                                "relative w-full aspect-[4/5] rounded-[40px] overflow-hidden transition-all duration-500 group cursor-pointer border-0 shadow-2xl shadow-black/20",
                                                                isDark ? "bg-[#0B1220]" : "bg-slate-100"
                                                            )}
                                                        >
                                                            {/* Background Image/Fallback */}
                                                            <div className="absolute inset-0">
                                                                {productImage ? (
                                                                    <img 
                                                                        src={productImage} 
                                                                        alt="" 
                                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                                        loading="lazy" 
                                                                    />
                                                                ) : (
                                                                    <div className={cn(
                                                                        "w-full h-full flex flex-col items-center justify-center gap-4",
                                                                        isDark ? "bg-gradient-to-br from-[#1A1D25] to-[#12141A]" : "bg-gradient-to-br from-slate-100 to-slate-200"
                                                                    )}>
                                                                        <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center p-4">
                                                                            {getBrandIcon(deal.brand_logo_url || deal.brand_logo || deal.logo_url, deal.category, deal.brand_name)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Premium Overlays */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/5" />
                                                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                            </div>

                                                            {/* Content Wrapper */}
                                                            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                                                                {/* Top Row: Status Pills */}
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                                        <span className="text-[11px] font-black uppercase tracking-widest text-white">{ux.stagePill || "Active Deal"}</span>
                                                                    </div>
                                                                    {dueText && (
                                                                        <div className="px-4 py-2 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-500/20 flex items-center gap-2">
                                                                            <Clock className="w-3.5 h-3.5 text-rose-300" />
                                                                            <span className="text-[11px] font-black uppercase tracking-widest text-rose-100">{dueText}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Bottom Section */}
                                                                <div>
                                                                    {/* Progress Pill */}
                                                                    <div className="mb-4 flex items-center justify-between">
                                                                       <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Campaign Progress</span>
                                                                            <span className="text-[11px] font-black text-emerald-400">{Math.round((Math.max(1, ux.progressStep) / 5) * 100)}%</span>
                                                                       </div>
                                                                       <p className="text-[18px] font-black text-white tracking-tight">
                                                                           {budget > 0 ? `₹${budget.toLocaleString()}` : '—'}
                                                                       </p>
                                                                    </div>
                                                                    
                                                                    <div className="h-1.5 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
                                                                        <motion.div 
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${(Math.max(1, ux.progressStep) / 5) * 100}%` }}
                                                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                                                                        />
                                                                    </div>

                                                                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2 drop-shadow-lg uppercase italic">
                                                                        {deal.brand_name}
                                                                    </h2>
                                                                    <p className="text-white/70 text-sm font-semibold mb-8 line-clamp-2 leading-relaxed">
                                                                        {deliverablesContent} • Professional Campaign Active
                                                                    </p>

                                                                    {/* Hero CTA */}
                                                                    <button 
                                                                        type="button"
                                                                        className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.15em] text-[13px] flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all duration-300"
                                                                    >
                                                                        {ux.progressStep <= 2 ? "Upload Deliverables" : "Manage Campaign"}
                                                                        <ChevronRight className="w-5 h-5" strokeWidth={3} />
                                                                    </button>
                                                                </div>
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
                                                            const productImage = resolveCreatorDealProductImage(deal);
                                                            return (
                                                        <motion.div
                                                            key={idx}
                                                            whileTap={{ scale: 0.985 }}
                                                            onTap={() => {
                                                                triggerHaptic();
                                                                setSelectedItem(deal);
                                                                setSelectedType('deal');
                                                            }}
                                                            className={cn(
                                                                "p-6 rounded-[24px] border transition-all duration-300 group active:scale-[0.99] relative cursor-pointer",
                                                                isDark 
                                                                    ? "bg-gradient-to-br from-[#1A1D25] to-[#12141A] border-[#2E323D]/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]" 
                                                                    : "bg-white border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                                            )}
                                                        >
                                                            <div className="flex gap-5">
                                                                {/* Left: Campaign Preview Image */}
                                                                <div className={cn(
                                                                    "w-24 h-24 rounded-2xl overflow-hidden border shrink-0 shadow-sm relative group",
                                                                    isDark ? "border-border/30 bg-secondary/30" : "border-border bg-muted/20"
                                                                )}>
                                                                    {productImage ? (
                                                                        <img src={productImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                                                    ) : (
                                                                        <div className={cn("w-full h-full flex items-center justify-center", isDark ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10" : "bg-gradient-to-br from-emerald-50 to-teal-50")}>
                                                                            {getBrandIcon(deal.brand_logo_url || deal.brand_logo || deal.logo_url || deal.raw?.brand_logo_url || deal.raw?.brand_logo || (deal as any).brand?.logo_url, deal.category, deal.brand_name)}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Right: Completion Details */}
                                                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <h4 className={cn("text-[18px] font-black tracking-tight leading-tight truncate capitalize", isDark ? "text-foreground" : "text-slate-900")}>
                                                                                {deal.brand_name}
                                                                            </h4>
                                                                            <p className={cn("text-[11px] font-black mt-1 uppercase tracking-widest", isDark ? "text-foreground/40" : "text-slate-400")}>
                                                                                {deal.category || 'Brand Partner'}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                            <p className={cn("text-[20px] font-black tracking-tight leading-none", isDark ? "text-foreground" : "text-slate-900")}>
                                                                                ₹{(deal.deal_amount || deal.exact_budget || 0).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-auto">
                                                                        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                                            Closed & Payout Ready
                                                                        </div>
                                                                    </div>
                                                                </div>
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
                                                                    "mt-6 w-full h-12 rounded-[14px] text-[13px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border border-border/50 flex items-center justify-center gap-2",
                                                                    isDark ? "bg-secondary/40 hover:bg-secondary/60 text-foreground" : "bg-slate-50 text-[#334155] hover:bg-slate-100"
                                                                )}
                                                            >
                                                                {ux.cta || 'View Summary'}
                                                                <ChevronRight className="w-4 h-4 opacity-40" />
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
                                                <p className={cn("text-[13px] leading-relaxed opacity-70 mb-5", textColor)}>
                                                    Share your collab link to receive brand briefs here.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        handleCopyStorefront();
                                                    }}
                                                    className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[13px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                >
                                                    Copy Link
                                                </button>
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
                                        {(() => {
                                            const offers = pendingOffersDeduplicated;

                                            const timeAgo = (value: any) => {
                                                const dt = value ? new Date(value) : null;
                                                if (!dt || Number.isNaN(dt.getTime())) return null;
                                                const minutes = Math.max(0, Math.round((Date.now() - dt.getTime()) / 60000));
                                                if (minutes < 60) return `${minutes}m ago`;
                                                const hours = Math.round(minutes / 60);
                                                if (hours < 24) return `${hours}h ago`;
                                                const days = Math.round(hours / 24);
                                                return `${days}d ago`;
                                            };

                                            const computeExpiresAt = (req: any) => {
                                                const createdAt = req?.created_at || req?.raw?.created_at || null;
                                                const base = createdAt ? new Date(createdAt) : new Date();
                                                const explicit = req?.deadline || req?.expires_at || req?.raw?.deadline || null;
                                                return explicit ? new Date(explicit) : new Date(base.getTime() + 48 * 60 * 60 * 1000);
                                            };

                                            const expiresInText = (req: any) => {
                                                const expiresAt = computeExpiresAt(req);
                                                const msLeft = expiresAt.getTime() - Date.now();
                                                const hoursLeft = Math.max(0, Math.round(msLeft / 3600000));
                                                if (hoursLeft <= 72) return `Expires in ${hoursLeft}h`;
                                                const daysLeft = Math.max(0, Math.ceil(hoursLeft / 24));
                                                return `${daysLeft}d left`;
                                            };

                                            const expBadgeText = (req: any) => {
                                                const expiresAt = computeExpiresAt(req);
                                                const msLeft = expiresAt.getTime() - Date.now();
                                                const hoursLeft = Math.max(0, Math.round(msLeft / 3600000));
                                                const daysLeft = Math.max(0, Math.ceil(hoursLeft / 24));
                                                return `${daysLeft}D LEFT`;
                                            };

                                            const resolveOfferImage = (req: any) => resolveCreatorDealProductImage(req);

                                            const resolveActiveDealImage = (deal: any) => resolveCreatorDealProductImage(deal);

                                            const deliverableText = (req: any) => {
                                                const raw = req?.deliverables || req?.raw?.deliverables;
                                                try {
                                                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                                        const labels = parsed.map((d: any) => {
                                                            if (typeof d === 'string') return d;
                                                            const ct = String(d?.contentType || d?.type || '').toLowerCase();
                                                            const count = Number(d?.count || d?.quantity || 1) || 1;
                                                            if (ct.includes('reel')) return count > 1 ? `${count} Reels` : 'Reel';
                                                            if (ct.includes('story')) return count > 1 ? `${count} Stories` : 'Story';
                                                            if (ct.includes('post')) return count > 1 ? `${count} Posts` : 'Instagram Post';
                                                            return 'Deliverables';
                                                        });
                                                        return labels.slice(0, 2).join(' + ');
                                                    }
                                                } catch { }
                                                if (typeof raw === 'string' && raw.trim()) return raw.trim();
                                                return 'Reel';
                                            };

                                            if (offers.length === 0) {
                                                const completionScore = (() => {
                                                    let score = 20;
                                                    if (profileFormData.payout_upi) score += 20;
                                                    if (profileFormData.audience_gender_split) score += 20;
                                                    if (profileFormData.content_vibes?.length > 0) score += 20;
                                                    if (profileFormData.deal_templates?.length > 0) score += 20;
                                                    return score;
                                                })();

                                                return (
                                                    <DashboardEmptyState 
                                                        isDark={isDark}
                                                        textColor={textColor}
                                                        completionScore={completionScore}
                                                        onOptimize={() => { triggerHaptic(); setActiveTab('profile'); setActiveSettingsPage('collab-link'); }}
                                                        onShare={() => { triggerHaptic(); handleShareOnWhatsApp(); }}
                                                    />
                                                );
                                            }

                                            return (
                                                <>
                                                    <div className={cn(
                                                        "p-4 rounded-2xl border flex items-center justify-between gap-3",
                                                        isDark ? "bg-card border-border" : "bg-emerald-50 border-emerald-200"
                                                    )}>
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isDark ? "bg-emerald-500/12" : "bg-emerald-100")}>
                                                                <Zap className={cn("w-5 h-5", isDark ? "text-emerald-300" : "text-emerald-700")} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={cn("text-[13px] font-black tracking-tight", isDark ? "text-foreground" : "text-emerald-900")}>New offers expire fast!</p>
                                                                <p className={cn("text-[12px] font-semibold opacity-70", isDark ? "text-foreground/60" : "text-emerald-800")}>Respond quickly to secure the best deals.</p>
                                                            </div>
                                                        </div>
                                                        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", isDark ? "border-emerald-400/20 bg-emerald-500/8" : "border-emerald-200 bg-emerald-100/50")}>
                                                            <Clock className={cn("w-5 h-5", isDark ? "text-emerald-300" : "text-emerald-700")} />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <h2 className={cn("text-[20px] font-bold tracking-tight", isDark ? "text-foreground" : "text-slate-900")}>New Offers</h2>
                                                        <button type="button" onClick={() => triggerHaptic()} className={cn("flex items-center gap-2 text-[12px] font-medium", isDark ? "text-foreground/60" : "text-slate-600")}>
                                                            Sort: Recently Added
                                                            <ChevronRight className={cn("w-4 h-4 rotate-90", isDark ? "text-foreground/40" : "text-slate-400")} />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {offers.slice(0, 20).map((req: any, idx: number) => {
                                                            const amount = Number(req?.exact_budget || req?.deal_amount || req?.barter_value || 0);
                                                            const isHighPaying = Number.isFinite(amount) && amount >= 20000;
                                                            const offerImage = resolveOfferImage(req);
                                                            const posted = timeAgo(req?.created_at || req?.raw?.created_at);
                                                            const expText = expiresInText(req);
                                                            const expBadge = expBadgeText(req);
                                                            const deliverables = deliverableText(req);
                                                            const category = String(req?.category || req?.industry || req?.niche || '').trim();
                                                            const brandName = String(req?.brand_name || 'Brand').trim();

                                                            return (
                                                                 <motion.div
                                                                    key={String(req?.id || idx)}
                                                                    whileTap={{ scale: 0.985 }}
                                                                    onTap={() => {
                                                                        triggerHaptic();
                                                                        setSelectedItem(req);
                                                                        setSelectedType('offer');
                                                                    }}
                                                                    className={cn(
                                                                        "p-5 rounded-[28px] border transition-all duration-500 group relative cursor-pointer overflow-hidden",
                                                                        isDark 
                                                                            ? "bg-gradient-to-br from-[#0B1220] to-[#070B14] border-[#223046] shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                                                                            : "bg-white border-slate-200/60 shadow-[0_15px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)]"
                                                                    )}
                                                                >
                                                                    {isDark && <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5" />}
                                                                    
                                                                    <div className="flex items-center justify-between gap-2 mb-4">
                                                                        <div className="flex gap-2">
                                                                            <span className={cn(
                                                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                                                isHighPaying
                                                                                    ? (isDark ? "bg-amber-500/10 text-amber-300 border-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "bg-amber-50 text-amber-700 border-amber-100")
                                                                                    : (isDark ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-100")
                                                                            )}>
                                                                                <Zap className="w-3 h-3 fill-current" />
                                                                                {isHighPaying ? 'High Paying' : 'Standard'} Deal
                                                                            </span>
                                                                        </div>
                                                                        <span className={cn(
                                                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                                            isDark ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-100"
                                                                        )}>
                                                                            <Clock className="w-3 h-3" />
                                                                            {expBadge}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex gap-4 mb-6">
                                                                        <div className={cn(
                                                                            "w-[120px] h-[120px] rounded-[24px] overflow-hidden border shrink-0 p-1 shadow-md transition-all duration-500 group-hover:scale-[1.05] relative", 
                                                                            isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/50"
                                                                        )}>
                                                                            {offerImage ? (
                                                                                <img src={offerImage} alt="" className="w-full h-full object-cover rounded-[18px]" loading="lazy" />
                                                                            ) : (
                                                                                <div className={cn("w-full h-full rounded-[18px] flex items-center justify-center", isDark ? "bg-slate-800" : "bg-white")}>
                                                                                    {getBrandIcon(req.brand_logo_url || req.brand_logo || req.logo_url || req.raw?.brand_logo_url || req.raw?.brand_logo || (req as any).brand?.logo_url, req.category, brandName)}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1 py-0.5 flex flex-col justify-between">
                                                                            <div className="min-w-0">
                                                                                <h4 className={cn("text-[20px] font-black tracking-tight leading-tight truncate capitalize", isDark ? "text-white" : "text-slate-900")}>
                                                                                    {brandName}
                                                                                </h4>
                                                                                <p className={cn("text-[13px] font-bold mt-1.5 opacity-60 truncate", textColor)}>
                                                                                    {deliverables}
                                                                                </p>
                                                                            </div>

                                                                            <div className="pt-2">
                                                                                <div className="flex items-baseline gap-1.5">
                                                                                    <p className={cn("text-[28px] font-black tracking-tighter tabular-nums leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                                                        ₹{Number.isFinite(amount) ? amount.toLocaleString() : '—'}
                                                                                    </p>
                                                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40")}>Earnings</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                triggerHaptic();
                                                                                if (req?.isDemo) {
                                                                                    toast.message('This is a demo offer', { description: 'Accept is disabled for demo.' });
                                                                                    return;
                                                                                }
                                                                                await handleAccept(req);
                                                                            }}
                                                                            className={cn(
                                                                                "h-[52px] rounded-[18px] font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-blue-600/20",
                                                                                isDark ? "bg-blue-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                                                                            )}
                                                                        >
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                triggerHaptic(HapticPatterns.error);
                                                                                if (req?.isDemo) {
                                                                                    toast.message('This is a demo offer', { description: 'Decline is disabled for demo.' });
                                                                                    return;
                                                                                }
                                                                                if (onDeclineRequest) {
                                                                                    try { await onDeclineRequest(req); } catch { }
                                                                                }
                                                                            }}
                                                                            className={cn(
                                                                                "h-[52px] rounded-[18px] font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-all border",
                                                                                isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                            )}
                                                                        >
                                                                            <XCircle className="w-4 h-4" />
                                                                            Decline
                                                                        </button>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            triggerHaptic();
                                                                            setSelectedItem(req);
                                                                            setSelectedType('offer');
                                                                            toast.message('Counter Offer', { description: 'Open offer details to counter.' });
                                                                        }}
                                                                        className={cn("w-full py-1 text-center text-[11px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity", textColor)}
                                                                        >
                                                                            Send Counter Offer
                                                                        </button>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="h-24 opacity-0 pointer-events-none" aria-hidden="true" />
                        </div>
                    )}

                    {/* ─── OTHER TABS (Simplified for UI flow) ─── */}
                    {activeTab === 'profile' && (
                        <AnimatePresence mode="wait">
                                {!activeSettingsPage ? (
                                    <AccountTab 
                                        isDark={isDark}
                                        textColor={textColor}
                                        secondaryTextColor={secondaryTextColor}
                                        profile={profile}
                                        username={username}
                                        avatarUrl={avatarVersionedUrl}
                                        avatarFallbackUrl={avatarFallbackUrl}
                                        avatarCacheKey={profile?.last_instagram_sync || profile?.updated_at || profile?.avatar_url || profile?.instagram_profile_photo || username}
                                        isPushSubscribed={isPushSubscribed}
                                        setActiveSettingsPage={setActiveSettingsPage}
                                        setActiveTab={setActiveTab}
                                        triggerHaptic={triggerHaptic}
                                    />
                                ) : (
                                    <motion.div
                                        key="settings-page"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="w-full touch-pan-y"
                                    >
                                        {renderSettingsPage()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                    )}


                    {activeTab === 'payments' && (
                        <PaymentsTab 
                            isDark={isDark}
                            textColor={textColor}
                            profileFormData={profileFormData}
                            setProfileFormData={setProfileFormData}
                            handleSaveProfile={handleSaveProfile}
                            isSavingProfile={isSavingProfile}
                            profile={profile}
                            brandDeals={brandDeals}
                            getCreatorPaymentListUX={getCreatorPaymentListUX}
                            getBrandIcon={getBrandIcon}
                            triggerHaptic={triggerHaptic}
                            setSelectedPayment={setSelectedPayment}
                            setActiveSettingsPage={setActiveSettingsPage}
                        />
                    )}
                </div>

                {/* ─── NAVIGATION BAR (Redesigned) ─── */}
                {/*
                  Important: when an overlay/modal is open we must prevent the bottom nav from
                  intercepting taps. This fixes "click interception" class bugs on mobile.
                */}
                {(() => {
                    const isOverlayOpen =
                        Boolean(selectedItem) ||
                        showActionSheet ||
                        showItemMenu ||
                        showDeliverContentModal ||
                        showReportIssueModal ||
                        showCreatorSigningModal ||
                        showPushInstallGuide ||
                        showShareSheet ||
                        showProgressSheet;
                    return (
                <div
                    className={cn(
                        'fixed bottom-0 inset-x-0 border-t z-[1100] transition-all duration-500',
                        isDark ? 'border-white/10 bg-[#0B0F14]' : 'border-slate-200 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.04)]',
                        isOverlayOpen && 'pointer-events-none'
                    )}
                    style={{ 
                        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
                        backdropFilter: 'blur(30px)', 
                        WebkitBackdropFilter: 'blur(30px)' 
                    }}
                >
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 pt-3 gap-1">
                        {/* Active Tab Background Indicator (Sliding) */}
                        <div className="absolute inset-x-6 top-3 h-[54px] pointer-events-none">
                            <motion.div 
                                layoutId="activeTabIndicator"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                className={cn(
                                    "absolute h-full rounded-2xl border transition-colors",
                                    isDark ? "bg-white/5 border-white/10" : "bg-white shadow-sm border-[#E5E7EB]"
                                )}
                                style={{ 
                                    width: 'calc(20% - 4px)', // 5 tabs
                                    left: activeTab === 'dashboard' ? '0%' 
                                        : activeTab === 'deals' ? '20%'
                                        : activeTab === 'discovery' ? '40%'
                                        : activeTab === 'payments' ? '60%'
                                        : '80%'
                                }}
                            />
                        </div>

                        <motion.button 
                            whileTap={{ scale: 0.94 }} 
                            onClick={() => { 
                                if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop; 
                                triggerHaptic(HapticPatterns.light); 
                                setActiveTab('dashboard'); 
                            }} 
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                                activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-500' : secondaryTextColor)
                            )}
                        >
                            <LayoutDashboard className="w-[22px] h-[22px]" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
                            <span className={cn('text-[10px] tracking-tight font-black uppercase', activeTab === 'dashboard' ? 'opacity-100' : 'opacity-40')}>Home</span>
                        </motion.button>

                        <motion.button 
                            whileTap={{ scale: 0.94 }} 
                            onClick={() => { 
                                if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop; 
                                triggerHaptic(HapticPatterns.light); 
                                setActiveTab('deals'); 
                            }} 
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                                activeTab === 'deals' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-500' : secondaryTextColor)
                            )}
                        >
                            <Briefcase className="w-[22px] h-[22px]" strokeWidth={activeTab === 'deals' ? 2.5 : 2} />
                            <span className={cn('text-[10px] tracking-tight font-black uppercase', activeTab === 'deals' ? 'opacity-100' : 'opacity-40')}>Deals</span>
                        </motion.button>

                        <div className="relative flex-1">
                            <motion.button 
                                whileTap={{ scale: 0.94 }} 
                                onClick={() => { 
                                    triggerHaptic(HapticPatterns.medium); 
                                    toast.info("Discovery is coming soon!", {
                                        description: "Find new brands directly from here.",
                                        icon: '🚀',
                                        style: { borderRadius: '20px', fontWeight: 'bold' }
                                    });
                                }} 
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 w-full h-[54px] z-10 transition-colors",
                                    activeTab === 'discovery' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-500' : secondaryTextColor)
                                )}
                            >
                                <Heart className="w-[22px] h-[22px]" strokeWidth={2} />
                                <span className={cn('text-[10px] tracking-tight font-black uppercase opacity-40')}>Find</span>
                            </motion.button>
                            <div className={cn("absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter border shadow-sm", isDark ? "bg-primary/20 border-primary/30 text-primary" : "bg-emerald-500 border-emerald-600 text-white")}>
                                Soon
                            </div>
                        </div>

                        <motion.button 
                            whileTap={{ scale: 0.94 }} 
                            onClick={() => { 
                                if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop; 
                                triggerHaptic(HapticPatterns.light); 
                                setActiveTab('payments'); 
                            }} 
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                                activeTab === 'payments' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-500' : secondaryTextColor)
                            )}
                        >
                            <CreditCard className="w-[22px] h-[22px]" strokeWidth={activeTab === 'payments' ? 2.5 : 2} />
                            <span className={cn('text-[10px] tracking-tight font-black uppercase', activeTab === 'payments' ? 'opacity-100' : 'opacity-40')}>Pay</span>
                        </motion.button>

                        <motion.button 
                            whileTap={{ scale: 0.94 }} 
                            onClick={() => { 
                                if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop; 
                                triggerHaptic(HapticPatterns.light); 
                                setActiveTab('profile'); 
                            }} 
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                                activeTab === 'profile' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-500' : secondaryTextColor)
                            )}
                        >
                            <User className="w-[22px] h-[22px]" strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                            <span className={cn('text-[10px] tracking-tight font-black uppercase', activeTab === 'profile' ? 'opacity-100' : 'opacity-40')}>Me</span>
                        </motion.button>
                    </div>
                </div>
                    );
                })()}

                {/* ─── ACTION SHEET ─── */}
                <AnimatePresence>
                    {showActionSheet && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowActionSheet(false)}
                                className="fixed inset-0 z-[2900] bg-black/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className={cn(
                                    "fixed bottom-0 inset-x-0 z-[3000] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl",
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
                                                setShowActionSheet(false);
                                                setShowShareSheet(true);
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

                {/* ─── SHARE SHEET ─── */}
                <AnimatePresence>
                    {showShareSheet && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowShareSheet(false)}
                                className="fixed inset-0 z-[2900] bg-black/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                                className={cn(
                                    "fixed bottom-0 inset-x-0 z-[3000] rounded-t-[2.5rem] p-6 pb-safe overflow-hidden shadow-2xl",
                                    isDark ? "bg-[#0B0F14] border-t border-white/5" : "bg-white border-t border-slate-200"
                                )}
                            >
                                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8" />
                                <div className="max-w-md mx-auto">
                                    <div className="text-center mb-8">
                                        <div className={cn("w-16 h-16 rounded-[2rem] mx-auto mb-4 flex items-center justify-center rotate-3 border-2", isDark ? "bg-primary/10 border-primary/30" : "bg-emerald-50 border-emerald-200")}>
                                            <Share2 className="w-8 h-8 text-primary" />
                                        </div>
                                        <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Share your link</h2>
                                        <p className={cn("text-sm font-medium mt-1.5 opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>Send your collab page to brands to start getting deals</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 mb-8">
                                        <button
                                            type="button"
                                            onClick={() => { triggerHaptic(); handleShareOnWhatsApp(); setShowShareSheet(false); }}
                                            className={cn(
                                                "p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-[0.98]",
                                                isDark ? "bg-white/5 border-white/5" : "bg-emerald-50 border-emerald-100 shadow-sm"
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0">
                                                <MessageCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>WhatsApp</p>
                                                <p className={cn("text-xs font-medium opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>Direct to brands or group chats</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { triggerHaptic(); handleCopyStorefront(); setShowShareSheet(false); }}
                                            className={cn(
                                                "p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-[0.98]",
                                                isDark ? "bg-white/5 border-white/5" : "bg-blue-50 border-blue-100 shadow-sm"
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                                                <Copy className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>Copy Link</p>
                                                <p className={cn("text-xs font-medium opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>Copy your high-converting link</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { triggerHaptic(); toast.message('Instagram', { description: 'Copy link and paste in your story/bio.' }); setShowShareSheet(false); }}
                                            className={cn(
                                                "p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-[0.98]",
                                                isDark ? "bg-white/5 border-white/5" : "bg-pink-50 border-pink-100 shadow-sm"
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#D62976] to-[#8134AF] flex items-center justify-center shrink-0">
                                                <Instagram className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>Instagram</p>
                                                <p className={cn("text-xs font-medium opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>Add to your link-in-bio</p>
                                            </div>
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowShareSheet(false)}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-[15px] font-bold active:scale-[0.98] transition-all",
                                            isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-900"
                                        )}
                                    >
                                        Cancel
                                    </button>
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
                                            <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-primary/8 rounded-full blur-[140px]" />
                                            <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-info/8 rounded-full blur-[160px]" />
                                            <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-primary/6 rounded-full blur-[170px]" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
                                            <div className="absolute inset-0 bg-background" />
                                        </div>
                                    )}

                                    {/* Fixed Header */}
                                    <div className={cn(
                                        "px-5 py-4 flex items-center justify-between border-b sticky top-0 z-20",
                                        isDark ? "bg-[#061318]/80 backdrop-blur-2xl border-white/5" : "bg-white/95 backdrop-blur-md border-slate-200"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <button type="button"
                                                onClick={closeItemDetail}
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-sm",
                                                    isDark ? "bg-[#151922] border-white/10 hover:bg-white/5" : "bg-white border-slate-200 hover:bg-slate-50"
                                                )}
                                            >
                                                <ChevronRight className="w-5 h-5 rotate-180" />
                                            </button>
                                            <div>
                                                <h2 className={cn("text-[17px] font-black tracking-tight leading-none mb-1", textColor)}>
                                                    {selectedType === 'deal' ? 'Collaboration' : 'Offer Brief'}
                                                </h2>
                                                <div className="flex items-center gap-1.5 opacity-50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                    <p className={cn("text-[11px] font-bold uppercase tracking-widest leading-none", textColor)}>
                                                        {selectedItem.brand_name || selectedItem.raw?.brand_name || 'Brand Partner'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button"
                                            onClick={() => { triggerHaptic(); setShowItemMenu(true); }}
                                            className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-sm",
                                                isDark ? "bg-[#151922] border-white/10" : "bg-white border-slate-200"
                                            )}
                                        >
                                            <MoreHorizontal className="w-5 h-5 opacity-50" />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-4 sm:px-5 pt-4 sm:pt-5 pb-40 relative z-10">

                                        {/* ── OFFER BRIEF HERO ── */}
                                        {selectedType === 'offer' ? (
                                            <div className="mb-6">
                                                <div className="flex flex-col items-center text-center gap-4 pt-1">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-[0.17em] border",
                                                        isDark ? "bg-amber-500/12 text-amber-300 border-amber-400/15" : "bg-amber-50 text-amber-700 border-amber-100"
                                                    )}>
                                                        <Clock className="w-4 h-4" />
                                                        Awaiting your decision
                                                    </div>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.16em] border",
                                                        isDark ? "bg-emerald-500/12 text-emerald-300 border-emerald-400/15" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    )}>
                                                        {String(selectedItem?.collab_type || '').toLowerCase().includes('barter') ? 'Free Products' : 'Paid Campaign'}
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "mt-6 rounded-[32px] border p-0 overflow-hidden relative overflow-hidden transition-all duration-500",
                                                    isDark 
                                                        ? "bg-[#0C1320]/80 backdrop-blur-3xl border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]" 
                                                        : "bg-white border-[#E5E7EB] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)]"
                                                )}>
                                                    {isDark && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />}
                                                    
                                                    <div className="flex flex-col sm:flex-row gap-5 p-5">
                                                        <div className={cn(
                                                            "w-full sm:w-[180px] h-[240px] rounded-[24px] overflow-hidden shrink-0 relative group",
                                                            isDark ? "bg-card" : "bg-[#F3F4F6]"
                                                        )}>
                                                            {(() => {
                                                                const src = resolveCreatorDealProductImage(selectedItem) || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500';
                                                                return (
                                                                    <>
                                                                        <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2 opacity-50">
                                                                    <Tag className="w-3 h-3" />
                                                                    <p className="text-[11px] font-black uppercase tracking-[0.1em]">Brand Briefing</p>
                                                                </div>
                                                                <p className={cn("text-[48px] leading-[0.85] font-black tracking-tight", textColor)}>
                                                                    {renderBudgetValue(selectedItem)}
                                                                </p>
                                                                <p className={cn("text-[17px] font-bold mt-3 inline-flex items-center gap-2", textColor)}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                                                                    {(() => {
                                                                        const raw = selectedItem?.deliverables || selectedItem?.raw?.deliverables;
                                                                        try {
                                                                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                                                const first = parsed[0];
                                                                                if (typeof first === 'string') return first.includes('Reel') ? 'Reel' : first;
                                                                                const ct = String(first?.contentType || first?.type || '').toLowerCase();
                                                                                if (ct.includes('reel')) return 'Instagram Reel';
                                                                                if (ct.includes('story')) return 'Instagram Story';
                                                                                if (ct.includes('post')) return 'Grid Post';
                                                                            }
                                                                        } catch {}
                                                                        return 'Premium Deliverable';
                                                                    })()}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-4 mt-6">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", isDark ? "bg-emerald-500/20" : "bg-emerald-100")}>
                                                                        <ShieldCheck className={cn("w-3.5 h-3.5", isDark ? "text-emerald-300" : "text-emerald-600")} />
                                                                    </div>
                                                                    <p className={cn("text-[13px] font-bold tracking-tight", isDark ? "text-emerald-300/90" : "text-emerald-700")}>
                                                                        Payment secured escrow
                                                                    </p>
                                                                </div>

                                                                {(() => {
                                                                    const deadlineRaw = selectedItem?.deadline || selectedItem?.due_date || selectedItem?.raw?.deadline || selectedItem?.raw?.due_date || null;
                                                                    const deadlineDt = deadlineRaw ? new Date(deadlineRaw) : null;
                                                                    const valid = deadlineDt && !Number.isNaN(deadlineDt.getTime());
                                                                    const now = new Date();
                                                                    const daysLeft = valid ? Math.max(0, Math.ceil((deadlineDt!.getTime() - now.getTime()) / 86400000)) : null;
                                                                    
                                                                    return (
                                                                        <div className={cn(
                                                                            "rounded-[18px] border-l-4 px-4 py-3.5 flex items-center justify-between gap-4",
                                                                            isDark ? "bg-white/5 border-rose-500/40" : "bg-slate-50 border-rose-500/20"
                                                                        )}>
                                                                            <div className="min-w-0">
                                                                                <p className={cn("text-[11px] font-black uppercase opacity-40 mb-0.5", textColor)}>Submit By</p>
                                                                                <p className={cn("text-[13px] font-bold", textColor)}>
                                                                                    {valid ? deadlineDt!.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}
                                                                                </p>
                                                                            </div>
                                                                            <div className={cn(
                                                                                "px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5",
                                                                                isDark ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700"
                                                                            )}>
                                                                                <Clock className="w-3 h-3" />
                                                                                {daysLeft !== null ? `${daysLeft}D Left` : 'Active'}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-3">
                                                    <button
                                                        type="button"
                                                        data-testid="offer-brief-accept"
                                                        onClick={() => {
                                                            if (processingDeal) return;
                                                            if (selectedItem?.isDemo) {
                                                                toast.success("This is a demo offer! Complete your profile to get real brand deals.");
                                                                triggerHaptic(HapticPatterns.success);
                                                                return;
                                                            }
                                                            handleAccept(selectedItem);
                                                        }}
                                                        className={cn(
                                                            "w-full h-[88px] rounded-[24px] px-6 flex items-center justify-between relative overflow-hidden group active:scale-[0.98] transition-all duration-300",
                                                            isDark 
                                                                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)]" 
                                                                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_15px_30px_-8px_rgba(37,99,235,0.3)]"
                                                        )}
                                                    >
                                                        <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                                                        <div className="absolute top-0 right-0 p-3 opacity-10 rotate-12 group-hover:rotate-45 transition-transform">
                                                            <Zap className="w-16 h-16 text-white" />
                                                        </div>
                                                        
                                                        <div className="text-left relative z-10">
                                                            <p className="text-[20px] font-black leading-tight tracking-tight">Accept Deal {renderBudgetValue(selectedItem)}</p>
                                                            <p className="text-[13px] font-bold opacity-80 mt-1 flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                Contract generated instantly
                                                            </p>
                                                        </div>
                                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md relative z-10">
                                                            <ChevronRight className="w-6 h-6 text-white" />
                                                        </div>
                                                    </button>

                                                    <div className="grid grid-cols-1 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                toast.message('Ask Brand Question', { description: 'Open messages or contact the brand from the offer thread.' });
                                                            }}
                                                            className={cn(
                                                                "w-full h-15 rounded-[20px] px-5 flex items-center justify-between border active:scale-[0.99] transition-all",
                                                                isDark ? "bg-[#151922] border-white/5 text-foreground hover:bg-white/5" : "bg-slate-50 border-slate-200 text-slate-900"
                                                            )}
                                                        >
                                                            <span className="flex items-center gap-3">
                                                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-white")}>
                                                                    <MessageSquare className="w-4.5 h-4.5" />
                                                                </div>
                                                                <span className="font-black text-[14px]">Ask Question</span>
                                                            </span>
                                                            <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Messages</p>
                                                        </button>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    triggerHaptic();
                                                                    toast.message('Counter Offer', { description: 'Open offer details to counter.' });
                                                                }}
                                                                className={cn(
                                                                    "h-15 rounded-[20px] border font-black text-[14px] active:scale-[0.99] transition-all flex items-center justify-center gap-2",
                                                                    isDark ? "bg-[#151922] border-blue-500/20 text-blue-400 hover:bg-blue-500/5" : "bg-white border-blue-200 text-blue-600"
                                                                )}
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                                Counter
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    triggerHaptic(HapticPatterns.error);
                                                                    if (selectedItem?.isDemo) {
                                                                        toast.message('This is a demo offer', { description: 'Decline is disabled for demo.' });
                                                                        return;
                                                                    }
                                                                    if (onDeclineRequest) {
                                                                        try { await onDeclineRequest(selectedItem); } catch { }
                                                                    }
                                                                    closeItemDetail();
                                                                }}
                                                                className={cn(
                                                                    "h-15 rounded-[20px] border font-black text-[14px] active:scale-[0.99] transition-all flex items-center justify-center gap-2",
                                                                    isDark ? "bg-[#151922] border-rose-500/20 text-rose-400 hover:bg-rose-500/5" : "bg-white border-rose-200 text-rose-600"
                                                                )}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={cn("rounded-[28px] border p-4 mb-6", cardBgColor, borderColor)}>
                                                <div className={cn(
                                                    "rounded-[22px] border overflow-hidden p-0",
                                                    isDark ? "bg-[#151922] border-[#293342]" : "bg-white border-[#E5E7EB]"
                                                )}>
                                                    <div className="p-4">
                                                        <div className={cn("w-full h-52 sm:h-64 rounded-[20px] overflow-hidden", isDark ? "bg-card" : "bg-slate-100")}>
                                                            {(() => {
                                                                const src = resolveCreatorDealProductImage(selectedItem) || 'https://images.unsplash.com/photo-1524169358666-79f22534bc6b?auto=format&fit=crop&q=80&w=1200';
                                                                return <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />;
                                                            })()}
                                                        </div>
                                                        
                                                        <div className="mt-5 space-y-5">
                                                            <div className="flex items-center justify-between">
                                                                <div className={cn(
                                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.12em] border shadow-sm",
                                                                    isDark ? "bg-emerald-500/12 text-emerald-300 border-emerald-400/20" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                )}>
                                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                                    Active Collaboration
                                                                </div>
                                                                <div className={cn("flex items-center gap-1.5 text-[12px] font-bold opacity-40", textColor)}>
                                                                    <Package className="w-3.5 h-3.5" />
                                                                    #{selectedItem.id?.slice(0, 8).toUpperCase()}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-end justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <p className={cn("text-[38px] leading-none font-black tracking-tight", textColor)}>
                                                                        {renderBudgetValue(selectedItem)}
                                                                    </p>
                                                                    <p className={cn("text-[14px] font-bold mt-1.5 opacity-40 uppercase tracking-widest", textColor)}>Campaign Reward</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={cn("text-[13px] font-black flex items-center justify-end gap-1.5 mb-2", textColor)}>
                                                                        {(() => {
                                                                            const raw = selectedItem.deliverables || selectedItem.raw?.deliverables;
                                                                            let items: string[] = ['1 Reel', '2 Stories'];
                                                                            try {
                                                                                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                                                if (Array.isArray(parsed) && parsed.length > 0) {
                                                                                    items = parsed.map((d: any) => {
                                                                                        if (typeof d === 'string') return d;
                                                                                        const ct = (d.contentType || d.type || '').toLowerCase();
                                                                                        const count = d.count || d.quantity || 1;
                                                                                        let emoji = '', label = 'Content';
                                                                                        if (ct.includes('reel')) { emoji = '🎬'; label = 'Reel'; }
                                                                                        else if (ct.includes('story')) { emoji = '📱'; label = 'Stories'; }
                                                                                        else if (ct.includes('post')) { emoji = '🖼'; label = 'Post'; }
                                                                                        return `${emoji} ${count} ${label}`;
                                                                                    });
                                                                                }
                                                                            } catch (_) {}
                                                                            return items.map((d, i) => (
                                                                                <React.Fragment key={i}>
                                                                                    <span>{d}</span>
                                                                                    {i < items.length - 1 && <span className="opacity-20 px-0.5">•</span>}
                                                                                </React.Fragment>
                                                                            ));
                                                                        })()}
                                                                    </div>
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <CheckCircle2 className={cn("w-3.5 h-3.5", isDark ? "text-emerald-300" : "text-emerald-500")} />
                                                                        <p className={cn("text-[11px] font-bold", isDark ? "text-emerald-300" : "text-emerald-600")}>Payment Secured</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}


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
	                                        {selectedType !== 'offer' && (
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
	                                        )}

	                                        {/* ── PRODUCT PREVIEW (IF BARTER) ── */}
	                                        {selectedType !== 'offer' && selectedRequiresShipping && (
	                                            <div className="mb-6">
	                                                <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Product Included</h4>
	                                                <div className={cn("rounded-xl border p-3 flex items-center gap-4", isDark ? "bg-card border-border" : "bg-background border-border")}>
<div className="w-20 h-20 rounded-xl bg-warning shrink-0 overflow-hidden border border-black/5">
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
                                                                ? "bg-primary/15 text-primary border-primary/20"
                                                                : selectedShippingStatus === 'shipped'
                                                                    ? "bg-sky-50 text-sky-600 border-sky-200"
                                                                    : selectedShippingStatus === 'issue_reported'
                                                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                                                        : "bg-amber-50 text-amber-600 border-amber-200"
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
                                                                href="/creator-dashboard?tab=deals"
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
                                                                                ? "bg-primary/15 text-primary border-primary/20"
                                                                                : hasContract
                                                                                    ? "bg-sky-50 text-sky-600 border-sky-200"
                                                                                    : "bg-amber-50 text-amber-600 border-amber-200"
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
                                                                                isDark ? "bg-card text-white border-white/20" : "bg-background text-foreground border-border"
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
                                                isDark ? "bg-primary/5 border-primary/20" : "bg-emerald-50 border-emerald-200"
                                            )}>
                                                <div className="absolute inset-y-0 left-0 w-1.5 bg-primary rounded-r-full" />
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

                                                <div className="flex items-center gap-3 relative">
                                                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
                                                        <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("font-black text-[14px] leading-tight", isDark ? "text-primary" : "text-emerald-700")}>Protected by Creator Armour</p>
                                                        <p className={cn("text-[11px] font-semibold mt-0.5", isDark ? "text-primary/70" : "text-emerald-600")}>Contract + rights + dispute support</p>
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
                                                            <span className={cn("text-[12px] font-bold", isDark ? "text-primary/85" : "text-emerald-700/90")}>{t}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

	                                        {/* ── EARNINGS BREAKDOWN (Offers) ── */}
	                                        {false && selectedType === 'offer' && (
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
                                    {selectedType !== 'offer' && (
                                    <div className={cn(
                                        "px-5 pb-8 pt-4 border-t z-20",
                                        isDark ? "bg-[#0B0F14]/98 backdrop-blur-xl border-border" : "bg-white border-border shadow-[0_-8px_40px_rgba(0,0,0,0.06)]"
                                    )}>
                                        <div className="max-w-md mx-auto">
                                            <motion.button
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => {
                                                    if (processingDeal) return;
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
                                                        void handleProgressStageSelect('content_making');
                                                        return;
                                                    }

                                                    if (cta.action === 'view_contract') {
                                                        contractSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        return;
                                                    }

                                                    setShowProgressSheet(true);
                                                }}
                                                disabled={processingDeal === selectedItem.id || getDealPrimaryCta({ role: 'creator', deal: selectedItem }).disabled}
                                                className={cn(
                                                    "w-full py-4 rounded-2xl shadow-xl transition-all flex flex-col items-center justify-center active:scale-[0.98] border disabled:opacity-50",
                                                    dealPrimaryCtaButtonClass(getDealPrimaryCta({ role: 'creator', deal: selectedItem }).tone),
                                                    !isDark && "border-white/20"
                                                )}
                                            >
                                                {processingDeal === selectedItem.id ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <span className="text-[17px] font-black tracking-tight">
                                                        {getDealPrimaryCta({ role: 'creator', deal: selectedItem }).label}
                                                    </span>
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>
                                    )}

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
                            <div 
                                className="sticky top-0 z-[110] px-5 border-b border-white/[0.03]"
                                style={{ background: isDark ? 'rgba(11,15,20,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(30px)', paddingTop: 'max(env(safe-area-inset-top), 20px)' }}
                            >
                                <div className="max-w-md mx-auto flex items-center justify-between py-4">
                                    <div className="flex items-center gap-4">
                                        <button type="button"
                                            onClick={() => { triggerHaptic(); setSelectedPayment(null); }}
                                            className={cn("w-10 h-10 rounded-2xl border flex items-center justify-center transition-all active:scale-90", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}
                                        >
                                            <ChevronRight className={cn("w-5 h-5 rotate-180", isDark ? "text-white/60" : "text-slate-600")} />
                                        </button>
                                        <div>
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-0.5 opacity-30", textColor)}>Earnings</p>
                                            <h2 className={cn("text-[17px] font-bold tracking-tight", textColor)}>Payment Detail</h2>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider",
                                        isPaid
                                            ? (isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600 border-emerald-100")
                                            : (isDark ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 text-rose-600 border-rose-100")
                                    )}>
                                        {isPaid ? 'Completed' : 'Pending'}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-40 space-y-6">

                                {/* ── BRAND IDENTITY BANNER ── */}
                                <div className="relative mb-4">
                                    <div className={cn(
                                        "relative h-32 rounded-[2.5rem] overflow-hidden mb-[-40px] z-0 px-8 py-5 flex flex-col justify-end",
                                        isDark ? "bg-white/[0.03] border border-white/5" : "bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200"
                                    )}>
                                        <div className={cn("absolute inset-0 opacity-10 filter blur-3xl mix-blend-overlay", isPaid ? "bg-emerald-400" : "bg-blue-400")} />
                                        <p className={cn("relative z-10 text-[9px] font-black uppercase tracking-[0.3em] mb-1 opacity-30", textColor)}>
                                            Collaborator
                                        </p>
                                    </div>

                                    <div className="relative px-6 flex items-end gap-5 z-10">
                                        <div className={cn(
                                            "w-24 h-24 rounded-[2rem] p-1 shadow-2xl",
                                            isDark ? "bg-[#0B0F14] ring-4 ring-[#0B0F14]" : "bg-white ring-4 ring-[#F9FAFB]"
                                        )}>
                                            <div className={cn(
                                                "w-full h-full rounded-[1.75rem] overflow-hidden border flex items-center justify-center",
                                                isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
                                            )}>
                                                {getBrandIcon(pay.brand_logo_url || pay.brand_logo || pay.logo_url || pay.raw?.brand_logo_url || pay.raw?.brand_logo, pay.category, pay.brand_name)}
                                            </div>
                                        </div>
                                        <div className="pb-2 flex-1 min-w-0">
                                            <h2 className={cn("text-[20px] font-bold truncate tracking-tight mb-0.5", textColor)}>
                                                {pay.brand_name || 'Brand'}
                                            </h2>
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck className={cn("w-3.5 h-3.5", isPaid ? "text-emerald-500" : "text-blue-500")} strokeWidth={2.5} />
                                                <span className={cn("text-[12px] font-black uppercase tracking-widest opacity-40", textColor)}>Verified Partner</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── PAYMENT STATUS CARD ── */}
                                <div className={cn(
                                    "rounded-[2.5rem] border p-6 relative overflow-hidden transition-all duration-500",
                                    isPaid
                                        ? (isDark ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-emerald-50/50 border-emerald-100 shadow-sm")
                                        : (isDark ? "bg-blue-500/[0.03] border-blue-500/10" : "bg-blue-50/50 border-blue-100 shadow-sm")
                                )}>
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        {isPaid ? <Check className="w-16 h-16" /> : <Clock className="w-16 h-16" />}
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={cn(
                                                "w-8 h-8 rounded-xl flex items-center justify-center",
                                                isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {isPaid ? <Landmark className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            </div>
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-40", textColor)}>
                                                {isPaid ? 'Payment Received' : 'Schedule Expected'}
                                            </p>
                                        </div>

                                        <p className={cn("text-4xl font-black tracking-tighter mb-1", textColor)}>
                                            {renderBudgetValue(pay)}
                                        </p>
                                        
                                        {isPaid ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <p className={cn("text-[13px] font-bold opacity-60", textColor)}>Settled on {dueDateStr}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", daysPast > 0 ? "bg-rose-500 animate-pulse" : "bg-blue-500")} />
                                                    <p className={cn("text-[13px] font-bold opacity-60", textColor)}>Due by {dueDateStr}</p>
                                                </div>
                                                {daysPast > 0 && (
                                                    <span className="inline-block px-3 py-1 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-wider border border-rose-500/20">
                                                        {daysPast} Day{daysPast > 1 ? 's' : ''} Overdue
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── DEAL BREAKDOWN ── */}
                                <div className="space-y-3">
                                    <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-4 opacity-30", textColor)}>Campaign Intel</p>
                                    <div className={cn(
                                        "rounded-[2.5rem] border overflow-hidden p-2 divide-y",
                                        isDark ? "bg-white/[0.02] border-white/5 divide-white/5 shadow-2xl" : "bg-white border-slate-100 divide-slate-50 shadow-xl shadow-slate-200/40"
                                    )}>
                                        {[
                                            { label: 'Deliverables', value: pay.deliverables_summary || '1 Instagram Reel', icon: <FileText /> },
                                            { label: 'Agreement Type', value: pay.collab_type === 'barter' ? '🎁 Product Exchange' : '💰 Paid Partnership', icon: <Handshake /> },
                                            { label: 'Payment Method', value: pay.payment_terms || 'Direct Bank/UPI', icon: <CreditCard /> },
                                            { label: 'Invoice Reference', value: invoiceId, icon: <LayoutDashboard /> },
                                        ].map((row, i) => (
                                            <div key={i} className={cn("flex items-center gap-4 px-4 py-4 rounded-[2rem] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-slate-50/50")}>
                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-white/5 border-white/5 text-white/40" : "bg-slate-50 border-slate-100 text-slate-400")}>
                                                    {React.cloneElement(row.icon as React.ReactElement, { size: 18, strokeWidth: 1.5 })}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-30", textColor)}>{row.label}</p>
                                                    <p className={cn("text-[14px] font-black truncate", textColor)}>{row.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── TIMELINE ── */}
                                <div className="space-y-4">
                                    <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-4 opacity-30", textColor)}>Lifecycle</p>
                                    <div className={cn(
                                        "rounded-[2.5rem] border p-6",
                                        isDark ? "bg-white/[0.02] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40"
                                    )}>
                                        <div className="space-y-0">
                                            {timelineSteps.map((step, i) => (
                                                <div key={i} className="flex items-start gap-5">
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            "w-7 h-7 rounded-[0.8rem] flex items-center justify-center shrink-0 text-[11px] font-black border transition-all duration-500",
                                                            step.done
                                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                                : step.warn
                                                                    ? "bg-rose-500/10 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                                                                    : step.active
                                                                        ? "bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"
                                                                        : (isDark ? "bg-white/5 border-white/10 text-white/20" : "bg-slate-50 border-slate-200 text-slate-300")
                                                        )}>
                                                            {step.done ? <Check className="w-4 h-4 stroke-[3]" /> : step.warn ? '!' : step.active ? <Clock className="w-4 h-4 animate-spin-slow" /> : '·'}
                                                        </div>
                                                        {i < timelineSteps.length - 1 && (
                                                            <div className={cn("w-0.5 h-8 my-1 rounded-full", step.done ? "bg-emerald-500/30" : (isDark ? "bg-white/5" : "bg-slate-100"))} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-[14px] font-bold mt-1",
                                                            step.active ? "text-primary" : step.done ? (isDark ? "text-white/80" : "text-slate-800") : "opacity-30"
                                                        )}>
                                                            {step.label}
                                                        </p>
                                                        {step.active && <p className="text-[11px] font-black text-primary/60 uppercase tracking-widest mt-0.5">Current Phase</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── CONTRACT ── */}
                                <div className={cn(
                                    "rounded-[2.5rem] border p-6 relative overflow-hidden transition-all duration-500",
                                    isDark ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-emerald-50/50 border-emerald-100 shadow-sm"
                                )}>
                                    <div className="absolute top-[-20px] right-[-20px] opacity-5">
                                        <ShieldCheck className="w-24 h-24" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className={cn("text-[14px] font-black leading-tight", isDark ? "text-emerald-400" : "text-emerald-700")}>Creator Armour Protected</p>
                                            <p className={cn("text-[11px] font-semibold opacity-60", textColor)}>Content Rights Agreement</p>
                                        </div>
                                    </div>
                                    <button type="button"
                                        onClick={() => { triggerHaptic(); import('sonner').then(m => m.toast('Contract download coming soon')); }}
                                        className={cn(
                                            "w-full py-4 rounded-[1.5rem] text-[13px] font-black border flex items-center justify-center gap-2 active:scale-[0.98] transition-all",
                                            isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100/50"
                                        )}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Contract PDF
                                    </button>
                                </div>

                                {/* ── PAYMENT METADATA ── */}
                                <div className="space-y-3">
                                    <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-4 opacity-30", textColor)}>Transaction Log</p>
                                    <div className={cn(
                                        "rounded-[2.5rem] border overflow-hidden p-2 divide-y",
                                        isDark ? "bg-white/[0.02] border-white/5 divide-white/5 shadow-2xl" : "bg-white border-slate-100 divide-slate-50 shadow-xl shadow-slate-200/40"
                                    )}>
                                        {[
                                            { label: 'System ID', value: invoiceId },
                                            { label: 'Settlement Node', value: pay.payment_terms || 'Direct Bank/UPI' },
                                            { label: 'Signed/Verified', value: signedDateStr },
                                            { label: 'Escrow Coverage', value: '✓ 100% SECURED' },
                                        ].map((row, i) => (
                                            <div key={i} className={cn("flex items-center justify-between px-5 py-4", i > 0 ? (isDark ? "border-t border-border/5" : "border-t border-border") : "")}>
                                                <span className={cn("text-[12px] font-semibold opacity-50", textColor)}>{row.label}</span>
                                                <span className={cn("text-[12px] font-black font-mono", textColor)}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── SUBMITTED CONTENT ── */}
                                {(pay.submission_link || pay.content_url) && (
                                    <div className="space-y-3">
                                        <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] px-4 opacity-30", textColor)}>Work Evidence</p>
                                        <div className={cn(
                                            "rounded-[2.5rem] border p-5 flex items-center justify-between",
                                            isDark ? "bg-white/[0.02] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner border border-indigo-500/20">
                                                    🎬
                                                </div>
                                                <div>
                                                    <p className={cn("text-[14px] font-black", textColor)}>Instagram Reel</p>
                                                    <p className={cn("text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-0.5")}>Quality Verified</p>
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
                                                isDark ? "bg-destructive/10 border-destructive/20" : "bg-destructive/10 border-destructive/20"
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

        </div>
    );
};

export default MobileDashboardDemo;
