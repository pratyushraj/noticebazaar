import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, User, Zap, Search, ShieldCheck, Clock, Handshake, SlidersHorizontal,
    LayoutDashboard, CreditCard, Shield, Briefcase, Menu, Clapperboard, Calendar as CalendarIcon,
    Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, LogOut, Instagram, Bell, ChevronRight, Check
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

// Circular Progress Ring Component
const CircularProgress = ({ score, size = 64 }: { score: number; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
    const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5}
                    />
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke={color} strokeWidth={5}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[13px] font-black text-white">{score}</span>
                </div>
            </div>
            <p className="text-[11px] font-bold mt-1" style={{ color }}>{label}</p>
        </div>
    );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        'new': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'New Offer' },
        'pending': { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
        'negotiating': { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'In Negotiation' },
        'active': { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'Active' },
        'completed': { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Completed' },
    };
    const c = config[status?.toLowerCase()] ?? config['new'];
    return (
        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold', c.bg, c.text)}>
            {c.label}
        </span>
    );
};

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

    const username = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Pratyush';
    const avatarUrl = profile?.avatar_url || 'https://i.pravatar.cc/150?img=47';
    const profileScore = stats?.profileScore ?? 92;
    const earnings = stats?.earnings ?? 248500;
    const earningsGrowth = stats?.earningsGrowth ?? 18;
    const activeDealsCount = brandDeals.length || 2;

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
    const bgColor = isDark ? '#0A0B0D' : '#FFFFFF';
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

    // Demo upcoming campaigns
    const upcomingCampaigns = [
        { id: '1', title: 'Brand Shoot with FitScience', date: '12 April, 2:00 PM', status: 'Confirmed' },
        { id: '2', title: 'GlowSkin Story Drop', date: '18 April, 6:00 PM', status: 'Pending' },
    ];

    return (
        <div
            className={cn('fixed inset-0 z-[10000] flex justify-center overflow-hidden')}
            style={{ backgroundColor: bgColor }}
        >
            <div
                className={cn(
                    'w-full md:max-w-3xl mx-auto relative h-[100dvh] font-sans flex flex-col transition-colors duration-300 md:border-x',
                    isDark ? 'md:border-white/5 text-slate-200' : 'md:border-slate-200 text-slate-900'
                )}
                style={{ backgroundColor: bgColor }}
            >
                {/* Pull to Refresh Indicator */}
                <div
                    className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-[110]"
                    style={{ transform: `translateY(${pullDistance - 40}px)`, opacity: pullDistance > 10 ? 1 : 0 }}
                >
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg border', isDark ? 'bg-[#15171B] border-white/10' : 'bg-white border-slate-200')}>
                        {isRefreshingProp
                            ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            : <RefreshCw className="w-5 h-5 text-slate-400" style={{ transform: `rotate(${pullDistance * 6}deg)` }} />
                        }
                    </div>
                </div>

                {/* Scrollable Content */}
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
                            {/* Top Header */}
                            <div
                                className="px-5 pb-4 pt-safe"
                                style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    {/* Left: Hamburger + Logo */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleAction('menu')}
                                            className={cn('w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95', isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800')}
                                        >
                                            <Menu className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                                <ShieldCheck className="w-5 h-5 text-black" />
                                            </div>
                                            <span className={cn('font-black text-[17px] tracking-tight', textColor)}>
                                                Creator<span className="font-black">Armour</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: theme + bell + avatar */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleTheme}
                                            className={cn('w-9 h-9 rounded-xl flex items-center justify-center border transition-all', isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500')}
                                        >
                                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleAction('notifications')}
                                            className={cn('relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all', isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500')}
                                        >
                                            <Bell className="w-4 h-4" />
                                            {collabRequests.length > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                                                    {collabRequests.length}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('profile')}
                                            className="relative w-9 h-9 rounded-full border-2 border-white/20 overflow-hidden"
                                        >
                                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        </button>
                                    </div>
                                </div>

                                {/* Greeting */}
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                    <h1 className={cn('text-[26px] font-black tracking-tight leading-tight', textColor)}>
                                        Hi, {username}! 👋
                                    </h1>
                                    {collabRequests.length > 0 && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-5 h-5 rounded-full bg-white text-black text-[11px] font-black flex items-center justify-center">
                                                {collabRequests.length}
                                            </span>
                                            <p className={cn('text-[14px] font-medium', secondaryTextColor)}>new brand collaborations for you</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Stats Panel — Profile Score + Earnings + Active Deals */}
                            <div className="px-5 mb-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={cn(
                                        'rounded-2xl border p-4 flex items-center divide-x',
                                        isDark ? 'bg-[#111214] border-white/8 divide-white/8' : 'bg-slate-50 border-slate-200 divide-slate-200'
                                    )}
                                >
                                    {/* Profile Score */}
                                    <div className="flex-1 flex flex-col items-center gap-1 pr-4">
                                        <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1', secondaryTextColor)}>Profile Score</p>
                                        <CircularProgress score={profileScore} size={60} />
                                        <p className={cn('text-[10px] font-bold', secondaryTextColor)}>{profileScore}/100</p>
                                    </div>

                                    {/* Earnings */}
                                    <div className="flex-1 flex flex-col items-center gap-1 px-4">
                                        <p className={cn('text-[10px] font-bold uppercase tracking-widest', secondaryTextColor)}>Earnings</p>
                                        <p className={cn('text-[22px] font-black tracking-tight mt-1', textColor)}>
                                            ₹{(earnings / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        </p>
                                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400">
                                            ↑ +{earningsGrowth}%
                                        </span>
                                    </div>

                                    {/* Active Deals */}
                                    <div className="flex-1 flex flex-col items-center gap-1 pl-4">
                                        <p className={cn('text-[10px] font-bold uppercase tracking-widest', secondaryTextColor)}>Active Deals</p>
                                        <p className={cn('text-[36px] font-black tracking-tight mt-1', textColor)}>{activeDealsCount}</p>
                                        <div className="flex -space-x-2">
                                            {['#4f46e5', '#ec4899', '#f59e0b'].map((c, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full border-2 border-[#111214]" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Brand Offers Section */}
                            <div className="px-5 space-y-4 mb-8">
                                <div className="flex items-center justify-between">
                                    <h2 className={cn('text-[18px] font-black tracking-tight', textColor)}>Brand Offers</h2>
                                    <button
                                        onClick={() => handleAction('view_all')}
                                        className="flex items-center gap-1 text-[13px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                                    >
                                        View All <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {collabRequests.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={cn('p-10 rounded-2xl border border-dashed text-center', isDark ? 'border-white/5' : 'border-slate-200')}
                                        >
                                            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                            <p className={cn('text-sm font-semibold opacity-40', textColor)}>No pending offers</p>
                                            <button className="text-xs text-sky-400 font-bold mt-2">Browse Marketplace</button>
                                        </motion.div>
                                    ) : (
                                        collabRequests.map((req, idx) => {
                                            const reqStatus = req.status || (idx === 0 ? 'new' : idx === 1 ? 'pending' : 'negotiating');
                                            const isPrimary = reqStatus === 'new';
                                            return (
                                                <motion.div
                                                    key={req.id || idx}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.08 }}
                                                    className={cn(
                                                        'rounded-2xl border overflow-hidden transition-all',
                                                        isDark ? 'bg-[#111214] border-white/8' : 'bg-white border-slate-200'
                                                    )}
                                                >
                                                    {/* Card Header */}
                                                    <div className="p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden border', isDark ? 'bg-[#1A1B1F] border-white/8' : 'bg-slate-50 border-slate-100')}>
                                                                    {getBrandIcon(req.brand_logo, req.category)}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h3 className={cn('font-bold text-[15px]', textColor)}>{req.brand_name || 'Brand'}</h3>
                                                                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                                                                    </div>
                                                                    <p className={cn('text-[12px] mt-0.5', secondaryTextColor)}>{req.category || 'Lifestyle'}</p>
                                                                </div>
                                                            </div>
                                                            <StatusBadge status={reqStatus} />
                                                        </div>

                                                        {/* Budget */}
                                                        <button
                                                            onClick={() => navigate(`/collab-requests/${req.id}/brief`)}
                                                            className="w-full flex items-center justify-between py-3 border-t border-b border-white/5"
                                                        >
                                                            <span className={cn('text-[13px] font-semibold', secondaryTextColor)}>Collab Budget:</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-black text-[17px] text-emerald-400">
                                                                    {req.exact_budget ? formatCurrency(req.exact_budget) : (req.budget_range || '₹75,000')}
                                                                </span>
                                                                <ChevronRight className="w-4 h-4 text-slate-600" />
                                                            </div>
                                                        </button>

                                                        {/* Deliverables + Deadline */}
                                                        <div className="flex items-center gap-2 py-3">
                                                            <Clapperboard className="w-3.5 h-3.5 text-slate-500" />
                                                            <span className={cn('text-[12px] font-semibold px-2 py-0.5 rounded-full border', isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700')}>
                                                                {req.raw?.deliverables ? (Array.isArray(req.raw.deliverables) ? req.raw.deliverables.join(' + ') : req.raw.deliverables) : 'Reel + Story + Post'}
                                                            </span>
                                                            {req.deadline && (
                                                                <span className={cn('text-[11px] font-semibold ml-auto', secondaryTextColor)}>
                                                                    Due: {new Date(req.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2.5 pt-1">
                                                            <button
                                                                onClick={() => navigate(`/collab-requests/${req.id}/brief`)}
                                                                className={cn('flex-1 py-2.5 rounded-xl font-bold text-[13px] border transition-all', isDark ? 'border-white/10 text-white bg-white/5 hover:bg-white/10' : 'border-slate-200 text-slate-700 bg-slate-50')}
                                                            >
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => handleAccept(req)}
                                                                disabled={processingDeal === req.id}
                                                                className={cn(
                                                                    'flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-1.5',
                                                                    isPrimary
                                                                        ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25'
                                                                        : reqStatus === 'pending'
                                                                            ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/25'
                                                                            : 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/25'
                                                                )}
                                                            >
                                                                {processingDeal === req.id
                                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                    : isPrimary ? 'Accept'
                                                                        : reqStatus === 'pending' ? 'Respond'
                                                                            : 'Negotiate'
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Upcoming Campaigns Section */}
                            <div className="px-5 pb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={cn('text-[18px] font-black tracking-tight', textColor)}>Upcoming Campaigns</h2>
                                    <button onClick={() => navigate('/calendar')} className="text-[13px] font-bold text-sky-400 hover:text-sky-300 transition-colors">
                                        See Calendar
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {(brandDeals.filter(d => d.due_date).length > 0
                                        ? brandDeals.filter(d => d.due_date).slice(0, 3).map(d => ({
                                            id: d.id,
                                            title: `Brand Shoot with ${d.brand_name}`,
                                            date: new Date(d.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) + ', TBD',
                                            status: d.status || 'Confirmed',
                                        }))
                                        : upcomingCampaigns
                                    ).map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * idx }}
                                            className={cn('flex items-center gap-4 p-4 rounded-2xl border', isDark ? 'bg-[#111214] border-white/8' : 'bg-slate-50 border-slate-200')}
                                        >
                                            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', isDark ? 'bg-[#1e1f24] border border-white/8' : 'bg-white border border-slate-200')}>
                                                <CalendarIcon className="w-5 h-5 text-red-400" />
                                                <span className="sr-only">12</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn('font-bold text-[14px] truncate', textColor)}>{item.title}</p>
                                                <p className={cn('text-[12px] mt-0.5', secondaryTextColor)}>{item.date}</p>
                                            </div>
                                            <span className={cn(
                                                'text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0',
                                                item.status === 'Confirmed' ? 'bg-sky-500/20 text-sky-400' :
                                                    item.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-emerald-500/20 text-emerald-400'
                                            )}>
                                                {item.status}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ─── COLLABS TAB ─── */}
                    {activeTab === 'collabs' && (
                        <div className={cn('min-h-full flex flex-col', isDark ? 'bg-[#0A0B0D]' : 'bg-slate-50')}>
                            <div
                                className={cn('px-5 pb-4 border-b sticky top-0 z-50', isDark ? 'bg-[#0A0B0D] border-white/5' : 'bg-white border-slate-200')}
                                style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn('flex items-center gap-3', textColor)}>
                                        <button onClick={() => setIsSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg">
                                            <Menu className="w-5 h-5" />
                                        </button>
                                        <Handshake className="w-5 h-5 shrink-0" />
                                        <h1 className="text-[22px] font-bold tracking-tight">Collabs</h1>
                                    </div>
                                    <button className={cn('w-9 h-9 flex items-center justify-center rounded-lg', isDark ? 'text-slate-500 bg-white/5' : 'text-slate-500 bg-slate-100')}>
                                        <SlidersHorizontal className="w-[18px] h-[18px]" />
                                    </button>
                                </div>
                                <div className={cn('flex gap-2 p-1 rounded-lg', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                                    <button className={cn('flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm', isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900')}>ACTIVE ({brandDeals.length})</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[11px] font-bold">COMPLETED</button>
                                </div>
                            </div>
                            <div className="px-5 py-4 space-y-3">
                                {brandDeals.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <ShieldCheck className={cn('w-12 h-12 mx-auto mb-4', isDark ? 'text-white/10' : 'text-slate-300')} strokeWidth={1.5} />
                                        <h3 className={cn('text-[16px] font-bold', textColor)}>No active contracts</h3>
                                        <p className="text-slate-500 text-[14px] max-w-[220px] mx-auto mt-1">Accept an offer to start your secure collaboration.</p>
                                    </div>
                                ) : brandDeals.map(deal => (
                                    <div key={deal.id} onClick={() => navigate(`/creator-contracts/${deal.id}`)}
                                        className={cn('p-4 rounded-xl border flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all', isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                                                {deal.brand_logo ? <img src={deal.brand_logo} className="w-7 h-7 object-contain" /> : <Shield className="w-5 h-5 text-slate-400" />}
                                            </div>
                                            <div>
                                                <p className={cn('text-[14px] font-bold', textColor)}>{deal.brand_name}</p>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase">{deal.status}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className={cn('w-4 h-4', isDark ? 'text-slate-600' : 'text-slate-300')} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── PAYMENTS TAB ─── */}
                    {activeTab === 'payments' && (
                        <div className={cn('min-h-full', isDark ? 'bg-[#0A0B0D]' : 'bg-white')}>
                            <div
                                className={cn('px-5 pb-5 border-b sticky top-0 z-[110]', isDark ? 'bg-[#0A0B0D] border-white/10' : 'bg-white border-slate-100')}
                                style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setIsSidebarOpen(true)} className={cn('w-9 h-9 flex items-center justify-center rounded-lg', textColor)}>
                                            <Menu className="w-5 h-5" />
                                        </button>
                                        <h1 className={cn('text-[22px] font-bold tracking-tight', textColor)}>Payments</h1>
                                    </div>
                                    <button onClick={() => navigate('/creator-payments')} className={cn('p-2 rounded-full', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="px-5 pt-6 space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={cn('p-4 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                                        <p className={cn('text-[11px] font-bold uppercase tracking-wider mb-1', secondaryTextColor)}>Collected</p>
                                        <h3 className="text-[18px] font-bold">{formatCurrency(stats?.earnings || 0)}</h3>
                                    </div>
                                    <div className={cn('p-4 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                                        <p className={cn('text-[11px] font-bold uppercase tracking-wider mb-1', secondaryTextColor)}>Pending</p>
                                        <h3 className="text-[18px] font-bold text-amber-500">{formatCurrency(stats?.pendingPayments || 0)}</h3>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn('font-bold text-[15px]', textColor)}>Active Contracts</h3>
                                        <button onClick={() => navigate('/creator-contracts')} className="text-slate-400 text-[13px] font-bold">View All</button>
                                    </div>
                                    {brandDeals.length > 0 ? brandDeals.slice(0, 5).map(deal => (
                                        <button key={deal.id} onClick={() => navigate(`/creator-contracts/${deal.id}`)}
                                            className={cn('w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.98]', isDark ? 'bg-[#15171B] border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 shadow-sm')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-zinc-800' : 'bg-slate-50')}>
                                                    <Briefcase className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className={cn('font-bold text-[14px]', textColor)}>{deal.title || deal.brand_name || 'Campaign'}</p>
                                                    <p className={cn('text-[11px] font-medium', deal.status === 'Completed' ? 'text-green-500' : 'text-slate-500')}>
                                                        {deal.status === 'Active' ? 'Escrow Secured' : deal.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[14px]">{formatCurrency(deal.deal_amount || deal.value || 0)}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <ShieldCheck className="w-3 h-3 text-green-500" />
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Verified</span>
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className={cn('p-8 text-center rounded-2xl border border-dashed', isDark ? 'border-white/10' : 'border-slate-200')}>
                                            <p className={secondaryTextColor}>No active transactions found</p>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => navigate('/creator-payments')} className="w-full bg-white text-black rounded-2xl py-4 font-black text-[15px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Open Payments Hub
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── PROFILE TAB ─── */}
                    {activeTab === 'profile' && (
                        <div className={cn('min-h-full pb-32', isDark ? 'bg-[#0A0B0D]' : 'bg-white')}>
                            <div
                                className={cn('px-5 pb-5 border-b sticky top-0 z-[110]', isDark ? 'bg-[#0A0B0D] border-white/10' : 'bg-white border-slate-100')}
                                style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setIsSidebarOpen(true)} className={cn('w-9 h-9 flex items-center justify-center rounded-lg', textColor)}>
                                            <Menu className="w-5 h-5" />
                                        </button>
                                        <h1 className={cn('text-[22px] font-bold tracking-tight', textColor)}>Profile</h1>
                                    </div>
                                    <button onClick={() => navigate('/creator-profile')} className={cn('text-[12px] font-bold px-4 py-1.5 rounded-lg uppercase tracking-wider active:scale-95 transition-all', isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500')}>
                                        Edit
                                    </button>
                                </div>
                            </div>
                            <div className="px-5 pt-8 flex flex-col items-center">
                                <div className={cn('w-28 h-28 rounded-full p-1 shadow-2xl', isDark ? 'bg-slate-500/10' : 'bg-slate-500/5')}>
                                    <img src={avatarUrl} alt="User" className="w-full h-full rounded-full object-cover border-4 border-transparent" />
                                </div>
                                <h2 className={cn('text-[24px] font-black mt-6 tracking-tight', textColor)}>@{username}</h2>
                                <p className={cn('text-[15px] font-medium mt-1', secondaryTextColor)}>{userEmail || 'creator@example.com'}</p>

                                <div className="w-full mt-10 space-y-1">
                                    <h3 className={cn('text-[12px] font-bold uppercase tracking-widest px-2 mb-2', secondaryTextColor)}>Account Settings</h3>
                                    {[
                                        { icon: User, label: 'Personal Info', path: '/creator-profile?section=account', color: 'text-slate-400', bg: 'bg-slate-500/10' },
                                        { icon: Zap, label: 'Collab Readiness', path: '/creator-profile?section=collab', color: 'text-emerald-400', bg: 'bg-emerald-500/10', badge: 'Strong' },
                                        { icon: CreditCard, label: 'Payments & Bank', path: '/creator-payments', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                        { icon: Instagram, label: 'Social Platforms', path: '/creator-profile?section=platforms', color: 'text-red-400', bg: 'bg-red-500/10' },
                                        { icon: Target, label: 'Branding & Portfolio', path: '/creator-profile?section=branding', color: 'text-pink-400', bg: 'bg-pink-500/10' },
                                        { icon: Bell, label: 'App Notifications', path: '/notifications', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                                    ].map(item => (
                                        <button key={item.path} onClick={() => navigate(item.path)}
                                            className={cn('w-full p-4 rounded-xl border flex items-center justify-between', isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.bg)}>
                                                    <item.icon className={cn('w-4 h-4', item.color)} />
                                                </div>
                                                <span className="font-bold text-[14px]">{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.badge && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-[10px] font-bold uppercase">{item.badge}</span>}
                                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                            </div>
                                        </button>
                                    ))}
                                    <div className="pt-8">
                                        <button onClick={() => signOutMutation.mutate()} className="w-full py-4 rounded-xl border border-red-500/20 text-red-500 font-bold text-[14px] active:scale-95 transition-all bg-red-500/5 flex items-center justify-center gap-2">
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                        <p className={cn('text-center text-[10px] mt-4 uppercase tracking-[0.2em]', secondaryTextColor)}>CreatorArmour v2.4.0</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── BOTTOM NAVIGATION ─── */}
                <div
                    className={cn('fixed bottom-0 inset-x-0 border-t z-50 transition-all duration-500', isDark ? 'border-white/5 bg-[#000]/80' : 'border-slate-200 bg-white/90')}
                    style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
                >
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 py-2 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>

                        {/* Dashboard */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }}
                            className={cn('flex flex-col items-center gap-1 w-14 relative', activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500')}
                        >
                            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? 'opacity-100' : 'opacity-40')} />
                            <span className="text-[10px] font-bold">Dashboard</span>
                            {activeTab === 'dashboard' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-5 h-[3px] rounded-full bg-sky-400" />}
                        </motion.button>

                        {/* Offers */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('collabs'); }}
                            className={cn('flex flex-col items-center gap-1 w-14 relative', activeTab === 'collabs' ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500')}
                        >
                            <div className="relative">
                                <Briefcase className={cn('w-[22px] h-[22px]', activeTab === 'collabs' ? 'opacity-100' : 'opacity-40')} />
                                {collabRequests.length > 0 && (
                                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-sky-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                                        {collabRequests.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold">Offers</span>
                            {activeTab === 'collabs' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-5 h-[3px] rounded-full bg-sky-400" />}
                        </motion.button>

                        {/* FAB */}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                            onClick={() => { triggerHaptic(); navigate('/create-deal'); }}
                            className="w-[58px] h-[58px] rounded-full flex items-center justify-center bg-sky-500 shadow-2xl shadow-sky-500/40 -mt-5 active:scale-95 transition-all"
                        >
                            <Plus className="w-7 h-7 text-white" strokeWidth={3} />
                        </motion.button>

                        {/* Payments */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('payments'); }}
                            className={cn('flex flex-col items-center gap-1 w-14 relative', activeTab === 'payments' ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500')}
                        >
                            <CreditCard className={cn('w-[22px] h-[22px]', activeTab === 'payments' ? 'opacity-100' : 'opacity-40')} />
                            <span className="text-[10px] font-bold">Payments</span>
                            {activeTab === 'payments' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-5 h-[3px] rounded-full bg-sky-400" />}
                        </motion.button>

                        {/* Profile */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('profile'); }}
                            className={cn('flex flex-col items-center gap-1 w-14 relative', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500')}
                        >
                            <User className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? 'opacity-100' : 'opacity-40')} />
                            <span className="text-[10px] font-bold">Profile</span>
                            {activeTab === 'profile' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-5 h-[3px] rounded-full bg-sky-400" />}
                        </motion.button>
                    </div>
                </div>

                {/* ─── SIDEBAR ─── */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            />
                            <motion.div
                                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className={cn('fixed inset-y-0 left-0 w-[280px] z-[101] shadow-2xl flex flex-col', isDark ? 'bg-[#0A0B0D] border-r border-white/5' : 'bg-white border-r border-slate-200')}
                            >
                                <div className="p-6 pt-14 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2">
                                            <ShieldCheck className="text-black w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className={cn('font-black tracking-tight text-[18px]', textColor)}>CreatorArmour</h2>
                                            <p className={cn('text-[10px] font-bold uppercase tracking-widest opacity-40', textColor)}>v2.4.0 • Pro</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        {[
                                            { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
                                            { label: 'Active Collabs', icon: Handshake, tab: 'collabs' },
                                            { label: 'Payments', icon: CreditCard, tab: 'payments' },
                                            { label: 'Profile', icon: User, tab: 'profile' },
                                        ].map(item => (
                                            <button
                                                key={item.label}
                                                onClick={() => { setActiveTab(item.tab as any); setIsSidebarOpen(false); }}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all',
                                                    activeTab === item.tab
                                                        ? (isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600')
                                                        : (isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')
                                                )}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span className="font-bold text-[14px]">{item.label}</span>
                                                {activeTab === item.tab && <Check className="w-4 h-4 ml-auto" />}
                                            </button>
                                        ))}
                                        <div className="pt-4 mt-4 border-t border-white/5">
                                            <button onClick={() => navigate('/notifications')} className={cn('w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left', isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50')}>
                                                <Bell className="w-5 h-5" />
                                                <span className="font-bold text-[14px]">Notifications</span>
                                            </button>
                                            <button onClick={() => navigate('/calendar')} className={cn('w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left', isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50')}>
                                                <CalendarIcon className="w-5 h-5" />
                                                <span className="font-bold text-[14px]">Campaign Schedule</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-6 border-t border-white/5">
                                        <button onClick={() => signOutMutation.mutate()} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-red-500 bg-red-500/5 font-bold text-[14px] active:scale-95 transition-all">
                                            <LogOut className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* SVG Defs */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};

export default MobileDashboardDemo;
