import React, { useState, useEffect, useRef } from 'react';
import {
    User, Search, ShieldCheck, Handshake, SlidersHorizontal,
    LayoutDashboard, CreditCard, Shield, Briefcase, Menu, Clapperboard, Calendar as CalendarIcon,
    Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, LogOut, Instagram, Bell, ChevronRight, Check, Zap, Plus, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileDashboardProps {
    profile?: any;
    userEmail?: string;
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

// Main Component
const MobileDashboardDemo = ({
    profile,
    userEmail,
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
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [processingDeal, setProcessingDeal] = React.useState<string | null>(null);

    const username = profile?.instagram_handle?.replace('@', '') || profile?.first_name || profile?.full_name?.split(' ')[0] || 'pratyush';
    const avatarUrl = profile?.avatar_url || 'https://i.pravatar.cc/150?img=47';
    const earnings = stats?.earnings ?? 0;
    const activeDealsCount = brandDeals.length > 0 ? brandDeals.length : 7;
    const pendingOffersCount = collabRequests.length > 0 ? collabRequests.length : 10;

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
    const cardBgColor = isDark ? 'bg-[#121826]' : 'bg-white';
    const borderColor = isDark ? 'border-[#1F2937]' : 'border-slate-200';
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

    const getBrandIcon = (logo?: string, category?: string) => {
        if (logo) return <img src={logo} className="w-full h-full object-contain rounded-xl" />;
        const cat = category?.toLowerCase() || '';
        if (cat.includes('fit') || cat.includes('gym') || cat.includes('sport')) return <Dumbbell className="w-5 h-5 text-slate-400" />;
        if (cat.includes('cloth') || cat.includes('fash') || cat.includes('beauty') || cat.includes('skin')) return <Shirt className="w-5 h-5 text-slate-400" />;
        return <Target className="w-5 h-5 text-slate-400" />;
    };

    const formatCurrency = (amt: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

    const upcomingCampaigns = [
        { id: '1', title: 'Brand Shoot with FitScience', date: '12 April, 2:00 PM', status: 'Confirmed' },
        { id: '2', title: 'GlowSkin Story Drop', date: '18 April, 6:00 PM', status: 'Pending' },
    ];

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
                                            <Bell className="w-5 h-5" />
                                            {collabRequests.length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-transparent" style={{ borderColor: bgColor }} />
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
                                {/* Row 1: Earnings (Full width) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                    className={cn('p-5 py-6 rounded-[16px] border shadow-md hover:shadow-lg transition-all mb-4', isDark ? 'bg-[#121826] border-[#1F2937]' : 'bg-white border-slate-200')}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                                        <span className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Monthly Earnings</span>
                                    </div>
                                    <p className={cn('text-[32px] font-semibold tracking-tight mt-0.5', textColor)}>
                                        ₹{(earnings / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </p>
                                    <p className={cn('text-[12px] font-medium mt-1', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                        {earnings === 0 ? 'No earnings yet this month' : '+14% from last month'}
                                    </p>
                                </motion.div>

                                {/* Row 2: Active & Pending Deals (Side by side) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                        className={cn('p-5 rounded-[16px] border shadow-md hover:shadow-lg transition-all', isDark ? 'bg-[#121826] border-[#1F2937]' : 'bg-white border-slate-200')}
                                    >
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <Briefcase className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                                            <span className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Active Deals</span>
                                        </div>
                                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{activeDealsCount}</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                        className={cn('p-5 rounded-[16px] border shadow-md hover:shadow-lg transition-all', isDark ? 'bg-[#121826] border-[#1F2937]' : 'bg-white border-slate-200')}
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
                                        <div className="space-y-8">
                                            {collabRequests.map((req, idx) => {
                                                const reqStatus = req.status || (idx === 0 ? 'new' : idx === 1 ? 'pending' : 'negotiating');

                                                // Format deliverables as array
                                                let deliverablesArr = ['1 Reel', '1 Story', '1 Post'];
                                                if (req.raw?.deliverables) {
                                                    deliverablesArr = Array.isArray(req.raw.deliverables) ? req.raw.deliverables : [req.raw.deliverables];
                                                }

                                                // Determine Deadline text
                                                let deadlineText = '21 Mar';
                                                if (req.deadline) {
                                                    const dDate = new Date(req.deadline);
                                                    const diffDays = Math.ceil((dDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                    deadlineText = diffDays > 0 ? `${dDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} (in ${diffDays} days)` : 'Past Due';
                                                }

                                                // Mock/Get ID and time
                                                const fakeId = req.id ? req.id.slice(0, 4).toUpperCase() + Math.floor(Math.random() * 1000) : 'CA-2024-018';
                                                const createdStr = idx === 0 ? '3 hours ago' : idx === 1 ? 'Yesterday' : '2 days ago';
                                                const createdTime = req.created_at ? new Date(req.created_at).toLocaleDateString() : createdStr;

                                                return (
                                                    <motion.div
                                                        key={req.id || idx}
                                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className={cn('rounded-[16px] border p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_50px_-10px_rgba(0,0,0,0.4)] transition-all relative', cardBgColor, borderColor)}
                                                    >
                                                        {/* Row 1: Brand Header */}
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-sm", isDark ? "bg-[#1A253C] border-white/10" : "bg-white border-slate-200")}>
                                                                    {getBrandIcon(req.brand_logo, req.category)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h3 className={cn("text-[16px] font-semibold truncate", isDark ? "text-white" : "text-slate-900")}>{req.brand_name || 'Brand'}</h3>
                                                                    <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                                        <p className={cn("text-[12px] font-medium", secondaryTextColor)}>{req.category || 'Lifestyle'}</p>
                                                                        <span className={cn("text-[10px]", secondaryTextColor)}>•</span>
                                                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
                                                                        <span className={cn("text-[12px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Verified Brand</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className={cn("text-[18px] font-bold tracking-tight", textColor)}>
                                                                    {req.exact_budget ? formatCurrency(req.exact_budget) : (req.budget_range || '₹75,000')}
                                                                </p>
                                                                <p className={cn("text-[10px] uppercase font-bold tracking-[0.06em]", isDark ? "text-slate-500" : "text-slate-400")}>Budget</p>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Metadata */}
                                                        <div className="grid grid-cols-[1.5fr_1fr] gap-3 mb-4 bg-slate-50/50 dark:bg-[#1E293B]/30 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                                            <div>
                                                                <p className={cn("text-[10px] uppercase tracking-[0.08em] font-bold mb-1", isDark ? "text-slate-500" : "text-slate-400")}>Deliverables</p>
                                                                <div className="space-y-0.5 font-medium text-[13px]">
                                                                    {deliverablesArr.map((d, i) => (
                                                                        <p key={i} className="flex gap-1.5 items-center">
                                                                            <span className="text-slate-400/70 text-[10px]">•</span>
                                                                            <span className={textColor}>{d}</span>
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className={cn("text-[10px] uppercase tracking-[0.08em] font-bold mb-1", isDark ? "text-slate-500" : "text-slate-400")}>Deadline</p>
                                                                <p className={cn("text-[13px] font-semibold mb-1", textColor)}>
                                                                    {req.deadline ? new Date(req.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '21 Mar'}
                                                                </p>
                                                                {deadlineText && deadlineText !== '21 Mar' && (
                                                                    <div className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold", isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-600")}>
                                                                        {deadlineText.replace('(', '').replace(')', '')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Row 4: Actions (with divider) */}
                                                        <div className="flex gap-2 pt-3">
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
                                                                    isDark
                                                                        ? "bg-[#0F172A] border border-[#1E293B] text-white hover:bg-[#1E293B]"
                                                                        : "bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 shadow-sm"
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
                    {activeTab !== 'dashboard' && (
                        <div className="px-5 pt-8 text-center">
                            <p className={secondaryTextColor}>Content for {activeTab} goes here in the real refactor mapping.</p>
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
                            <span className={cn("text-[11px] font-semibold tracking-tight mt-1 absolute -bottom-5 whitespace-nowrap", isDark ? "text-slate-400" : "text-slate-600")}>+ Collab Link</span>
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
