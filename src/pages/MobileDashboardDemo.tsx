import React, { useState, useEffect, useRef } from 'react';
import {
    User, Search, ShieldCheck, Handshake, Camera,
    LayoutDashboard, CreditCard, Briefcase, Menu, Clapperboard, Instagram,
    Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, Bell, ChevronRight, Zap, Link2, CheckCircle2, Download, Clock,
    Info, Globe, Star, LogOut, Copy, Share2, QrCode, Eye, MoreHorizontal, Landmark, FileText, Smartphone, TrendingUp, BarChart3, Mail,
    MessageCircle, MessageSquare, Edit3, X, XCircle, ExternalLink, AlertCircle, AlertTriangle, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { triggerHaptic as globalTriggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import PremiumDrawer from '@/components/drawer/PremiumDrawer';
import { supabase } from '@/integrations/supabase/client';

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
}

// Minimal Status Badge for Deal Cards
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        'new': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'NEW' },
        'pending': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'AWAITING REVIEW' },
        'negotiating': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'IN NEGOTIATION' },
        'active': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'ACTIVE' },
        'completed': { bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-700 dark:text-slate-300', label: 'COMPLETED' },
    };
    const c = config[status?.toLowerCase()] ?? config['new'];
    return (
        <span className={cn('px-2.5 py-1 rounded-full text-[12px] font-semibold tracking-wider', c.bg, c.text)}>
            {c.label}
        </span>
    );
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
    if (!raw) return { city: '', pincode: '' };
    const pincodeMatch = raw.match(/\b\d{6}\b/);
    const pincode = pincodeMatch?.[0] || '';
    const city = raw
        .replace(/\b\d{6}\b/, '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .pop() || '';
    return { city, pincode };
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
        instagram_handle: profile?.instagram_handle || '',
        media_kit_url: profile?.media_kit_url || '',
        open_to_collabs: profile?.open_to_collabs ?? true,
        typical_deal_size: profile?.typical_deal_size || 'standard',
        collaboration_preference: profile?.collaboration_preference || 'Hybrid',
        avg_rate_reel: profile?.avg_rate_reel || '5000',
        content_niches: profile?.content_niches || ['Fashion', 'Tech', 'Lifestyle'],
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
    onLogout
}: MobileDashboardProps) => {
    const navigate = useNavigate();
    const signOutMutation = useSignOut();
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
    const activeTab = (searchParams.get('tab') as 'dashboard' | 'collabs' | 'payments' | 'profile') || 'dashboard';
    const setActiveTab = (tab: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    const requestIdParam = (searchParams.get('requestId') || '').trim() || null;
    const subtabParam = (searchParams.get('subtab') as 'active' | 'pending' | null) || null;

    const [collabSubTab, setCollabSubTab] = useState<'active' | 'pending'>('active');
    const hasHandledDeepLinkRef = useRef(false);
    useEffect(() => {
        if (activeTab !== 'collabs') return;

        // Deep-link from push notifications: always show Pending and open the offer if present.
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

        if (subtabParam === 'pending') setCollabSubTab('pending');
        else if (subtabParam === 'active') setCollabSubTab('active');
    }, [activeTab, requestIdParam, subtabParam, collabRequests, searchParams, setSearchParams]);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });
    const [showItemMenu, setShowItemMenu] = useState(false);

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
        if (selectedType === 'deal') return `/creator-contracts/${itemId}`;
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
    const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
    const [showPushInstallGuide, setShowPushInstallGuide] = useState(false);
    const [processingDeal, setProcessingDeal] = React.useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [selectedType, setSelectedType] = useState<'deal' | 'offer' | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

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
    const activeDealsCount = (brandDeals || []).length;
    const pendingOffersCount = (collabRequests || []).length;

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

    React.useEffect(() => { if (!isRefreshingProp) setPullDistance(0); }, [isRefreshingProp]);
    React.useEffect(() => {
        const meta = document.querySelector('meta[name=theme-color]');
        const orig = meta?.getAttribute('content');
        meta?.setAttribute('content', bgColor);
        document.body.style.backgroundColor = bgColor;
        return () => { if (meta && orig) meta.setAttribute('content', orig); };
    }, [theme, bgColor]);

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
            const corePayload: Record<string, unknown> = {
                first_name,
                last_name,
                phone: profileFormData.phone || null,
                bio: profileFormData.bio || null,
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
            toast.error(error.message || 'Failed to sign contract');
        } finally {
            setIsSigningAsCreator(false);
        }
    };

    const toggleTheme = () => { triggerHaptic(); setTheme(p => p === 'dark' ? 'light' : 'dark'); };

    const handleAccept = async (req: any) => {
        if (!onAcceptRequest) return;
        triggerHaptic();
        setProcessingDeal(req.id);
        try { await onAcceptRequest(req); } finally { setProcessingDeal(null); }
    };

    const [showMenu, setShowMenu] = useState(false);
    const [showBrandDetails, setShowBrandDetails] = useState(false);

    const handleAction = (action: string) => {
        triggerHaptic();
        if (action === 'notifications') navigate('/notifications');
        else if (action === 'menu') { setShowMenu(true); if (onOpenMenu) onOpenMenu(); }
        else if (action === 'view_all') setActiveTab('collabs');
    };

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

        if (logo && logo.trim() && logo !== 'null' && logo !== 'undefined') {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={logo}
                        className="w-full h-full object-cover absolute inset-0 z-10"
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
                    className={cn("p-2 rounded-full transition-all", isDark ? "bg-[#1C1C1E] text-white" : "bg-white text-black shadow-sm")}
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
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider opacity-40", textColor)}>Pincode / City</p>
                                        <div className="flex gap-2">
                                            <input className={cn("w-24 bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="Pincode" value={profileFormData.pincode || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, pincode: e.target.value }))} />
                                            <input className={cn("flex-1 bg-transparent border-b py-2 outline-none font-medium text-[16px]", isDark ? "border-white/10 text-white" : "border-black/5 text-black")} placeholder="City" value={profileFormData.city || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, city: e.target.value }))} />
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
                                            <Link2 className="w-4 h-4 text-blue-500" />
                                            <input className="bg-transparent outline-none font-medium text-[16px] flex-1" placeholder="https://..." value={profileFormData.media_kit_url || ''} onChange={e => setProfileFormData((p: any) => ({ ...p, media_kit_url: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </SettingsGroup>
                            <div className="px-4 pt-4">
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
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
                            <SectionHeader title="Status" isDark={isDark} />
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

                            <SectionHeader title="Deal Size Expectations" isDark={isDark} />
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

                            <SectionHeader title="Collaboration Type" isDark={isDark} />
                            <div className="flex gap-2">
                                {['Paid', 'Barter', 'Hybrid'].map((type) => (
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

                            <SectionHeader title="Rates & Niches" isDark={isDark} />
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

                            <div className="px-4 pt-4">
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[12px] disabled:opacity-50 disabled:active:scale-100">
                                    {isSavingProfile ? 'Saving...' : 'Update Preferences'}
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
                            <div className={cn("p-6 rounded-[2.5rem] border text-center relative overflow-hidden", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E5EA] shadow-sm")}>
                                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <Globe className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className={cn("text-xl font-bold tracking-tight mb-1", textColor)}>creatorarmour.com/{username}</h3>
                                <p className={cn("text-[13px] opacity-40 mb-6", textColor)}>Your public intake storefront</p>
                                <div className="flex gap-3">
                                    <button onClick={handleCopyStorefront} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl text-[13px] active:scale-95 transition-all">Copy</button>
                                    <button onClick={() => window.open(`https://creatorarmour.com/${username}`, '_blank')} className={cn("flex-1 font-bold py-3.5 rounded-2xl text-[13px] border active:scale-95 transition-all", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}>Preview</button>
                                </div>
                            </div>
                            <SectionHeader title="Storefront Controls" isDark={isDark} />
                            <SettingsGroup isDark={isDark}>
                                <SettingsRow icon={<Info />} iconBg="bg-indigo-500" label="Bio & Headline" subtext="Your creator pitch" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('personal')} />
                                <SettingsRow icon={<Star />} iconBg="bg-amber-400" label="Featured Content" subtext="Showcase high-performing reels" isDark={isDark} textColor={textColor} hasChevron onClick={() => toast("Integration coming soon!")} />
                                <SettingsRow icon={<Link2 />} iconBg="bg-blue-500" label="Media Kit" subtext="Connect your external deck" isDark={isDark} textColor={textColor} hasChevron onClick={() => setActiveSettingsPage('personal')} />
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
                                <SettingsRow
                                    icon={<Smartphone />} iconBg="bg-emerald-500"
                                    label="UPI ID" subtext="razorpay.pratyush@icici"
                                    isDark={isDark} textColor={textColor}
                                    rightElement={<span className="text-[10px] font-black text-emerald-500">PRIMARY</span>}
                                />
                                <SettingsRow
                                    icon={<Landmark />} iconBg="bg-blue-500"
                                    label="Bank Transfer" subtext="HDFC Bank •••• 4242"
                                    isDark={isDark} textColor={textColor} hasChevron
                                />
                            </SettingsGroup>
                            <button className={cn("w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed font-bold transition-all active:scale-95", isDark ? "border-white/10 text-white" : "border-black/5 text-black")}>
                                <Zap className="w-4 h-4 text-amber-500" />
                                Add New Method
                            </button>
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
                                <p className={cn("text-sm opacity-50 leading-relaxed mb-6", textColor)}>Your identity and content ownership are secured. Brands see your 'Verified' badge, increasing trust.</p>
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
                        </div>
                    </motion.div>
                );
            case 'earnings':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.x > 50 || velocity.x > 500) { triggerHaptic(); setActiveSettingsPage(null); } }} className="pb-20 touch-pan-y">
                        <PageHeader title="Earnings & History" />
                        <div className="px-4 space-y-6">
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
                                <SettingsRow icon={<FileText />} iconBg="bg-blue-500" label="Tax Invoices (GST)" subtext="Download monthly summaries" isDark={isDark} textColor={textColor} hasChevron />
                                <SettingsRow icon={<Download />} iconBg="bg-emerald-500" label="Payout Statements" subtext="Detailed breakdown of fees" isDark={isDark} textColor={textColor} hasChevron />
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
                            <div className={cn("p-6 rounded-[2.5rem] border relative overflow-hidden", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E5EA] shadow-sm")}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-blue-500" />
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
                                    <button
                                        onClick={() => {
                                            const link = `${window.location.origin}/${username}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success('Link copied');
                                            triggerHaptic();
                                        }}
                                        className="bg-blue-600 text-white font-black py-3 rounded-xl text-[11px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                    >
                                        Copy Link
                                    </button>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            window.open(`/${username}`, '_blank');
                                        }}
                                        className={cn("flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-[11px] border active:scale-95 transition-all text-slate-500 uppercase tracking-widest", isDark ? "border-white/10" : "border-black/5")}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> Preview
                                    </button>
                                    <button
                                        onClick={() => {
                                            const link = `${window.location.origin}/${username}`;
                                            const message = encodeURIComponent(`For collaborations, submit here:\n\n${link}`);
                                            window.open(`https://wa.me/?text=${message}`, '_blank');
                                            triggerHaptic();
                                        }}
                                        className={cn("flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-[11px] border active:scale-95 transition-all uppercase tracking-widest", isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600")}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                    </button>
                                    <button
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

                            {/* Analytics Grid */}
                            <SectionHeader title="Performance Metrics" isDark={isDark} />
                            <div className="grid grid-cols-3 gap-3">
                                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2", textColor)}>Views</p>
                                    <div className={cn("text-2xl font-black font-outfit", textColor)}>274</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[10px] font-bold text-emerald-400">+12%</span>
                                    </div>
                                </div>
                                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2", textColor)}>Requests</p>
                                    <div className={cn("text-2xl font-black font-outfit", textColor)}>14</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[10px] font-bold text-emerald-400">+8%</span>
                                    </div>
                                </div>
                                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2", textColor)}>Conv.</p>
                                    <div className={cn("text-2xl font-black font-outfit", textColor)}>5.1%</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-amber-500 rotate-180" />
                                        <span className="text-[10px] font-bold text-amber-500">-2%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Trend Chart (SVG) */}
                            <div className={cn("p-6 rounded-[2.5rem] border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className={cn("text-sm font-black uppercase tracking-wider opacity-40", textColor)}>Weekly Traffic</h4>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400")}>Last 7 Days</span>
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
                            <div className={cn("p-6 rounded-[2.5rem] border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Eye className="w-4 h-4 text-blue-500" /></div>
                                            <p className={cn("text-sm font-bold", textColor)}>Profile Views</p>
                                        </div>
                                        <p className={cn("text-sm font-black font-outfit", textColor)}>843</p>
                                    </div>
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-slate-500/10" />
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Handshake className="w-4 h-4 text-amber-500" /></div>
                                            <p className={cn("text-sm font-bold", textColor)}>Started Form</p>
                                        </div>
                                        <p className={cn("text-sm font-black font-outfit", textColor)}>92</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                                            <p className={cn("text-sm font-bold", textColor)}>Completed Deals</p>
                                        </div>
                                        <p className={cn("text-sm font-black font-outfit", textColor)}>14</p>
                                    </div>
                                </div>
                                <div className={cn("mt-6 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-2")}>
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <p className="text-[10px] font-black tracking-tight text-amber-600">Brands checking profile but not converting. Try adding Audience Stats.</p>
                                </div>
                            </div>

                            {/* Optimization Tips */}
                            <SectionHeader title="Boost Your Conversions" isDark={isDark} />
                            <div className="grid grid-cols-1 gap-3">
                                <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[14px] font-bold leading-tight", textColor)}>Add Audience Stats</p>
                                        <p className={cn("text-[11px] opacity-40 mt-1", textColor)}>Brands verify niche alignment via demographics</p>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-500">+12% SCORE</span>
                                </div>
                                <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Star className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[14px] font-bold leading-tight", textColor)}>Link Top Collaborations</p>
                                        <p className={cn("text-[11px] opacity-40 mt-1", textColor)}>Showcase high-performing past brand deals</p>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-500">+8% SCORE</span>
                                </div>
                                <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-slate-100 shadow-sm")}>
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[14px] font-bold leading-tight", textColor)}>Set Rate Expectations</p>
                                        <p className={cn("text-[11px] opacity-40 mt-1", textColor)}>Filter out low-budget offers automatically</p>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-500">+5% SCORE</span>
                                </div>
                            </div>

                            {/* AI Brand Match - KILLER FEATURE */}
                            <SectionHeader title="AI Recommended Brands" isDark={isDark} />
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                                {[
                                    { name: 'boAt', logo: 'B', color: 'bg-violet-600' },
                                    { name: 'MamaEarth', logo: 'M', color: 'bg-teal-600' },
                                    { name: 'Lenskart', logo: 'L', color: 'bg-emerald-600' },
                                    { name: 'Nykaa', logo: 'N', color: 'bg-pink-600' },
                                ].map((brand, i) => (
                                    <div key={i} className={cn("w-32 shrink-0 p-4 rounded-3xl border text-center transition-all", isDark ? "bg-[#1C1C1E] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white font-black text-xl shadow-lg", brand.color)}>
                                            {brand.logo}
                                        </div>
                                        <p className={cn("text-[13px] font-black tracking-tight mb-1", textColor)}>{brand.name}</p>
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">94% Match</p>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2">
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
                                    icon={isDark ? <Sun /> : <Moon />} iconBg="bg-slate-500"
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
    };

    return (
        <div
            className={cn('fixed inset-0 z-[10000] flex justify-center overflow-hidden font-sans selection:bg-emerald-500/25')}
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
                                            {collabRequests.length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 text-[8px] font-black flex items-center justify-center text-white" style={{ borderColor: bgColor }}>
                                                    {collabRequests.length}
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
                                            Creator Dashboard
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
                                                            if (pushPermission === 'denied') {
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

                                    {/* Setup Progress -> Profile Strength */}
                                    <div className="px-5 mb-8">
                                        <div className={cn("p-6 rounded-[2.5rem] border relative overflow-hidden", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E5EA] shadow-sm")}>
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <h3 className={cn("text-[15px] font-bold tracking-tight mb-1", textColor)}>Profile Strength</h3>
                                                    <p className={cn("text-[11px] opacity-40 font-black uppercase tracking-widest", textColor)}>Get ready for brands</p>
                                                </div>
                                                <span className="text-[18px] font-black text-blue-500 font-outfit">80%</span>
                                            </div>
                                            <div className={cn("w-full h-2.5 rounded-full overflow-hidden mb-5", isDark ? "bg-white/5" : "bg-slate-100")}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-blue-500 rounded-full" />
                                            </div>

                                            <div className="mb-5">
                                                <ul className="space-y-2 opacity-80">
                                                    <li className="flex items-center gap-2.5 text-[12px] font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                        <span className={textColor}>Add Media Kit</span>
                                                    </li>
                                                    <li className="flex items-center gap-2.5 text-[12px] font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                        <span className={textColor}>Verify Identity</span>
                                                    </li>
                                                    <li className="flex items-center gap-2.5 text-[12px] font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                        <span className={textColor}>Add Audience Info</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="flex gap-2.5">
                                                <button onClick={() => setActiveSettingsPage('personal')} className={cn("w-full py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-sm", isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600")}>Complete Profile</button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Setup Progress */}
                                    <div className="px-5 mb-8">
                                        <div className={cn("p-6 rounded-[2.5rem] border relative overflow-hidden", isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E5EA] shadow-sm")}>
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <h3 className={cn("text-[15px] font-bold tracking-tight mb-1", textColor)}>Profile Strength</h3>
                                                    <p className={cn("text-[11px] opacity-40 font-black uppercase tracking-widest", textColor)}>Get ready for brands</p>
                                                </div>
                                                <span className="text-[18px] font-black text-blue-500 font-outfit">80%</span>
                                            </div>
                                            <div className={cn("w-full h-2.5 rounded-full overflow-hidden mb-5", isDark ? "bg-white/5" : "bg-slate-100")}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-blue-500 rounded-full" />
                                            </div>

                                            <div className="mb-5">
                                                <ul className="space-y-2 opacity-80">
                                                    <li className="flex items-center gap-2.5 text-[12px] font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                        <span className={textColor}>Add Media Kit</span>
                                                    </li>
                                                    <li className="flex items-center gap-2.5 text-[12px] font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                        <span className={textColor}>Verify Identity</span>
                                                    </li>
                                                    <li className="flex items-center gap-2.5 text-[12px] font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                        <span className={textColor}>Add Audience Info</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="flex gap-2.5">
                                                <button onClick={() => setActiveSettingsPage('personal')} className={cn("w-full py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-sm", isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600")}>Complete Profile</button>
                                            </div>
                                        </div>
                                    </div>

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
                                                    : "bg-emerald-600 from-emerald-600 via-teal-500 to-blue-700"
                                            )}
                                        >
                                            {/* Decorative elements */}
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl home-card-glow" />

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between text-white/90 mb-3">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Monthly Revenue</span>
                                                    <Zap className="w-4 h-4 fill-white text-white opacity-80" />
                                                </div>
                                                <div className="text-4xl font-black text-white mb-6 flex items-baseline gap-1 font-outfit">
                                                    <span className="text-2xl font-bold opacity-70">₹</span>
                                                    <AnimatedCounter value={monthlyRevenue} />
                                                </div>
                                                <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-xl bg-black/10 backdrop-blur-md border border-white/10 w-fit">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center border border-emerald-400/30">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-white tracking-[0.15em] uppercase">Secured by Armour</span>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Row 2: Active & Pending Deals (Side by side) */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setActiveTab('collabs');
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
                                                    setActiveTab('collabs');
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
                                                isDark ? "bg-slate-900 border-white/5" : "bg-white border-slate-100 shadow-sm"
                                            )}
                                        >
                                            {/* Simple animated background element */}
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                                <Link2 size={120} />
                                            </div>

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                                    <Link2 className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <h3 className={cn("text-[15px] font-bold tracking-tight", textColor)}>Promote Collab Link</h3>
                                                    <p className={cn("text-[11px] opacity-40 uppercase font-black tracking-widest", textColor)}>Quick Share Tools</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2.5">
                                                <button
                                                    onClick={handleCopyStorefront}
                                                    className={cn(
                                                        "flex-1 flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]",
                                                        isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm"
                                                    )}
                                                >
                                                    <Copy className="w-4 h-4 mb-2 opacity-60" />
                                                    <span className={cn("text-[11px] font-bold font-outfit", textColor)}>Copy Bio Link</span>
                                                </button>
                                                <button
                                                    onClick={handleCopyDMReply}
                                                    className={cn(
                                                        "flex-1 flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]",
                                                        isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm"
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
                                    <h2 className={cn('text-[16px] font-medium tracking-tight', textColor)}>Active Brand Offers</h2>
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
                                        const displayOffers = collabRequests.length > 0 ? collabRequests : [fakeDemoOffer];
                                        return (
                                            <div className="space-y-10">
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
                                                    if (req.deadline) {
                                                        const dDate = new Date(req.deadline);
                                                        const diffDays = Math.ceil((dDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        deadlineText = diffDays > 0 ? `${diffDays}d left` : 'Past Due';
                                                    }

                                                    // Mock/Get ID and time

                                                    return (
                                                        <motion.div
                                                            key={req.id || idx}
                                                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                setSelectedItem(req);
                                                                setSelectedType('offer');
                                                            }}
                                                            className={cn(
                                                                'rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.99] relative',
                                                                isDark
                                                                    ? 'bg-[#0F172A]/80 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600'
                                                                    : 'bg-white border-slate-200 shadow-lg hover:shadow-xl hover:border-slate-300'
                                                            )}
                                                        >
                                                            {/* Collab type accent strip */}
                                                            <div className={cn("h-[4px] w-full", req.collab_type === 'barter' ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-600')} />

                                                            {req.isDemo && (
                                                                <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2.5 flex flex-col items-center justify-center gap-1">
                                                                    <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-1.5"><Zap className="w-3 h-3 fill-blue-500" /> Interactive Demo Offer</span>
                                                                    <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium text-center">This is a sample deal so you can understand how Creator Armour works.</span>
                                                                </div>
                                                            )}

                                                            <div className="px-5 py-4">
                                                                {/* Row 1: Logo + Brand name + type tag + Budget */}
                                                                <div className="flex items-start gap-3 mb-3">
                                                                    {/* Logo with gradient border based on type */}
                                                                    <div className={cn(
                                                                        "w-12 h-12 rounded-xl border overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105",
                                                                        req.collab_type === 'barter'
                                                                            ? (isDark ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30" : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200")
                                                                            : (isDark ? "bg-gradient-to-br from-blue-500/10 to-violet-500/10 border-violet-500/30" : "bg-gradient-to-br from-blue-50 to-violet-50 border-violet-200")
                                                                    )}>
                                                                        {getBrandIcon(req.brand_logo || req.raw?.brand_logo_url || req.raw?.logo_url, req.category, req.brand_name)}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        {/* Brand name + type badge */}
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className={cn("text-[15px] font-bold leading-tight truncate", isDark ? "text-white" : "text-slate-900")}>
                                                                                {(req.brand_name || 'Brand').replace(/\s*\(Barter Demo\)\s*/i, '').replace(/\s*\(Demo\)\s*/i, '')}
                                                                            </p>
                                                                            {req.collab_type === 'barter' ? (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-500 border border-amber-500/20">
                                                                                    🎁 Barter
                                                                                </span>
                                                                            ) : req.collab_type === 'hybrid' ? (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-500 border border-violet-500/15">
                                                                                    🤝 Hybrid
                                                                                </span>
                                                                            ) : req.collab_type === 'affiliate' ? (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-500 border border-emerald-500/15">
                                                                                    📈 Affiliate
                                                                                </span>
                                                                            ) : (
                                                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-blue-500 border border-blue-500/15">
                                                                                    💳 Paid
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {/* Category + Verified */}
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={cn("text-[12px] font-medium", secondaryTextColor)}>{req.category || 'Lifestyle'}</span>
                                                                            <span className="text-slate-500 text-[9px]">•</span>
                                                                            <div className="flex items-center gap-0.5">
                                                                                <ShieldCheck className="w-3 h-3 text-blue-500" strokeWidth={2.5} />
                                                                                <span className={cn("text-[11px] font-semibold text-blue-500", isDark ? "text-blue-400" : "text-blue-600")}>Verified</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Budget — more prominent */}
                                                                    <div className="shrink-0 text-right">
                                                                        <p className={cn("text-[20px] font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                                            {req.exact_budget ? formatCurrency(req.exact_budget)
                                                                                : req.barter_value ? `₹${(req.barter_value / 1000).toFixed(0)}K`
                                                                                    : (req.budget_range || '₹75K')}
                                                                        </p>
                                                                        <p className={cn("text-[9px] font-bold uppercase tracking-widest", req.collab_type === 'barter' ? "text-amber-500" : (isDark ? "text-slate-500" : "text-slate-400"))}>
                                                                            {req.collab_type === 'barter' ? 'Product Val.' : 'Cash'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Row 2: Deliverables + Deadline */}
                                                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                                    {deliverablesArr.map((d, i) => (
                                                                        <span key={i} className={cn(
                                                                            "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                                                            isDark ? "bg-slate-800/50 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                                                                        )}>
                                                                            {d}
                                                                        </span>
                                                                    ))}
                                                                    <span className={cn(
                                                                        "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all",
                                                                        isDark ? "bg-slate-800/50 border-slate-700/50 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                                                                    )}>
                                                                        📅 {req.deadline ? new Date(req.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '21 Mar'}
                                                                    </span>
                                                                    {deadlineText && (
                                                                        <span className={cn(
                                                                            "px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all animate-pulse",
                                                                            isDark ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-400" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-600"
                                                                        )}>
                                                                            ⚡{deadlineText}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Row 3: Action buttons */}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); triggerHaptic(); setSelectedItem(req); setSelectedType('offer'); }}
                                                                        className={cn(
                                                                            "flex-1 h-11 rounded-xl font-semibold text-[12px] border transition-all active:scale-[0.96]",
                                                                            isDark
                                                                                ? "border-slate-600/50 text-slate-300 hover:bg-white/5 hover:border-slate-500 bg-slate-800/30"
                                                                                : "border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
                                                                        )}
                                                                    >
                                                                        Details
                                                                    </button>
                                                                    <button
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
                                                                            "flex-1 h-11 rounded-xl font-bold text-[12px] text-white transition-all flex items-center justify-center gap-1.5 active:scale-[0.96] disabled:opacity-50 shadow-lg",
                                                                            req.collab_type === 'barter'
                                                                                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25"
                                                                                : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-blue-500/25"
                                                                        )}
                                                                    >
                                                                        {processingDeal === req.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                {req.collab_type === 'barter' ? '🎁 Accept Product Collab' : req.collab_type === 'hybrid' ? '🤝 Accept Hybrid Deal' : 'Accept Deal'}
                                                                                <ArrowRight className="w-3.5 h-3.5" />
                                                                            </>
                                                                        )}
                                                                    </button>
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

                    {/* ─── COLLABS TAB ─── */}
                    {activeTab === 'collabs' && (
                        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {/* Toggle Header (hide when viewing an offer/deal brief) */}
                            {!selectedItem && (
                                <div className={cn(
                                    "sticky top-0 z-20 -mx-5 px-5 pt-2 pb-4 mb-6",
                                    isDark ? "bg-[#061318]/70 backdrop-blur-xl border-b border-white/10" : "bg-white/80 backdrop-blur-xl border-b border-slate-100"
                                )}>
                                    <div className={cn("flex p-1.5 rounded-2xl", isDark ? "bg-white/5" : "bg-slate-100")}>
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
                                                    : cn("opacity-40", textColor)
                                            )}
                                        >
                                            Active ({activeDealsCount})
                                        </button>
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
                                                    : cn("opacity-40", textColor)
                                            )}
                                        >
                                            Pending ({pendingOffersCount})
                                        </button>
                                    </div>
                                </div>
                            )}

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
                                                {brandDeals.slice(0, 10).map((deal: any, idx: number) => {
                                                    const startedDays = 2 + (idx % 5);
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            drag="x"
                                                            dragConstraints={{ left: -100, right: 0 }}
                                                            dragElastic={0.1}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                setSelectedItem(deal);
                                                                setSelectedType('deal');
                                                            }}
                                                            className={cn(
                                                                "p-4 rounded-2xl border transition-all duration-200 group active:scale-[0.99] hover:-translate-y-[1px] relative",
                                                                borderColor,
                                                                isDark ? "bg-white/5 active:bg-white/10" : "bg-white shadow-sm active:bg-slate-50"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-sm">
                                                                        {getBrandIcon(deal.brand_logo_url || deal.logo_url, deal.category, deal.brand_name)}
                                                                    </div>
                                                                    <h4 className={cn("text-[15px] font-bold tracking-tight", textColor)}>{deal.brand_name}</h4>
                                                                </div>
                                                                <div className={cn("text-[15px] font-bold font-outfit", isDark ? "text-white" : "text-slate-900")}>
                                                                    ₹{(deal.deal_amount || deal.exact_budget || 12500).toLocaleString()}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 ml-[52px] mb-4">
                                                                <div className="flex items-center gap-1 bg-slate-500/5 px-2 py-0.5 rounded-full border border-slate-500/10">
                                                                    <Instagram className="w-2.5 h-2.5 text-pink-500" />
                                                                    <span className={cn("text-[10px] font-bold", isDark ? "text-slate-300" : "text-slate-600")}>1 Reel + 1 Post</span>
                                                                </div>
                                                                <span className={cn("text-[11px] opacity-20", textColor)}>•</span>
                                                                <span className={cn("text-[11px] font-medium opacity-50", textColor)}>Started {startedDays}d ago</span>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-500/10">
                                                                <div className={cn(
                                                                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                                    ((deal.status || '').toLowerCase() === 'signed_pending_creator' || (deal.status || '').toLowerCase() === 'sent' || (deal.status || '').toLowerCase() === 'signed_by_brand')
                                                                        ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                                                                        : (isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")
                                                                )}>
                                                                    {((deal.status || '').toLowerCase() === 'signed_pending_creator' || (deal.status || '').toLowerCase() === 'sent' || (deal.status || '').toLowerCase() === 'signed_by_brand') ? 'Needs Signature' : 'In Progress'}
                                                                </div>

                                                                <div className="flex gap-1">
                                                                    {[1, 2, 3, 4].map(step => (
                                                                        <div
                                                                            key={step}
                                                                            className={cn(
                                                                                "w-6 h-1 rounded-full",
                                                                                step <= 1 ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" : (isDark ? "bg-white/10" : "bg-slate-200")
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
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
                                ) : (
                                    <motion.div
                                        key="pending"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        {pendingOffersCount > 0 ? (
                                            <div className="space-y-4">
                                                {collabRequests.slice(0, 10).map((req: any, idx: number) => {
                                                    const expiresDays = 2 + (idx % 3);
                                                    const amount = req.deal_amount || req.exact_budget || (idx === 0 ? 8000 : idx === 1 ? 15000 : idx === 2 ? 12000 : 5000);

                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            whileTap={{ scale: 0.983 }}
                                                            onClick={() => {
                                                                triggerHaptic();
                                                                setSelectedItem(req);
                                                                setSelectedType('offer');
                                                            }}
                                                            className={cn(
                                                                "p-4 rounded-2xl border transition-all duration-300 group active:scale-[0.99] relative",
                                                                borderColor,
                                                                isDark
                                                                    ? "bg-[#111827]/40 hover:bg-[#111827]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                                                    : "bg-white shadow-sm hover:shadow-md active:bg-slate-50"
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300">
                                                                        {getBrandIcon(req.brand_logo_url || req.logo_url, req.category, req.brand_name)}
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
                                                                    <p className={cn("text-xl font-bold font-outfit tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                                                        ₹{amount.toLocaleString()}
                                                                    </p>
                                                                    <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-30 mt-0.5", textColor)}>Budget</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                                <div className="flex items-center gap-1.5 bg-slate-500/5 px-2.5 py-1 rounded-lg border border-slate-500/10">
                                                                    <Instagram className="w-3 h-3 text-pink-500" />
                                                                    <span className={cn("text-[10px] font-black uppercase tracking-wider", isDark ? "text-slate-300" : "text-slate-700")}>1 Reel</span>
                                                                </div>
                                                                <div className={cn(
                                                                    "flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-lg border",
                                                                    isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-500/10 text-amber-700"
                                                                )}>
                                                                    <Zap className="w-3 h-3 fill-current" />
                                                                    <span className="text-[10px] font-bold">{expiresDays} Days Left</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-slate-500/10">
                                                                <div className={cn(
                                                                    "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                                    isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                                                                )}>
                                                                    Action Required
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <button className={cn("px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all")}>
                                                                        Accept Offer
                                                                    </button>
                                                                </div>
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

                                            <SectionHeader title="Account" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<User />} iconBg="bg-blue-500"
                                                    label="Personal Information"
                                                    subtext="Creator Identity & Legal details"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('personal')}
                                                />
                                                <SettingsRow
                                                    icon={<FileText />} iconBg="bg-emerald-500"
                                                    label="Public Portfolio"
                                                    subtext="What brands see on your link"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('portfolio')}
                                                />
                                                <SettingsRow
                                                    icon={<Target />} iconBg="bg-amber-400"
                                                    label="Collab Preferences"
                                                    subtext="Deal sizes, niches & rates"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('collab-preferences')}
                                                />
                                                <SettingsRow
                                                    icon={<Link2 />} iconBg="bg-violet-500"
                                                    label="Collab Link"
                                                    subtext="Manage intake control center"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('collab-link')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="Preferences" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={isDark ? <Sun /> : <Moon />} iconBg="bg-slate-500"
                                                    label="Dark Mode"
                                                    subtext="System default or custom"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('dark-mode')}
                                                />
                                                <SettingsRow
                                                    icon={<Bell />} iconBg="bg-rose-500"
                                                    label="Notifications"
                                                    subtext="Alerts, contracts & payments"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('notifications')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="Payments" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<Landmark />} iconBg="bg-indigo-500"
                                                    label="Payout Methods"
                                                    subtext="Manage UPI & bank accounts"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('payouts')}
                                                />
                                                <SettingsRow
                                                    icon={<CreditCard />} iconBg="bg-cyan-500"
                                                    label="Earnings & History"
                                                    subtext="Financial performance audit"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('earnings')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="Security" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<ShieldCheck />} iconBg="bg-blue-600"
                                                    label="Armour Verification"
                                                    subtext="Trust features & fraud protection"
                                                    isDark={isDark} textColor={textColor}
                                                    onClick={() => setActiveSettingsPage('verification')}
                                                />
                                            </SettingsGroup>

                                            <SectionHeader title="About" isDark={isDark} />
                                            <SettingsGroup isDark={isDark}>
                                                <SettingsRow
                                                    icon={<Info />} iconBg="bg-slate-400"
                                                    label="About Creator Armour"
                                                    subtext="Version 2.4.1 • Support"
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
                                <button className={cn("p-2.5 rounded-xl border flex items-center justify-center", cardBgColor, borderColor)}>
                                    <Download className={cn("w-5 h-5", secondaryTextColor)} />
                                </button>
                            </div>

                            {/* Main Highlight: Pending Amount */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className={cn(
                                    "py-8 px-8 rounded-[2.5rem] shadow-xl shadow-orange-500/20 border-0 mb-6 bg-gradient-to-br relative overflow-hidden",
                                    isDark
                                        ? "from-amber-400 via-orange-500 to-rose-600"
                                        : "bg-orange-600 from-orange-600 via-rose-500 to-purple-700"
                                )}
                            >
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between text-white/90 mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 text-white">Pending Amount</span>
                                        <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                                            <Clock className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-black text-white mb-6 flex items-baseline gap-1 font-outfit">
                                        <span className="text-2xl font-bold opacity-70">₹</span>
                                        <AnimatedCounter value={brandDeals.reduce((sum, d) => sum + (d.status?.toLowerCase() !== 'completed' ? (d.deal_amount || 0) : 0), 0)} />
                                    </div>
                                    <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-xl bg-black/10 backdrop-blur-md border border-white/10 w-fit">
                                        <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                                            <ShieldCheck className="w-3 h-3 text-amber-200" />
                                        </div>
                                        <span className="text-[9px] font-black text-white tracking-[0.15em] uppercase">Escrow Protection Active</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Secondary Stats Row */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2", textColor)}>Paid This Month</p>
                                    <div className={cn("text-lg font-bold font-outfit", isDark ? "text-emerald-400" : "text-emerald-600")}>₹{monthlyRevenue.toLocaleString()}</div>
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
                                                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/10">
                                                        {(deal.status || '').toLowerCase().includes('paid') ? 'Paid' : 'Overdue'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <p className={cn("font-black text-[16px] font-outfit", textColor)}>₹{(deal.deal_amount || 0).toLocaleString()}</p>
                                                </div>
                                                <ChevronRight className={cn("w-4 h-4 opacity-30", textColor)} />
                                            </div>
                                        </motion.div>
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
                    className={cn('fixed bottom-0 inset-x-0 border-t z-50 transition-all duration-500', isDark ? 'border-[#1F2937] bg-[#0B0F14]/90' : 'border-slate-200 bg-white/90')}
                    style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
                >
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 py-3 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className="flex flex-col items-center gap-1 w-14">
                            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Dashboard</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className="flex flex-col items-center gap-1 w-14 relative">
                            <Briefcase className={cn('w-[22px] h-[22px]', activeTab === 'collabs' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'collabs' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Collabs</span>
                        </motion.button>

                        {/* Middle Action: + Collab Link */}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { triggerHaptic(); setShowActionSheet(true); }}
                            className="relative flex flex-col items-center -mt-8"
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center transition-all hover:brightness-110",
                                isDark ? "bg-blue-600 border-4 border-[#0B0F14] text-white shadow-[0_4px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_40px_rgba(59,130,246,0.4)] ring-1 ring-blue-400/30"
                                    : "bg-slate-900 border-4 border-white text-white shadow-lg hover:shadow-xl ring-1 ring-slate-200"
                            )}>
                                <Link2 className="w-7 h-7" />
                            </div>
                            <span className={cn("text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap", isDark ? "text-slate-400" : "text-slate-600")}>+ Collab Link</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className="flex flex-col items-center gap-1 w-14">
                            <CreditCard className={cn('w-[22px] h-[22px]', activeTab === 'payments' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'payments' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Payments</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className="flex flex-col items-center gap-1 w-14">
                            <User className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] tracking-tight', activeTab === 'profile' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Profile</span>
                        </motion.button>
                    </div>
                </div>

                {/* ─── ACTION SHEET (The Deal Intake Engine) ─── */}
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
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Collab Hub</h2>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                    <Eye className="w-3.5 h-3.5" /> 24 Views
                                                </span>
                                                <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">
                                                    <Bell className="w-3.5 h-3.5" /> 4 New
                                                </span>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowActionSheet(false)}
                                            className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}
                                        >
                                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                        </motion.button>
                                    </div>

                                    <div className={cn("p-5 rounded-3xl mb-8 border", isDark ? "bg-[#1E293B]/40 border-white/10" : "bg-slate-50 border-slate-200")}>
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-3">
                                                <Link2 className="w-7 h-7 text-blue-500" />
                                            </div>
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] opacity-40 mb-1", isDark ? "text-white" : "text-slate-900")}>Official Intake Link</p>
                                            <h3 className={cn("text-lg font-bold tracking-tight mb-5", isDark ? "text-slate-200" : "text-slate-700")}>
                                                creatorarmour.com/{username}
                                            </h3>
                                            <div className="flex items-center gap-3 w-full">
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleCopyStorefront}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl font-bold border-0 shadow-lg shadow-blue-500/20 active:shadow-blue-500/10 transition-all"
                                                >
                                                    <Copy className="w-4 h-4" /> Copy
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleShareStorefront}
                                                    className={cn("flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-bold border transition-all",
                                                        isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-700")}
                                                >
                                                    <Share2 className="w-4 h-4" /> Share
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => { setShowActionSheet(false); setActiveTab('collabs'); setCollabSubTab('pending'); }}
                                            className={cn("p-4 rounded-3xl text-left transition-all border group", isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-100 hover:border-blue-200")}
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <Handshake className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <p className={cn("font-bold text-[15px]", isDark ? "text-white" : "text-slate-900")}>View Offers</p>
                                            <p className={cn("text-[11px] opacity-40 mt-1.5", isDark ? "text-white/60" : "text-slate-500")}>Manage brand requests</p>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => { setShowActionSheet(false); window.open(`/${username}`, '_blank'); }}
                                            className={cn("p-4 rounded-3xl text-left transition-all border group", isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-100 hover:border-pink-200")}
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <Eye className="w-5 h-5 text-pink-500" />
                                            </div>
                                            <p className={cn("font-bold text-[15px]", isDark ? "text-white" : "text-slate-900")}>Preview Page</p>
                                            <p className={cn("text-[11px] opacity-40 mt-1.5", isDark ? "text-white/60" : "text-slate-500")}>See what brands see</p>
                                        </motion.button>
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
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220, mass: 0.9 }}
                            className="fixed inset-0 z-[20050] flex flex-col overflow-hidden relative isolate"
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
                                            {selectedItem.brand_name || 'Brand Partner'}
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
                                <div className={cn("rounded-2xl border p-4 mb-5", cardBgColor, borderColor)}>
                                    <div className="flex items-start gap-4">
                                        {/* Logo */}
                                        <div className={cn("w-14 h-14 rounded-2xl border overflow-hidden flex items-center justify-center shrink-0 shadow-sm",
                                            selectedItem.collab_type === 'barter'
                                                ? (isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100")
                                                : (isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200")
                                        )}>
                                            {getBrandIcon(selectedItem.brand_logo_url || selectedItem.logo_url, selectedItem.category, selectedItem.brand_name)}
                                        </div>
                                        {/* Name + subtitle */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[20px] font-black tracking-tight truncate leading-tight", textColor)}>
                                                {selectedItem.brand_name || 'Brand Name'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 mb-2">
                                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
                                                <span className="text-[12px] font-bold text-blue-500">Verified Brand</span>
                                            </div>
                                            <p className={cn("text-[11px] font-semibold leading-tight", secondaryTextColor)}>
                                                Responds in ~3 hours · {selectedItem.total_collabs || 21} successful campaigns
                                            </p>
                                        </div>
                                    </div>

                                    {/* Deal type and Budget */}
                                    <div className={cn("mt-5 p-3.5 rounded-xl border flex items-center justify-between", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                        <div className="flex items-center gap-3 w-full">
                                            {selectedItem.collab_type === 'barter' ? (
                                                <>
                                                    <span className="text-amber-500 text-2xl drop-shadow-sm">🎁</span>
                                                    <div className="flex-1">
                                                        <p className={cn("text-[15px] font-black leading-tight", textColor)}>Barter Collaboration</p>
                                                        <p className={cn("text-[12px] font-semibold mt-1", secondaryTextColor)}>Product Value ₹{(selectedItem.deal_amount || selectedItem.exact_budget || 12500).toLocaleString()}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-emerald-500 text-2xl drop-shadow-sm">💰</span>
                                                    <div className="flex-1">
                                                        <p className={cn("text-[15px] font-black leading-tight", textColor)}>Paid Campaign</p>
                                                        <p className={cn("text-[12px] font-semibold mt-1", secondaryTextColor)}>Cash Budget ₹{(selectedItem.deal_amount || selectedItem.exact_budget || 12500).toLocaleString()}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Row */}
                                    <div className="mt-4 flex items-center justify-center">
                                        <div className={cn("flex items-center px-3.5 py-1.5 rounded-full border shadow-sm",
                                            selectedType === 'deal'
                                                ? (isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")
                                                : (isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")
                                        )}>
                                            <span className={cn("text-[13px] font-bold tracking-tight", selectedType === 'deal' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-amber-400' : 'text-amber-700'))}>
                                                {selectedType === 'deal' ? '🟢 Active Collaboration' : '🟡 Pending Review'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick decision snapshot (offers) */}
                                    {selectedType === 'offer' && (
                                        <div className="mt-4 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className={cn("rounded-2xl border p-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-wider mb-2 opacity-50", textColor)}>Payment</p>
                                                    <p className={cn("text-[14px] font-black leading-tight", textColor)}>Direct bank transfer</p>
                                                </div>
                                                <div className={cn("rounded-2xl border p-4", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-wider mb-2 opacity-50", textColor)}>Deadline</p>
                                                    {(() => {
                                                        const rawDeadline = selectedItem.deadline || selectedItem.raw?.deadline;
                                                        const deadline = rawDeadline ? new Date(rawDeadline) : null;
                                                        if (!deadline || Number.isNaN(deadline.getTime())) {
                                                            return <p className={cn("text-[14px] font-black leading-tight", textColor)}>—</p>;
                                                        }
                                                        const diff = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
                                                        const deadlineColor = diff <= 1
                                                            ? (isDark ? "text-red-300" : "text-red-600")
                                                            : diff <= 3
                                                                ? (isDark ? "text-amber-200" : "text-amber-600")
                                                                : (isDark ? "text-emerald-200" : "text-emerald-600");
                                                        return (
                                                            <>
                                                                <p className={cn("text-[14px] font-black leading-tight", textColor)}>
                                                                    {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </p>
                                                                <p className={cn("text-[11px] font-black tracking-tight mt-1", deadlineColor)}>
                                                                    ⚡ {diff > 0 ? `${diff} days remaining` : 'Overdue'}
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const raw = selectedItem.deliverables || selectedItem.raw?.deliverables;
                                                    let items: string[] = [];
                                                    try {
                                                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                                            items = parsed.map((d: any) => {
                                                                if (typeof d === 'string') return d;
                                                                const ct = (d.contentType || d.type || d.name || '').toLowerCase();
                                                                const count = d.count || d.quantity || 1;
                                                                let emoji = '📋', label = 'Content';
                                                                if (ct.includes('reel')) { emoji = '🎬'; label = 'Reel'; }
                                                                else if (ct.includes('story')) { emoji = '📱'; label = 'Story'; }
                                                                else if (ct.includes('post')) { emoji = '🖼'; label = 'Post'; }
                                                                return `${emoji} ${label} ×${count}`;
                                                            });
                                                        }
                                                    } catch (_) { }
                                                    if (items.length === 0) items = ['🎬 Reel ×1', '📱 Story ×2'];
                                                    return items.slice(0, 4).map((d, i) => (
                                                        <span
                                                            key={i}
                                                            className={cn(
                                                                "px-3 py-2 rounded-full text-[12px] font-bold border",
                                                                isDark ? "bg-white/5 border-white/10 text-white/85" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                                                            )}
                                                        >
                                                            {d}
                                                        </span>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
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
                                                        { label: 'Company', value: selectedItem.company_name || selectedItem.brand_name || 'Pronto Pvt Ltd' },
                                                        { label: 'GST', value: selectedItem.gst_number || '27ABCDE1234F1Z5' },
                                                        { label: 'Address', value: selectedItem.address || 'Mumbai, India' },
                                                        { label: 'Contact', value: selectedItem.contact_person || selectedItem.contact_name || 'Brand Manager' },
                                                        { label: 'Email', value: selectedItem.contact_email || selectedItem.email || '—' },
                                                        { label: 'Phone', value: selectedItem.contact_phone || selectedItem.phone || '—' },
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
                                {selectedItem.collab_type === 'barter' && (
                                    <div className="mb-6">
                                        <h4 className={cn("text-[13px] font-black uppercase tracking-wider mb-3 opacity-50", textColor)}>Product Included</h4>
                                        <div className={cn("rounded-xl border p-3 flex items-center gap-4", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                            <div className="w-16 h-16 rounded-xl bg-orange-100 shrink-0 overflow-hidden border border-black/5">
                                                <img src={selectedItem.product_image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=300"} alt="Product" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className={cn("text-[14px] font-black leading-tight", textColor)}>{selectedItem.product_name || 'Signature Hoodie + Apparel Box'}</p>
                                                <p className={cn("text-[12px] font-semibold mt-1", secondaryTextColor)}>Product Value ₹{(selectedItem.deal_amount || selectedItem.exact_budget || 12500).toLocaleString()}</p>
                                                <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>Ships within 3 days</p>
                                            </div>
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
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider mb-2 opacity-50", textColor)}>Payment Method</p>
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Landmark className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className={cn("text-[14px] font-black leading-tight", textColor)}>Direct Bank<br />Transfer</span>
                                        </div>
                                    </div>
                                    <div className={cn("rounded-2xl border p-4 flex flex-col justify-center", cardBgColor, borderColor)}>
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider mb-2 opacity-50", textColor)}>Deadline</p>
                                        {(() => {
                                            const d = selectedItem.deadline ? new Date(selectedItem.deadline) : new Date(Date.now() + 13 * 86400000);
                                            const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
                                            const deadlineColor = diff < 3 ? 'text-red-500' : diff < 7 ? 'text-orange-500' : 'text-blue-500';
                                            const deadlineStr = selectedItem.deadline
                                                ? new Date(selectedItem.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
                                            <div className="space-y-2 text-[13px]">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("font-semibold opacity-70", textColor)}>Offer budget</span>
                                                    <span className={cn("font-black", textColor)}>₹{(selectedItem.deal_amount || selectedItem.exact_budget || 12500).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("font-semibold opacity-70", textColor)}>Platform fee</span>
                                                    <span className={cn("font-black", textColor)}>₹0</span>
                                                </div>
                                                <div className={cn("h-px my-2", isDark ? "bg-white/10" : "bg-slate-100")} />
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("font-black", textColor)}>You receive</span>
                                                    <span className={cn("font-black", isDark ? "text-emerald-300" : "text-emerald-600")}>₹{(selectedItem.deal_amount || selectedItem.exact_budget || 12500).toLocaleString()}</span>
                                                </div>
                                                <p className={cn("text-[11px] font-semibold mt-2", secondaryTextColor)}>Payment: bank transfer (as per contract).</p>
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

                                                const status = (selectedItem.status || '').toLowerCase();
                                                if (status === 'signed_pending_creator' || status === 'sent' || status.includes('pending_creator') || status === 'signed_by_brand') {
                                                    triggerHaptic();
                                                    setShowCreatorSigningModal(true);
                                                } else {
                                                    triggerHaptic();
                                                }
                                            }
                                        }}
                                        disabled={processingDeal === selectedItem.id}
                                        className={cn(
                                            "w-full py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all flex flex-col items-center justify-center active:scale-[0.98] border disabled:opacity-50",
                                            selectedType === 'offer'
                                                ? (selectedItem.collab_type === 'barter' ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/30" : "bg-blue-600 text-white border-blue-500 shadow-blue-500/30")
                                                : ((selectedItem.status || '').toLowerCase().includes('pending_creator') || (selectedItem.status || '').toLowerCase() === 'sent' || (selectedItem.status || '').toLowerCase() === 'signed_by_brand')
                                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30"
                                                    : (isDark ? "bg-white text-[#0B0F14] border-white" : "bg-slate-900 text-white border-slate-900")
                                        )}
                                    >
                                        {processingDeal === selectedItem.id ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : selectedType === 'offer' ? (
                                            <>
                                                <span className="text-[17px] font-black leading-tight">
                                                    Accept ₹{(selectedItem.deal_amount || selectedItem.exact_budget || 12500).toLocaleString()}
                                                </span>
                                                <span className="text-[11px] font-semibold opacity-85 mt-0.5 leading-tight">
                                                    Contract auto-generated
                                                    {(() => {
                                                        const rawDeadline = selectedItem.deadline || selectedItem.raw?.deadline;
                                                        if (!rawDeadline) return '';
                                                        const d = new Date(rawDeadline);
                                                        if (Number.isNaN(d.getTime())) return '';
                                                        const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
                                                        return diff > 0 ? ` • ${diff} days left` : ' • overdue';
                                                    })()}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[16px] font-black">
                                                {((selectedItem.status || '').toLowerCase().includes('pending_creator') || (selectedItem.status || '').toLowerCase() === 'sent' || (selectedItem.status || '').toLowerCase() === 'signed_by_brand')
                                                    ? '✍️ Sign Contract'
                                                    : 'Review Contract'}
                                            </span>
                                        )}
                                    </motion.button>

                                    {selectedType === 'offer' && (
                                        <div className="flex gap-2.5 mt-3 pt-3">
                                            <button
                                                onClick={() => {
                                                    triggerHaptic();
                                                    if (selectedItem.isDemo) {
                                                        toast.info("You can't counter a demo offer! 😉");
                                                        return;
                                                    }
                                                    navigate(`/collab-requests/${selectedItem.id}/counter`, { state: { request: selectedItem.raw || selectedItem } });
                                                }}
                                                className={cn("flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95",
                                                    isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}
                                            >
                                                <div className={cn("flex items-center gap-1.5 font-black text-[14px]", textColor)}>
                                                    <Edit3 className="w-4 h-4" /> Suggest New Price
                                                </div>
                                                <span className={cn("text-[10px] font-bold opacity-50", textColor)}>Edit budget or deliverables</span>
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
                                                className={cn("flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95",
                                                    isDark ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/20" : "bg-red-50 border-red-200 hover:bg-red-100")}
                                            >
                                                <div className="flex items-center gap-1.5 font-black text-[14px] text-red-500">
                                                    <XCircle className="w-4 h-4" /> Decline
                                                </div>
                                                <span className="text-[10px] font-bold opacity-70 text-red-500/80">This offer will be rejected</span>
                                            </button>
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
            </div>

            {/* Creator Signing Modal */}
            <Dialog open={showCreatorSigningModal} onOpenChange={setShowCreatorSigningModal}>
                <DialogContent className={cn("sm:max-w-[440px] border-white/15 text-white rounded-2xl p-0 overflow-hidden shadow-2xl shadow-black/60", isDark ? "bg-neutral-950/98" : "bg-slate-900")}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 px-6 pt-6 text-2xl font-semibold tracking-tight text-white">
                            <FileText className="w-5 h-5 text-sky-400" />
                            Sign Agreement
                        </DialogTitle>
                        <DialogDescription className="text-neutral-300 px-6 pb-2 text-base leading-relaxed">
                            {creatorSigningStep === 'send'
                                ? 'We will send a secure OTP to your registered email to verify your identity and sign the contract.'
                                : 'Enter the 6-digit code sent to your email to complete the signing process.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5">
                        {creatorSigningStep === 'send' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-sky-500/12 border border-sky-400/35 rounded-xl flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-sky-300 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-sky-200">OTP Verification</p>
                                        <p className="text-xs text-sky-100/80 mt-1">
                                            Signing as: <span className="text-white">{profile?.email || 'Your registered email'}</span>
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={handleSendCreatorOTP}
                                    disabled={isSendingCreatorOTP}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-sky-600 hover:bg-sky-500 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                                >
                                    {isSendingCreatorOTP ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-5 h-5" />
                                            Send OTP to Email
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-300 mb-2 block tracking-wide uppercase font-black">Enterprise OTP Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="123456"
                                        value={creatorOTP}
                                        onChange={(e) => setCreatorOTP(e.target.value.replace(/\D/g, ''))}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3.5 text-center text-3xl tracking-[0.32em] font-mono text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 outline-none transition-all placeholder:text-neutral-500 placeholder:tracking-normal"
                                    />
                                    <p className="text-xs text-neutral-400 mt-2">Code expires in 10 minutes.</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <motion.button
                                        onClick={handleVerifyCreatorOTP}
                                        disabled={isVerifyingCreatorOTP || creatorOTP.length !== 6 || isSigningAsCreator}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                                    >
                                        {isVerifyingCreatorOTP || isSigningAsCreator ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {isSigningAsCreator ? 'Signing Contract...' : 'Verifying...'}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                Verify & Sign
                                            </>
                                        )}
                                    </motion.button>

                                    <button
                                        onClick={() => {
                                            setCreatorSigningStep('send');
                                            setCreatorOTP('');
                                        }}
                                        disabled={isVerifyingCreatorOTP || isSigningAsCreator}
                                        className="text-xs text-neutral-400 hover:text-neutral-200 py-2 transition-all tracking-wide font-semibold"
                                    >
                                        Change method or resend OTP
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 border-t border-white/10 px-6 py-4">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Secure Enterprise-grade E-signature powered by Creator Armour Armor</span>
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
                    const isEscrow = (pay.payment_terms || '').toLowerCase().includes('escrow');
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
                                            {isEscrow ? 'Escrow Status' : 'Payment Status'}
                                        </p>
                                        <p className={cn("text-[22px] font-black leading-tight mb-0.5", isPaid ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-red-400" : "text-red-600"))}>
                                            {isPaid ? 'RECEIVED' : isEscrow ? 'IN ESCROW' : 'OVERDUE'}
                                        </p>
                                        <p className={cn("text-3xl font-black font-outfit mb-3", textColor)}>₹{(pay.deal_amount || 0).toLocaleString()}</p>
                                        {isEscrow ? (
                                            <p className={cn("text-[12px] font-semibold", secondaryTextColor)}>Funds secured in escrow · Release after approval</p>
                                        ) : isPaid ? (
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
                                        { label: 'Deal Value', value: `₹${(pay.deal_amount || 0).toLocaleString()}` },
                                        { label: 'Deal Type', value: pay.collab_type === 'barter' ? '🎁 Barter' : '💰 Paid Campaign' },
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
                                        { label: 'Escrow Protection', value: isEscrow ? '✓ Active' : 'Standard' },
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
