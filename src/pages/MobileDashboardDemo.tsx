import React, { useState, useEffect, useRef } from 'react';
import {
    User, Search, ShieldCheck, Handshake, Camera, Lock,
    LayoutDashboard, CreditCard, Briefcase, Menu, Clapperboard, Instagram,
    Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, Bell, ChevronRight, Zap, Link2, CheckCircle2, Download, MessageSquare, Clock,
    Key, Heart, Info, Globe, Star, Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

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

// Helper component for iOS-style Settings Rows
const SettingsRow = ({ icon, label, iconBg, hasChevron = true, hasBorder = false, isDark, textColor }: any) => (
    <div className={cn("flex items-center gap-3 py-3 px-4 active:bg-opacity-50 transition-all cursor-pointer", isDark ? "active:bg-white/5" : "active:bg-slate-100", hasBorder && (isDark ? "border-b border-[#2C2C2E]" : "border-b border-[#C6C6C8]"))}>
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shadow-sm", iconBg)}>
            {icon}
        </div>
        <span className={cn("flex-1 text-[17px] font-normal", textColor)}>{label}</span>
        {hasChevron && <ChevronRight className="w-5 h-5 opacity-20" />}
    </div>
);

// Main Component
const MobileDashboardDemo = ({
    profile,
    collabRequests = [],
    brandDeals = [],
    stats,
    onAcceptRequest,
    onOpenMenu,
    isRefreshing: isRefreshingProp,
    onRefresh
}: MobileDashboardProps) => {
    const navigate = useNavigate();
    const signOutMutation = useSignOut();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'collabs' | 'payments' | 'profile'>('dashboard');
    const [collabSubTab, setCollabSubTab] = useState<'active' | 'pending'>('active');
    const [profileSubTab, setProfileSubTab] = useState<'profile' | 'account' | 'collab' | 'support'>('profile');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [processingDeal, setProcessingDeal] = React.useState<string | null>(null);

    const username = profile?.instagram_handle?.replace('@', '') || profile?.first_name || profile?.full_name?.split(' ')[0] || 'pratyush';
    const avatarUrl = profile?.avatar_url || 'https://i.pravatar.cc/150?img=47';
    const activeDealsCount = (brandDeals || []).length;
    const pendingOffersCount = (collabRequests || []).length;

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
    const bgColor = isDark ? '#0B0F14' : '#F9FAFB'; // Stripe/Linear vibes
    const cardBgColor = isDark ? 'bg-slate-900' : 'bg-white';
    const borderColor = isDark ? 'border-slate-800' : 'border-slate-200';
    const secondaryTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const textColor = isDark ? 'text-white' : 'text-slate-900';

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

    const triggerHaptic = () => { if (navigator.vibrate) navigator.vibrate(10); };
    const toggleTheme = () => { triggerHaptic(); setTheme(p => p === 'dark' ? 'light' : 'dark'); };

    const handleAccept = async (req: any) => {
        if (!onAcceptRequest) return;
        triggerHaptic();
        setProcessingDeal(req.id);
        try { await onAcceptRequest(req); } finally { setProcessingDeal(null); }
    };

    const handleAction = (action: string) => {
        triggerHaptic();
        if (action === 'notifications') navigate('/notifications');
        else if (action === 'menu') { setIsSidebarOpen(true); if (onOpenMenu) onOpenMenu(); }
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
                if (char >= 'A' && char <= 'E') color = 'bg-violet-500';
                else if (char >= 'F' && char <= 'J') color = 'bg-blue-500';
                else if (char >= 'K' && char <= 'O') color = 'bg-emerald-500';
                else if (char >= 'P' && char <= 'T') color = 'bg-orange-500';
                else if (char >= 'U' && char <= 'Z') color = 'bg-pink-500';

                return (
                    <div className={cn("w-full h-full flex items-center justify-center text-white font-bold text-lg shadow-inner transition-colors duration-500", color)}>
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

    const upcomingCampaigns = brandDeals
        .filter(d => d.status === 'Active' || d.status === 'confirmed')
        .map(d => ({
            id: d.id,
            title: d.campaign_name || d.title || 'Brand Project',
            date: d.due_date ? new Date(d.due_date).toLocaleDateString() : 'TBD',
            status: d.status
        }))
        .slice(0, 3);

    return (
        <div
            className={cn('fixed inset-0 z-[10000] flex justify-center overflow-hidden font-sans')}
            style={{ backgroundColor: bgColor }}
        >
            <div
                className={cn(
                    'w-full md:max-w-3xl mx-auto relative h-[100dvh] flex flex-col transition-colors duration-300 md:border-x',
                    isDark ? 'md:border-[#1F2937] text-slate-200' : 'md:border-slate-200 text-slate-900'
                )}
                style={{ backgroundColor: bgColor }}
            >
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
                                    {/* Left: Avatar */}
                                    <button onClick={() => handleAction('menu')} className={cn("w-9 h-9 rounded-full border overflow-hidden transition-all active:scale-95", borderColor)}>
                                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    </button>

                                    {/* Center: Wordmark */}
                                    <div className="flex items-center gap-1.5 font-semibold text-[16px] tracking-tight">
                                        <ShieldCheck className={cn("w-4 h-4", isDark ? "text-white" : "text-slate-900")} />
                                        <span className={textColor}>CreatorArmour</span>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-3">
                                        <button className={secondaryTextColor}><Search className="w-5 h-5" /></button>
                                        <button onClick={() => handleAction('notifications')} className={cn('relative', secondaryTextColor)}>
                                            {collabRequests.length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 text-[8px] font-black flex items-center justify-center text-white" style={{ borderColor: bgColor }}>
                                                    {collabRequests.length}
                                                </span>
                                            )}
                                        </button>
                                        <button onClick={toggleTheme} className={secondaryTextColor}>
                                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
                                    <p className={cn('text-[14px] font-medium mt-0.5', secondaryTextColor)}>
                                        @{username}
                                    </p>
                                </motion.div>
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
                                            <AnimatedCounter value={stats?.earnings || 0} />
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
                                        className={cn('p-5 rounded-[16px] border shadow-md hover:shadow-lg transition-all', cardBgColor, borderColor)}
                                    >
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <Briefcase className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                                            <span className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Active Deals</span>
                                        </div>
                                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{activeDealsCount}</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                        className={cn('p-5 rounded-[16px] border shadow-md hover:shadow-lg transition-all', cardBgColor, borderColor)}
                                    >
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <Handshake className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                                            <span className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Pending Offers</span>
                                        </div>
                                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{pendingOffersCount}</p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Brand Offers Section */}
                            <div className="px-5 mb-8">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className={cn('text-[16px] font-medium tracking-tight', textColor)}>Active Brand Offers</h2>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {collabRequests.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className={cn('p-8 rounded-[16px] border border-dashed text-center', borderColor, cardBgColor)}
                                        >
                                            <Search className="w-6 h-6 mx-auto mb-3 text-slate-400" strokeWidth={1.5} />
                                            <p className={cn('text-[14px] font-medium', secondaryTextColor)}>No pending offers yet</p>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-10">
                                            {collabRequests.map((req, idx) => {
                                                const reqStatus = req.status || (idx === 0 ? 'new' : idx === 1 ? 'pending' : 'negotiating');

                                                // Format deliverables accurately
                                                let deliverablesArr: string[] = ['1 Reel', '1 Story', '1 Post'];
                                                const rawDeliv = req.raw?.deliverables || req.deliverables;
                                                if (rawDeliv) {
                                                    if (Array.isArray(rawDeliv)) {
                                                        deliverablesArr = rawDeliv;
                                                    } else if (typeof rawDeliv === 'string') {
                                                        try {
                                                            const parsed = JSON.parse(rawDeliv);
                                                            deliverablesArr = Array.isArray(parsed) ? parsed : [parsed.toString()];
                                                        } catch (e) {
                                                            deliverablesArr = [rawDeliv];
                                                        }
                                                    }
                                                }

                                                // Clean up deliverables (remove any stray brackets/quotes if they slipped through)
                                                deliverablesArr = deliverablesArr.map(d => d.toString().replace(/[\[\]"']/g, ''));

                                                // Determine Deadline text
                                                let deadlineText = '';
                                                if (req.deadline) {
                                                    const dDate = new Date(req.deadline);
                                                    const diffDays = Math.ceil((dDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                    deadlineText = diffDays > 0 ? `${diffDays}d left` : 'Past Due';
                                                }

                                                // Mock/Get ID and time
                                                const fakeId = req.id ? req.id.slice(0, 4).toUpperCase() : 'DEAL';
                                                const timeAgo = (date: string) => {
                                                    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
                                                    let interval = seconds / 31536000;
                                                    if (interval > 1) return Math.floor(interval) + " years ago";
                                                    interval = seconds / 2592000;
                                                    if (interval > 1) return Math.floor(interval) + " months ago";
                                                    interval = seconds / 86400;
                                                    if (interval > 1) return Math.floor(interval) + " days ago";
                                                    interval = seconds / 3600;
                                                    if (interval > 1) return Math.floor(interval) + " hours ago";
                                                    interval = seconds / 60;
                                                    if (interval > 1) return Math.floor(interval) + " minutes ago";
                                                    return Math.floor(seconds) + " seconds ago";
                                                };
                                                const createdTime = req.created_at ? timeAgo(req.created_at) : 'recently';

                                                return (
                                                    <motion.div
                                                        key={req.id || idx}
                                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className={cn('rounded-[16px] border p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_50px_-10px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-[1px] relative', cardBgColor, borderColor)}
                                                    >
                                                        {/* Row 1: Brand Header */}
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("w-11 h-11 rounded-full border overflow-hidden flex items-center justify-center shrink-0 shadow-sm", isDark ? "bg-[#1A253C] border-white/10" : "bg-white border-slate-200")}>
                                                                    {getBrandIcon(req.brand_logo || req.raw?.brand_logo_url || req.raw?.logo_url, req.category, req.brand_name)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h3 className={cn("text-[16px] font-semibold truncate", isDark ? "text-white" : "text-slate-900")}>{req.brand_name || 'Brand'}</h3>
                                                                    <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                                        <p className={cn("text-[12px] font-medium", secondaryTextColor)}>{req.category || 'Lifestyle'}</p>
                                                                        <span className={cn("text-[10px]", secondaryTextColor)}>•</span>
                                                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
                                                                        <span className={cn("text-[12px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Verified</span>
                                                                        {req.status === 'active' && (
                                                                            <>
                                                                                <span className={cn("text-[10px]", secondaryTextColor)}> • </span>
                                                                                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">ACTIVE DEAL</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className={cn("text-[10px] uppercase font-bold tracking-[0.06em] mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>Budget</p>
                                                                <p className={cn("text-[18px] font-bold tracking-tight", textColor)}>
                                                                    {req.exact_budget ? formatCurrency(req.exact_budget) : (req.budget_range || '₹75,000')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Metadata (Pills) */}
                                                        <div className="flex flex-col gap-2.5 mb-5 mt-1">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {deliverablesArr.map((d, i) => (
                                                                    <span key={i} className={cn("px-2 py-1 rounded-[8px] text-[11px] font-black border tracking-tight", isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-600")}>
                                                                        {d}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                                                <div className={cn("flex items-center gap-1 py-1 rounded-[8px] text-[10px] font-bold tracking-tight", isDark ? "text-slate-300" : "text-slate-700")}>
                                                                    📅 {req.deadline ? new Date(req.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '21 Mar'}
                                                                </div>
                                                                {deadlineText && (
                                                                    <div className={cn("flex items-center gap-1 py-1 rounded-[8px] text-[10px] font-bold tracking-tight px-2", isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-600")}>
                                                                        ⚡ {deadlineText.replace('(', '').replace(')', '')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 pt-3 border-t border-slate-500/10">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/collab-requests/${req.id}/brief`); }}
                                                                className={cn(
                                                                    "flex-1 h-10 rounded-[12px] font-semibold text-[13px] border transition-all",
                                                                    isDark ? "border-[#334155] text-slate-300 hover:bg-white/5" : "border-slate-300 text-slate-700 hover:bg-gray-50 bg-white"
                                                                )}
                                                            >
                                                                Review Details
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleAccept(req); }}
                                                                disabled={processingDeal === req.id}
                                                                className={cn(
                                                                    "flex-1 h-10 rounded-[12px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2",
                                                                    "bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                                                                )}
                                                            >
                                                                {processingDeal === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept Deal'}
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}

                    {/* ─── OTHER TABS (Simplified for UI flow) ─── */}
                    {activeTab === 'profile' && (
                        <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 min-h-screen", isDark ? "bg-[#000000]" : "bg-[#F2F2F7]")}>
                            {/* Header */}
                            <div className={cn("px-6 pt-12 pb-4 flex items-baseline justify-between", isDark ? "bg-[#000000]" : "bg-[#F2F2F7]")}>
                                <h1 className={cn("text-3xl font-black", textColor)}>Settings</h1>
                            </div>

                            <div className="px-4 mb-6">
                                {/* Segmented Control (Those 4 Options) */}
                                <div className={cn("grid grid-cols-4 gap-1 p-1 rounded-xl", isDark ? "bg-[#1C1C1E]" : "bg-[#E3E3E8]")}>
                                    {(['profile', 'account', 'collab', 'support'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => { triggerHaptic(); setProfileSubTab(tab); }}
                                            className={cn(
                                                "py-1.5 rounded-[10px] text-[11px] font-bold transition-all",
                                                profileSubTab === tab
                                                    ? (isDark ? "bg-[#636366] text-white shadow-sm" : "bg-white text-black shadow-sm")
                                                    : "text-slate-500"
                                            )}
                                        >
                                            {tab === 'profile' ? 'Profile' : tab === 'account' ? 'Account' : tab === 'collab' ? 'Collab' : 'Support'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8 mt-2">
                                <AnimatePresence mode="wait">
                                    {profileSubTab === 'profile' && (
                                        <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                            {/* Profile Entry Row */}
                                            <div className={cn("px-4 py-3 flex items-center gap-4 active:bg-opacity-80 transition-all", isDark ? "bg-[#1C1C1E] border-t border-b border-[#2C2C2E]" : "bg-white border-t border-b border-[#C6C6C8]")}>
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                                                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-[#1C1C1E] flex items-center justify-center">
                                                        <Camera className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h2 className={cn("text-[17px] font-bold", textColor)}>{profile?.full_name || 'Pratyush'}</h2>
                                                    <p className={cn("text-[13px] opacity-60", textColor)}>Verified Creator Profile • {username}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 opacity-20" />
                                            </div>

                                            <div className="mt-8">
                                                <div className={cn("border-t border-b", isDark ? "border-[#2C2C2E] bg-[#1C1C1E]" : "border-[#C6C6C8] bg-white")}>
                                                    <SettingsRow icon={<User className="w-4 h-4 text-white" />} iconBg="bg-blue-500" label="Personal Information" hasBorder isDark={isDark} textColor={textColor} />
                                                    <SettingsRow icon={<Star className="w-4 h-4 text-white" />} iconBg="bg-yellow-400" label="Starred Deals" hasBorder isDark={isDark} textColor={textColor} />
                                                    <SettingsRow icon={<Globe className="w-4 h-4 text-white" />} iconBg="bg-emerald-500" label="Public Portfolio" isDark={isDark} textColor={textColor} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {profileSubTab === 'account' && (
                                        <motion.div key="account" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                            <div className={cn("border-t border-b", isDark ? "border-[#2C2C2E] bg-[#1C1C1E]" : "border-[#C6C6C8] bg-white")}>
                                                <SettingsRow icon={<Key className="w-4 h-4 text-white" />} iconBg="bg-blue-400" label="Account Security" hasBorder isDark={isDark} textColor={textColor} />
                                                <SettingsRow icon={<Lock className="w-4 h-4 text-white" />} iconBg="bg-blue-600" label="Privacy" hasBorder isDark={isDark} textColor={textColor} />
                                                <SettingsRow icon={<CreditCard className="w-4 h-4 text-white" />} iconBg="bg-emerald-500" label="Payments & Payouts" hasBorder isDark={isDark} textColor={textColor} />
                                                <SettingsRow icon={<Smartphone className="w-4 h-4 text-white" />} iconBg="bg-[#8E8E93]" label="Linked Devices" isDark={isDark} textColor={textColor} />
                                            </div>
                                        </motion.div>
                                    )}

                                    {profileSubTab === 'collab' && (
                                        <motion.div key="collab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                            <div className={cn("border-t border-b", isDark ? "border-[#2C2C2E] bg-[#1C1C1E]" : "border-[#C6C6C8] bg-white")}>
                                                <SettingsRow icon={<Briefcase className="w-4 h-4 text-white" />} iconBg="bg-orange-500" label="Collaboration History" hasBorder isDark={isDark} textColor={textColor} />
                                                <SettingsRow icon={<Zap className="w-4 h-4 text-white" />} iconBg="bg-yellow-500" label="Active Negotiations" hasBorder isDark={isDark} textColor={textColor} />
                                                <SettingsRow icon={<ShieldCheck className="w-4 h-4 text-white" />} iconBg="bg-blue-500" label="Armour Verification" isDark={isDark} textColor={textColor} />
                                            </div>
                                        </motion.div>
                                    )}

                                    {profileSubTab === 'support' && (
                                        <motion.div key="support" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                            <div className={cn("border-t border-b", isDark ? "border-[#2C2C2E] bg-[#1C1C1E]" : "border-[#C6C6C8] bg-white")}>
                                                <SettingsRow icon={<Info className="w-4 h-4 text-white" />} iconBg="bg-blue-400" label="Help & FAQ" hasBorder isDark={isDark} textColor={textColor} />
                                                <SettingsRow icon={<MessageSquare className="w-4 h-4 text-white" />} iconBg="bg-emerald-600" label="Contact Support" hasBorder isDark={isDark} textColor={textColor} />
                                                <SettingsRow icon={<Heart className="w-4 h-4 text-white" />} iconBg="bg-rose-500" label="Tell a Friend" isDark={isDark} textColor={textColor} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Common App Config */}
                                <div>
                                    <div className={cn("border-t border-b", isDark ? "border-[#2C2C2E] bg-[#1C1C1E]" : "border-[#C6C6C8] bg-white")}>
                                        <button
                                            onClick={() => { triggerHaptic(); setTheme(isDark ? 'light' : 'dark'); }}
                                            className="w-full"
                                        >
                                            <SettingsRow icon={isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />} iconBg="bg-[#8E8E93]" label={`Dark Mode: ${isDark ? 'On' : 'Off'}`} hasBorder isDark={isDark} textColor={textColor} />
                                        </button>
                                        <SettingsRow icon={<Bell className="w-4 h-4 text-white" />} iconBg="bg-red-500" label="Notifications" isDark={isDark} textColor={textColor} />
                                    </div>
                                </div>

                                {/* Danger Group */}
                                <div>
                                    <div className={cn("border-t border-b", isDark ? "border-[#2C2C2E] bg-[#1C1C1E]" : "border-[#C6C6C8] bg-white")}>
                                        <button
                                            onClick={() => { triggerHaptic(); signOutMutation.mutate(); }}
                                            className="w-full"
                                        >
                                            <div className="px-4 py-3.5 flex items-center justify-center text-red-500 font-bold active:opacity-60 transition-all">
                                                Log Out
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="text-center pb-12">
                                    <p className="text-[11px] font-medium opacity-30 uppercase tracking-widest" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                                        Creator Armour for iOS<br />
                                        Version 2.4.1 (Stable)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collabs' && (
                        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {/* Toggle Header */}
                            <div className={cn("flex p-1.5 rounded-2xl mb-8", isDark ? "bg-white/5" : "bg-slate-100")}>
                                <button
                                    onClick={() => { triggerHaptic(); setCollabSubTab('active'); }}
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
                                    onClick={() => { triggerHaptic(); setCollabSubTab('pending'); }}
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
                                                                    ₹{deal.deal_amount?.toLocaleString() || 'TBD'}
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
                                                                    isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                                                                )}>
                                                                    In Progress
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
                                        className={cn("p-6 rounded-2xl border mb-6", cardBgColor, borderColor)}
                                    >
                                        <h2 className={cn("text-xl font-bold mb-4", textColor)}>Pending Offers</h2>
                                        {pendingOffersCount > 0 ? (
                                            <div className="space-y-3">
                                                <p className={cn("text-sm", secondaryTextColor)}>{pendingOffersCount} brands are waiting for your response.</p>
                                                <button
                                                    onClick={() => { triggerHaptic(); navigate('/collab-requests'); }}
                                                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                                >
                                                    View {pendingOffersCount} Requests
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Handshake className={cn("w-12 h-12 mx-auto mb-3 opacity-20", isDark ? "text-white" : "text-slate-900")} />
                                                <p className={cn("text-sm", secondaryTextColor)}>No new requests right now.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={() => { triggerHaptic(); navigate('/creator-contracts'); }}
                                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                Manage All Contracts
                            </button>
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

                            {/* Main Highlight: Pending Amount (Premium Earning Card Design) */}
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
                                {/* Decorative elements */}
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
                                    <div className={cn("text-lg font-bold font-outfit", isDark ? "text-emerald-400" : "text-emerald-600")}>₹{(stats?.month?.earnings || 0).toLocaleString()}</div>
                                </div>
                                <div className={cn("p-5 rounded-2xl border", cardBgColor, borderColor)}>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2", textColor)}>Total Earnings</p>
                                    <div className={cn("text-lg font-bold font-outfit", textColor)}>₹{(stats?.allTime?.earnings || 0).toLocaleString()}</div>
                                </div>
                            </div>


                            {/* Search and Filters */}
                            <div className="space-y-4 mb-6">
                                <div className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl border bg-slate-500/5", borderColor)}>
                                    <Search className={cn("w-4 h-4", secondaryTextColor)} />
                                    <input placeholder="Search transactions..." className="bg-transparent border-0 outline-0 text-sm flex-1 placeholder:opacity-40" />
                                </div>

                                <div className="flex gap-2">
                                    {['All', 'Pending', 'Paid'].map((tab) => (
                                        <button
                                            key={tab}
                                            className={cn(
                                                "px-6 py-2 rounded-full text-[11px] font-bold tracking-tight transition-all",
                                                tab === 'Pending'
                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                                                    : cn("border", borderColor, secondaryTextColor)
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
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
                                            className={cn("p-5 rounded-2xl border flex items-center justify-between group active:scale-[0.98] transition-all", cardBgColor, borderColor)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center text-lg font-black", borderColor, isDark ? "bg-white/5" : "bg-slate-50")}>
                                                    {getBrandIcon(deal.brand_logo_url || deal.logo_url, deal.category, deal.brand_name)}
                                                </div>
                                                <div>
                                                    <p className={cn("font-bold text-[15px]", textColor)}>{deal.brand_name || 'Brand Partner'}</p>
                                                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/10">
                                                        Overdue
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn("font-black text-[16px] font-outfit", textColor)}>₹{(deal.deal_amount || 0).toLocaleString()}</p>
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
                            <span className={cn('text-[10px] font-medium tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)}>Dashboard</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className="flex flex-col items-center gap-1 w-14 relative">
                            <div className="relative">
                                <Briefcase className={cn('w-[22px] h-[22px]', activeTab === 'collabs' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            </div>
                            <span className={cn('text-[10px] font-medium tracking-tight', activeTab === 'collabs' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)}>Collabs</span>
                        </motion.button>

                        {/* Middle Action: + Collab Link */}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { triggerHaptic(); navigate('/profile'); }}
                            className="relative flex flex-col items-center -mt-8"
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center transition-all hover:brightness-110",
                                isDark ? "bg-[#1E293B] border border-[#334155] text-white shadow-[0_4px_30px_rgba(59,130,246,0.15)] hover:shadow-[0_6px_40px_rgba(59,130,246,0.25)] ring-1 ring-white/10"
                                    : "bg-slate-900 border-4 border-white text-white shadow-lg hover:shadow-xl ring-1 ring-slate-200"
                            )}>
                                <Link2 className="w-7 h-7" />
                            </div>
                            <span className={cn("text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap", isDark ? "text-slate-400" : "text-slate-600")}>+ Collab Link</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className="flex flex-col items-center gap-1 w-14">
                            <CreditCard className={cn('w-[22px] h-[22px]', activeTab === 'payments' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] font-medium tracking-tight', activeTab === 'payments' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)}>Payments</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className="flex flex-col items-center gap-1 w-14">
                            <User className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
                            <span className={cn('text-[10px] font-medium tracking-tight', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)}>Profile</span>
                        </motion.button>
                    </div>
                </div>

                {/* Sidebar logic is simplified/hidden to focus on main dashboard UX */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 text-center text-slate-900">
                                <p className="font-semibold px-4 py-2">Sidebar hidden for demo cleaniness</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MobileDashboardDemo;
