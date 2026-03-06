import React, { useState, useEffect, useRef } from 'react';
import {
    User, Search, ShieldCheck, Handshake,
    LayoutDashboard, CreditCard, Shield, Briefcase, Clapperboard, Calendar as CalendarIcon,
    Target, Dumbbell, Shirt, Sun, Moon, RefreshCw, Loader2, LogOut, Instagram, Bell, ChevronRight, CheckCircle2,
    Lock,
    ArrowUpRight,
    Wallet,
    TrendingUp,
    Zap,
    Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

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

// ─── STYLES & TOKENS ───
const IOS_BLUE = '#007AFF';
const IOS_GREEN = '#34C759';
const IOS_BG_LIGHT = '#F2F2F7';
const IOS_BG_DARK = '#000000';

const springConfig = { type: 'spring', damping: 25, stiffness: 300 };

// ─── UI COMPONENTS ───

const GlassContainer = ({ children, className, isDark }: { children: React.ReactNode; className?: string; isDark: boolean }) => (
    <div className={cn(
        "backdrop-blur-[40px]",
        isDark ? "bg-black/60 border-t border-white/10" : "bg-white/80 border-t border-black/5",
        className
    )} style={{ WebkitBackdropFilter: 'blur(40px)' }}>
        {children}
    </div>
);

const PremiumCard = ({ children, className, isDark, gradient }: { children: React.ReactNode; className?: string; isDark: boolean; gradient?: boolean }) => (
    <motion.div
        whileTap={{ scale: 0.98 }}
        className={cn(
            "rounded-[28px] overflow-hidden transition-all duration-300",
            gradient ? "shadow-lg shadow-blue-500/20" : (isDark ? "bg-[#1C1C1E] border border-white/5 shadow-2xl" : "bg-white border border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]"),
            className
        )}
    >
        {children}
    </motion.div>
);

const StatusPill = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        'new': { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'NEW' },
        'active': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'ACTIVE' },
        'pending': { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'PENDING' },
    };
    const c = config[status?.toLowerCase()] ?? config['new'];
    return (
        <span className={cn('px-2.5 py-1 rounded-[8px] text-[10px] font-bold tracking-wider', c.bg, c.text)}>
            {c.label}
        </span>
    );
};

// ─── MAIN COMPONENT ───

const MobileDashboardDemo = ({
    profile,
    collabRequests = [],
    brandDeals = [],
    stats,
    onAcceptRequest,
    isRefreshing: isRefreshingProp,
    onRefresh
}: MobileDashboardProps) => {
    const navigate = useNavigate();
    const signOutMutation = useSignOut();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'collabs' | 'payments' | 'profile'>('dashboard');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [pullDistance, setPullDistance] = useState(0);
    const [startY, setStartY] = useState(0);
    const [processingDeal, setProcessingDeal] = React.useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isDark = theme === 'dark';
    const avatarUrl = profile?.avatar_url || 'https://i.pravatar.cc/150?img=47';
    const earnings = stats?.earnings ?? 0;
    const activeDealsCount = (brandDeals || []).length;
    const pendingOffersCount = (collabRequests || []).length;

    // Scroll-based Large Title Logic
    const { scrollY } = useScroll({ container: scrollRef });
    const navTitleOpacity = useTransform(scrollY, [40, 60], [0, 1]);

    const triggerHaptic = () => { if (navigator.vibrate) navigator.vibrate(10); };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshingProp) setStartY(e.touches[0].pageY);
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
        document.body.style.backgroundColor = isDark ? IOS_BG_DARK : IOS_BG_LIGHT;
    }, [isDark]);

    const handleAccept = async (req: any) => {
        if (!onAcceptRequest) return;
        triggerHaptic();
        setProcessingDeal(req.id);
        try { await onAcceptRequest(req); } finally { setProcessingDeal(null); }
    };

    return (
        <div className={cn("fixed inset-0 z-[10000] flex justify-center overflow-hidden font-sans", isDark ? "text-white" : "text-[#1C1C1E]")}>
            <style>{`
                @font-face {
                    font-family: 'SF Pro Display';
                    src: local('SF Pro Display'), local('.SF Pro Display');
                }
                .font-ios { font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, inherit; }
                .font-rounded { font-family: 'SF Pro Rounded', system-ui, sans-serif; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .noise-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    pointer-events: none; opacity: 0.03; z-index: 99999;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                }
            `}</style>

            <div className="noise-overlay" />

            {/* iOS Top Bar / Nav */}
            <GlassContainer isDark={isDark} className="fixed top-0 inset-x-0 h-16 z-[100] border-t-0 border-b flex items-center justify-between px-5">
                <div className="flex items-center gap-3">
                    <button onClick={onOpenMenu} className={cn("p-2 rounded-full active:scale-90 transition-transform", isDark ? "bg-white/5" : "bg-black/5")}>
                        <Menu className="w-5 h-5" />
                    </button>
                    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={cn("p-2 rounded-full active:scale-90 transition-transform", isDark ? "bg-white/5" : "bg-black/5")}>
                        {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                    </button>
                </div>

                <motion.div style={{ opacity: navTitleOpacity }} className="font-bold text-[17px] absolute left-1/2 -translate-x-1/2 font-ios pointer-events-none">
                    {activeTab === 'dashboard' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </motion.div>

                <div className="flex items-center gap-3">
                    <button className={cn("p-2 rounded-full active:scale-90 transition-transform", isDark ? "bg-white/5" : "bg-black/5")}>
                        <Search className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveTab('profile')} className="relative active:scale-90 transition-transform">
                        <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-gradient-to-tr from-[#007AFF] to-emerald-500">
                            <img src={avatarUrl} className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black text-[8px] font-bold flex items-center justify-center">2</span>
                    </button>
                </div>
            </GlassContainer>

            <div
                ref={scrollRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full md:max-w-md mx-auto h-screen overflow-y-auto scrollbar-hide flex flex-col pt-16 font-ios"
                style={{ backgroundColor: isDark ? IOS_BG_DARK : IOS_BG_LIGHT, WebkitOverflowScrolling: 'touch' }}
            >
                {/* Pull to refresh spinner */}
                <div className="flex justify-center h-0 overflow-visible relative">
                    <div className="absolute top-4 flex flex-col items-center gap-2" style={{ transform: `translateY(${pullDistance}px)`, opacity: pullDistance / 40 }}>
                        <RefreshCw className={cn("w-6 h-6 animate-spin text-blue-500")} />
                    </div>
                </div>

                <div className="flex-1 px-5 pt-8 pb-32">
                    {/* ─── LARGE TITLE (Collapses on Scroll) ─── */}
                    <div className="mb-8">
                        <h1 className="text-[34px] font-bold tracking-tight">
                            {activeTab === 'dashboard' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                        <p className={cn("text-[17px] font-medium opacity-50")}>
                            @{profile?.instagram_handle?.replace('@', '') || profile?.username || userEmail?.split('@')[0] || 'creator'}
                        </p>
                    </div>

                    {/* ─── DASHBOARD TAB ─── */}
                    {activeTab === 'dashboard' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springConfig}>
                            {/* Earnings Card (Premium Gradient) */}
                            <PremiumCard isDark={isDark} gradient className="mb-6">
                                <div className="p-8 bg-gradient-to-br from-[#00C6FF] to-[#0072FF] text-white">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <p className="text-[13px] font-bold uppercase tracking-widest opacity-80 mb-2 font-ios">Total Portfolio Value</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[20px] font-bold font-rounded">₹</span>
                                                <motion.span
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    className="text-[36px] font-black font-rounded tracking-tighter"
                                                >
                                                    {(earnings / 100).toLocaleString()}
                                                </motion.span>
                                            </div>
                                        </div>
                                        <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                                            <ArrowUpRight className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md text-white text-[12px] font-bold rounded-full flex items-center gap-1.5 border border-white/10">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            +12.4%
                                        </div>
                                        <span className="text-[13px] font-medium opacity-70">Payout Velocity: High</span>
                                    </div>
                                </div>
                            </PremiumCard>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <PremiumCard isDark={isDark} className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[14px] bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                                        <Briefcase className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold opacity-50 uppercase tracking-tight">Active</p>
                                        <p className="text-[24px] font-black font-rounded">{activeDealsCount}</p>
                                    </div>
                                </PremiumCard>
                                <PremiumCard isDark={isDark} className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[14px] bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                                        <Handshake className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold opacity-50 uppercase tracking-tight">Pending</p>
                                        <p className="text-[24px] font-black font-rounded">{pendingOffersCount}</p>
                                    </div>
                                </PremiumCard>
                            </div>

                            {/* Actionable Offers */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[22px] font-bold tracking-tight font-ios">Priority Deal Queue</h2>
                                <button onClick={() => setActiveTab('collabs')} className="text-[#007AFF] text-[15px] font-semibold">View All</button>
                            </div>

                            <div className="space-y-4">
                                {collabRequests.slice(0, 3).map((req, idx) => (
                                    <PremiumCard key={req.id || idx} isDark={isDark} className="p-5">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-[52px] h-[52px] rounded-full border-2 border-white/5 overflow-hidden shrink-0 shadow-lg">
                                                <img src={req.brand_logo || `https://ui-avatars.com/api/?name=${req.brand_name}&background=random`} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-[18px] truncate leading-tight tracking-tight uppercase">{req.brand_name}</h3>
                                                    <CheckCircle2 className="w-4 h-4 text-[#007AFF] fill-[#007AFF]/20" />
                                                </div>
                                                <p className="text-[13px] font-medium opacity-50 mt-0.5">{req.category || 'Promo'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[20px] font-black text-[#34C759] font-rounded tracking-tighter mb-1">
                                                    ₹{req.exact_budget ? (req.exact_budget).toLocaleString() : '75K+'}
                                                </p>
                                                <StatusPill status={idx === 0 ? 'new' : 'pending'} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-[12px] font-bold uppercase tracking-tight opacity-70">1 Reel • 1 Story</div>
                                            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-[12px] font-bold uppercase tracking-tight flex items-center gap-1.5">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                {req.deadline ? new Date(req.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '24 Mar'}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button onClick={() => navigate(`/collab-requests/${req.id}/brief`)} className={cn("flex-1 py-3 rounded-2xl font-bold text-[15px] border active:scale-[0.98] transition-all", isDark ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-black")}>
                                                Details
                                            </button>
                                            <button onClick={() => handleAccept(req)} className="flex-1 py-3 rounded-2xl bg-[#007AFF] text-white font-bold text-[15px] active:scale-[0.98] shadow-lg shadow-blue-500/20 transition-all">
                                                {processingDeal === req.id ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Accept Deal'}
                                            </button>
                                        </div>
                                    </PremiumCard>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── COLLABS TAB ─── */}
                    {activeTab === 'collabs' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <PremiumCard isDark={isDark} className="p-6">
                                <h2 className="text-[22px] font-bold mb-6 font-ios">Active Lifecycle</h2>
                                {brandDeals.length > 0 ? (
                                    <div className="space-y-5">
                                        {brandDeals.map((deal, idx) => (
                                            <div key={idx} className={cn("p-4 rounded-[22px] border flex items-center gap-4", isDark ? "bg-white/[0.03] border-white/5" : "bg-black/[0.02] border-black/5")}>
                                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <Clapperboard className="w-6 h-6 text-blue-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-[16px] truncate leading-tight uppercase tracking-tight">{deal.brand_name}</h4>
                                                    <p className="text-[12px] opacity-40 uppercase font-black mt-1">Stage: Delivery Draft</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="h-1.5 w-16 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-[#007AFF]" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#007AFF]">70% READY</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 opacity-30">
                                        <Briefcase className="w-12 h-12 mx-auto mb-3" />
                                        <p className="font-bold uppercase tracking-widest text-xs">Awaiting Execution</p>
                                    </div>
                                )}
                            </PremiumCard>

                            <button onClick={() => navigate('/creator-contracts')} className={cn("w-full py-5 rounded-[22px] font-black text-[17px] shadow-2xl flex items-center justify-center gap-3 transition-colors", isDark ? "bg-white text-black" : "bg-black text-white")}>
                                <Shield className="w-5 h-5 text-[#007AFF]" />
                                Master Contract Vault
                            </button>
                        </motion.div>
                    )}

                    {/* ─── PAYMENTS TAB ─── */}
                    {activeTab === 'payments' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                            {/* Payout Vault */}
                            <PremiumCard isDark={isDark} className="p-8 relative overflow-hidden bg-[#1C1C1E]">
                                <div className="absolute -top-10 -right-10 p-24 opacity-5 rotate-12">
                                    <Lock className="w-40 h-40 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/50 mb-3">Escrow Balance</p>
                                    <div className="flex items-baseline gap-1.5 text-white mb-10">
                                        <span className="text-[24px] font-bold font-rounded">₹</span>
                                        <span className="text-[52px] font-black font-rounded tracking-tighter">{(earnings / 1).toLocaleString()}</span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-8 text-[#34C759] font-bold text-[15px]">
                                        <ShieldCheck className="w-6 h-6" />
                                        <span className="uppercase tracking-tight">Financial Safeguard Active</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 rounded-[22px] bg-white/[0.05] border border-white/5">
                                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">In Transit</p>
                                            <p className="text-[20px] font-black text-amber-400 font-rounded">₹{(stats?.pendingPayments || 2) * 25000}</p>
                                        </div>
                                        <div className="p-5 rounded-[22px] bg-white/[0.05] border border-white/5">
                                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Recovered</p>
                                            <p className="text-[20px] font-black text-emerald-500 font-rounded">₹{earnings}</p>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>

                            {/* Recovery Bot */}
                            <PremiumCard isDark={isDark} className="p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center border border-[#007AFF]/20">
                                            <Zap className="w-6 h-6 text-[#007AFF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[17px]">Autonomous Recovery</h3>
                                            <p className="text-[12px] opacity-50 uppercase font-black">Agent Status: Chasing</p>
                                        </div>
                                    </div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-pulse shadow-[0_0_12px_rgba(52,199,89,0.8)]" />
                                </div>
                                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-3">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-[#34C759]" />
                                </div>
                                <p className="text-[11px] font-black text-center opacity-40 uppercase tracking-tighter">Verifying Payment Signatures • 100% Reliability</p>
                            </PremiumCard>

                            <button onClick={() => navigate('/creator-payments')} className="w-full py-5 rounded-[22px] bg-[#007AFF] text-white font-black text-[17px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
                                <Wallet className="w-6 h-6" />
                                Initiate Payout Request
                            </button>
                        </motion.div>
                    )}

                    {/* ─── PROFILE TAB ─── */}
                    {activeTab === 'profile' && (
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <PremiumCard isDark={isDark} className="p-10 text-center pt-16">
                                <div className="relative inline-block mb-6">
                                    <motion.div whileHover={{ rotate: 5 }} className="w-32 h-32 rounded-[42px] border-[5px] border-white/10 p-1.5 overflow-hidden shadow-2xl mx-auto bg-gradient-to-tr from-[#007AFF] to-emerald-500">
                                        <img src={avatarUrl} className="w-full h-full object-cover rounded-[34px]" />
                                    </motion.div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[#007AFF] border-4 border-[#1C1C1E] flex items-center justify-center shadow-lg">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <h2 className="text-[30px] font-black tracking-tight leading-tight">
                                    {profile?.full_name || (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : profile?.first_name || profile?.full_name || 'Creator')}
                                </h2>
                                <p className="text-[18px] font-medium opacity-40 mb-8 font-rounded">
                                    @{profile?.instagram_handle?.replace('@', '') || profile?.username || userEmail?.split('@')[0] || 'creator'}
                                </p>

                                <div className="flex flex-wrap justify-center gap-3">
                                    <div className="px-4 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-black uppercase tracking-widest leading-none">Creator Elite</div>
                                    <div className="px-4 py-2 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 text-[11px] font-black uppercase tracking-widest leading-none text-[#34C759]">Identity Verified</div>
                                </div>
                            </PremiumCard>

                            <div className="space-y-4">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] opacity-30 ml-3">System Settings</h3>
                                <PremiumCard isDark={isDark} className="overflow-hidden">
                                    {[
                                        { icon: Instagram, label: 'Social Graph Settings', color: 'text-pink-500', route: '/creator-profile' },
                                        { icon: LayoutDashboard, label: 'Performance Analytics', color: 'text-blue-500', route: '/creator-analytics' },
                                        { icon: ShieldCheck, label: 'Legal & Contract Vault', color: 'text-[#34C759]', route: '/creator-contracts' },
                                        { icon: CreditCard, label: 'Payout Configuration', color: 'text-amber-500', route: '/creator-payments' }
                                    ].map((item, i) => (
                                        <button key={i} onClick={() => { triggerHaptic(); navigate(item.route); }} className={cn("w-full p-5 flex items-center justify-between active:bg-black/5 dark:active:bg-white/5 transition-all border-b last:border-0", isDark ? "border-white/5" : "border-black/5")}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5", item.color)}>
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-[17px] tracking-tight">{item.label}</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 opacity-20" />
                                        </button>
                                    ))}
                                </PremiumCard>
                            </div>

                            <button onClick={() => { triggerHaptic(); signOutMutation.mutate(); }} className="w-full py-5 rounded-[22px] bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[17px] active:bg-red-500/20 transition-all flex items-center justify-center gap-3">
                                <LogOut className="w-5 h-5" />
                                Terminate Current Session
                            </button>

                            <p className="text-[11px] font-black text-center opacity-20 uppercase tracking-[0.2em] pb-10">
                                NoticeBazaar Core v2.8.2<br />
                                Encrypted & Geo-Targeted
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ─── TAB BAR (iOS Translucent) ─── */}
            <GlassContainer isDark={isDark} className="fixed bottom-0 inset-x-0 h-[92px] z-[100] border-t flex items-center justify-around px-3 pb-safe">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className="flex flex-col items-center gap-1.5 w-16">
                    <LayoutDashboard className={cn('w-[26px] h-[26px] transition-all', activeTab === 'dashboard' ? 'text-[#007AFF]' : 'text-gray-400')} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
                    <span className={cn('text-[10px] font-black tracking-tight uppercase', activeTab === 'dashboard' ? 'text-[#007AFF]' : 'text-gray-400')}>Home</span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className="flex flex-col items-center gap-1.5 w-16">
                    <Briefcase className={cn('w-[26px] h-[26px] transition-all', activeTab === 'collabs' ? 'text-[#007AFF]' : 'text-gray-400')} strokeWidth={activeTab === 'collabs' ? 2.5 : 2} />
                    <span className={cn('text-[10px] font-black tracking-tight uppercase', activeTab === 'collabs' ? 'text-[#007AFF]' : 'text-gray-400')}>Deals</span>
                </motion.button>

                {/* FAB Center Action */}
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { triggerHaptic(); navigate('/profile'); }}
                    className="relative -mt-12"
                >
                    <div className="w-[66px] h-[66px] rounded-[26px] bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center shadow-[0_12px_44px_rgba(0,122,255,0.45)] border border-white/20 active:brightness-110 transition-all">
                        <Link2 className="w-8 h-8 text-white stroke-[3px]" />
                    </div>
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className="flex flex-col items-center gap-1.5 w-16">
                    <Wallet className={cn('w-[26px] h-[26px] transition-all', activeTab === 'payments' ? 'text-[#007AFF]' : 'text-gray-400')} strokeWidth={activeTab === 'payments' ? 2.5 : 2} />
                    <span className={cn('text-[10px] font-black tracking-tight uppercase', activeTab === 'payments' ? 'text-[#007AFF]' : 'text-gray-400')}>Vault</span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className="flex flex-col items-center gap-1.5 w-16">
                    <User className={cn('w-[26px] h-[26px] transition-all', activeTab === 'profile' ? 'text-[#007AFF]' : 'text-gray-400')} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                    <span className={cn('text-[10px] font-black tracking-tight uppercase', activeTab === 'profile' ? 'text-[#007AFF]' : 'text-gray-400')}>Self</span>
                </motion.button>
            </GlassContainer>
        </div>
    );
};

export default MobileDashboardDemo;
