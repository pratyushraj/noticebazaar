import React from 'react';
import {
    Bell, Check, ChevronRight,
    Plus, User, Zap, FileText, Search, ShieldCheck, Clock, Handshake, SlidersHorizontal,
    LayoutDashboard, CreditCard, Link as LinkIcon, Shield, Briefcase, Menu, Package, Clapperboard, Calendar as CalendarIcon, Target, Dumbbell, Shirt, Mail, Grid2X2, Sun, Moon, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';

interface MobileDashboardProps {
    profile?: any;
    userEmail?: string;
    collabRequests?: any[];
    brandDeals?: any[];
    stats?: any;
    onAcceptRequest?: (req: any) => Promise<void>;
    onDeclineRequest?: (id: string) => void;
    isRefreshing?: boolean;
    onRefresh?: () => Promise<void>;
}

const MobileDashboardDemo = ({
    profile,
    userEmail,
    collabRequests = [],
    brandDeals = [],
    stats,
    onAcceptRequest,
    isRefreshing: isRefreshingProp,
    onRefresh
}: MobileDashboardProps) => {
    const navigate = useNavigate();
    const signOutMutation = useSignOut();
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

    // Pull-to-refresh state
    const [pullDistance, setPullDistance] = React.useState(0);
    const [startY, setStartY] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Interactivity state
    const [processingDeal, setProcessingDeal] = React.useState<string | null>(null);

    const username = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Pratyush';
    const avatarUrl = profile?.avatar_url || "https://i.pravatar.cc/150?img=47";

    // Auto theme toggle based on system preference
    React.useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(mq.matches ? 'dark' : 'light');

        const handleChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    // Theme values
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0A0B0D' : '#FFFFFF';
    const cardBgColor = isDark ? '#15171B' : '#F8FAFC';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const secondaryTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDark ? 'border-white/5' : 'border-slate-200';
    const navBg = isDark ? 'rgba(10, 11, 13, 0.88)' : 'rgba(255, 255, 255, 0.9)';

    // Pull to Refresh Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshingProp) {
            setStartY(e.touches[0].pageY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY > 0 && scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshingProp) {
            const currentY = e.touches[0].pageY;
            const diff = currentY - startY;
            if (diff > 0) {
                const tension = 0.4;
                const newDist = Math.min(diff * tension, 80);
                setPullDistance(newDist);
                if (diff > 10) e.stopPropagation();
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 50 && onRefresh) {
            triggerHaptic();
            onRefresh();
            setPullDistance(60);
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    // Reset pull distance when refreshing prop ends
    React.useEffect(() => {
        if (!isRefreshingProp) {
            setPullDistance(0);
        }
    }, [isRefreshingProp]);

    React.useEffect(() => {
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        const originalColor = metaThemeColor?.getAttribute("content");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", bgColor);
        }

        const originalBodyBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = bgColor;

        return () => {
            if (metaThemeColor && originalColor) {
                metaThemeColor.setAttribute("content", originalColor);
            }
            if (originalBodyBg) {
                document.body.style.backgroundColor = originalBodyBg;
            }
        };
    }, [theme, bgColor]);

    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    const toggleTheme = () => {
        triggerHaptic();
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleAccept = async (req: any) => {
        if (!onAcceptRequest) return;
        triggerHaptic();
        setProcessingDeal(req.id);
        try {
            await onAcceptRequest(req);
        } finally {
            setProcessingDeal(null);
        }
    };

    const handleAction = (action: string) => {
        triggerHaptic();
        if (action === 'notifications') {
            navigate('/notifications');
        } else if (action === 'menu') {
            alert("Menu options: Profile, Settings, Help, Log Out");
        } else if (action === 'view_all') {
            setActiveTab('collabs');
        } else if (action === 'withdraw') {
            navigate('/creator-payments');
        }
    };

    // Format currency helper
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className={cn(
            "fixed inset-0 z-[10000] flex justify-center overflow-hidden selection:bg-blue-500/30",
            isDark ? "sm:bg-[#050607]" : "sm:bg-slate-100"
        )} style={{ backgroundColor: bgColor }}>

            {/* Mobile / Tablet Screen Container */}
            <div className={cn(
                "w-full md:max-w-3xl lg:max-w-5xl mx-auto relative h-[100dvh] sm:h-[100dvh] md:border-x font-sans flex flex-col transition-colors duration-300",
                isDark ? "md:border-white/5 text-slate-200" : "md:border-slate-200 text-slate-900"
            )} style={{ backgroundColor: bgColor }}>

                {/* Pull-to-refresh Indicator */}
                <div
                    className="absolute top-0 inset-x-0 flex justify-center pointer-events-none transition-all duration-200 z-[110]"
                    style={{
                        transform: `translateY(${pullDistance - 40}px)`,
                        opacity: pullDistance > 10 ? 1 : 0
                    }}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shadow-lg border",
                        isDark ? "bg-[#15171B] border-white/10" : "bg-white border-slate-200"
                    )}>
                        {isRefreshingProp ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                            <RefreshCw
                                className="w-5 h-5 text-blue-500 transition-transform"
                                style={{ transform: `rotate(${pullDistance * 6}deg)` }}
                            />
                        )}
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div
                    ref={scrollRef}
                    onScroll={(e) => {
                        if (e.currentTarget.scrollTop > 10 && pullDistance > 0 && !isRefreshingProp) {
                            setPullDistance(0);
                            setStartY(0);
                        }
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="flex-1 overflow-y-auto overflow-x-hidden pb-[120px] scrollbar-hide relative"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="h-0 transition-all duration-300" style={{ height: isRefreshingProp ? '60px' : '0' }} />

                    {activeTab === 'dashboard' && (
                        <>
                            {/* Top Header Section */}
                            <div className="px-5 pb-6 transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                                <div className="flex items-center justify-between mb-8">
                                    <button onClick={() => handleAction('menu')} className={cn("transition-opacity active:scale-95", isDark ? "text-white hover:opacity-70" : "text-slate-900")}>
                                        <Menu className="w-6 h-6" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Shield className="w-5 h-5 text-white fill-white/10" />
                                        </div>
                                        <span className={cn("font-bold tracking-tight text-lg", isDark ? "text-white" : "text-slate-900")}>CreatorArmour</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button onClick={toggleTheme} className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95",
                                            isDark ? "bg-white/5 border-white/10 text-yellow-400" : "bg-slate-100 border-slate-200 text-slate-600"
                                        )}>
                                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                        </button>

                                        <button onClick={() => handleAction('notifications')} className={cn(
                                            "relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors active:scale-95",
                                            isDark ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-600"
                                        )}>
                                            <Bell className="w-5 h-5" />
                                            {collabRequests.length > 0 && (
                                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ borderColor: bgColor }}>
                                                    {collabRequests.length}
                                                </span>
                                            )}
                                        </button>

                                        <div className={cn(
                                            "w-10 h-10 rounded-full border-2 p-0.5 pointer-events-auto cursor-pointer active:scale-95 transition-all",
                                            isDark ? "border-blue-500/30" : "border-blue-500/50"
                                        )} onClick={() => setActiveTab('profile')}>
                                            <img
                                                src={avatarUrl}
                                                alt="Profile avatar"
                                                className="w-full h-full rounded-full object-cover shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h1 className={cn("text-[28px] font-bold tracking-tight leading-tight", isDark ? "text-white" : "text-slate-900")}>
                                        Hi, {username}! 👋
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-[12px] font-black">{collabRequests.length}</span>
                                        </div>
                                        <p className={cn("text-[14px] font-medium", secondaryTextColor)}>new brand collaborations for you</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 space-y-6 pt-2">
                                {/* Operational Metrics Row */}
                                <div className={cn(
                                    "grid grid-cols-3 border rounded-2xl p-5 shadow-xl relative overflow-hidden transition-colors duration-300",
                                    isDark ? "bg-[#15171B] border-white/5" : "bg-white border-slate-200"
                                )}>
                                    <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none", isDark ? "bg-blue-500/5" : "bg-blue-500/[0.03]")} />

                                    <div className="flex flex-col items-center">
                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>Profile Score</p>
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle cx="20" cy="20" r="17" fill="transparent" stroke="currentColor" strokeWidth="2.5" className={isDark ? "text-white/5" : "text-slate-100"} />
                                                    <circle cx="20" cy="20" r="17" fill="transparent" stroke="url(#scoreGradient)" strokeWidth="2.5" strokeDasharray={`${(85 / 100) * 107} 107`} strokeLinecap="round" />
                                                </svg>
                                                <span className={cn("absolute text-[11px] font-bold leading-none", isDark ? "text-white" : "text-slate-900")}>85</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className={cn("text-[14px] font-bold tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>85<span className="text-slate-500 text-[11px] font-medium ml-0.5">/100</span></div>
                                                <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tight">Healthy</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn("w-[1px] h-10 self-center mx-auto", isDark ? "bg-white/5" : "bg-slate-100")} />

                                    <div className="flex flex-col items-center">
                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>Earnings</p>
                                        <div className="text-center">
                                            <p className={cn("text-[18px] font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                {formatCurrency(stats?.earnings || 0)}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5 justify-center">
                                                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                                <span className="text-[11px] text-emerald-400 font-bold tracking-tight">+{stats?.monthlyGrowth?.toFixed(0) || 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn("w-[1px] h-10 self-center mx-auto", isDark ? "bg-white/5" : "bg-slate-100")} />

                                    <div className="flex flex-col items-center">
                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>Active Deals</p>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-[20px] font-black leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                {stats?.activeDeals || 0}
                                            </span>
                                            <div className="flex -space-x-1.5 h-6 items-center ml-1">
                                                {brandDeals.slice(0, 2).map((deal, i) => (
                                                    <div key={deal.id || i} className={cn("w-6 h-6 rounded-full border-2 overflow-hidden shadow-lg bg-slate-800 flex items-center justify-center", isDark ? "border-[#15171B]" : "border-slate-50")}>
                                                        {deal.brand_logo ? <img src={deal.brand_logo} className="w-full h-full object-cover" /> : <div className="text-[8px] text-white">{deal.brand_name?.[0]}</div>}
                                                    </div>
                                                ))}
                                                {brandDeals.length > 2 && (
                                                    <div className={cn("w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center border-2 shadow-lg", isDark ? "border-[#15171B]" : "border-slate-50")}>
                                                        <span className="text-[8px] text-white font-bold">+{brandDeals.length - 2}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Offers Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h2 className={cn("text-[16px] font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Brand Offers</h2>
                                        <button onClick={() => handleAction('view_all')} className="text-[12px] text-blue-400 font-bold flex items-center gap-1 active:scale-95 transition-all">
                                            View All <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {collabRequests.length === 0 ? (
                                            <div className={cn("p-8 text-center rounded-2xl border border-dashed", isDark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-400")}>
                                                <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">No pending offers right now</p>
                                            </div>
                                        ) : (
                                            collabRequests.map((req) => (
                                                <div key={req.id} className={cn(
                                                    "rounded-2xl p-5 border shadow-lg transition-all duration-300 relative overflow-hidden",
                                                    isDark ? "bg-[#15171B] border-white/5 shadow-black/20" : "bg-white border-slate-200 shadow-slate-200/50"
                                                )}>
                                                    <div className="flex items-start justify-between mb-5">
                                                        <div className="flex gap-4">
                                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg p-2", isDark ? "bg-zinc-800" : "bg-slate-100")}>
                                                                {req.brand_logo ? (
                                                                    <img src={req.brand_logo} className="w-full h-full object-contain rounded-lg" />
                                                                ) : (
                                                                    <Target className={cn("w-6 h-6", isDark ? "text-slate-600" : "text-slate-400")} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <h3 className={cn("font-bold text-[17px] tracking-tight", isDark ? "text-white" : "text-slate-900")}>{req.brand_name}</h3>
                                                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                                                    </div>
                                                                </div>
                                                                <p className={cn("text-[12px] font-medium uppercase tracking-tight", isDark ? "text-blue-400" : "text-blue-600")}>
                                                                    {req.collab_type || 'Paid Collab'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm uppercase tracking-wider">
                                                            New Offer
                                                        </div>
                                                    </div>

                                                    <div className={cn("flex items-center justify-between py-4 border-y", isDark ? "border-white/5" : "border-slate-100")}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn("text-[13px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Collab Budget:</span>
                                                            <span className="text-[15px] text-blue-400 font-black tracking-tight">
                                                                {req.exact_budget ? formatCurrency(req.exact_budget) : (req.budget_range || 'TBD')}
                                                            </span>
                                                        </div>
                                                        <ChevronRight className={cn("w-5 h-5", isDark ? "text-slate-700" : "text-slate-200")} />
                                                    </div>

                                                    <div className="flex items-center justify-between mt-5">
                                                        <div className={cn("px-3 py-1.5 rounded-full border", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                                                                {req.deadline ? `Due: ${new Date(req.deadline).toLocaleDateString()}` : 'No Deadline'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => navigate(`/collab-requests/${req.id}/brief`)}
                                                                className={cn(
                                                                    "px-5 py-2.5 rounded-xl font-bold text-[12px] border active:scale-95 transition-all text-slate-300 bg-white/5 border-white/10"
                                                                )}
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                disabled={processingDeal === req.id}
                                                                onClick={() => handleAccept(req)}
                                                                className={cn(
                                                                    "px-6 py-2.5 rounded-xl font-bold text-[12px] text-white shadow-lg active:scale-95 transition-all flex items-center gap-2",
                                                                    processingDeal === req.id ? "bg-blue-400" : "bg-blue-600 shadow-blue-500/30"
                                                                )}
                                                            >
                                                                {processingDeal === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                {/* Upcoming Campaigns Section */}
                                <section className="pb-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className={cn("text-[16px] font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Upcoming Deadlines</h2>
                                        <button onClick={() => navigate('/calendar')} className="text-[12px] text-blue-400 font-bold active:scale-95 transition-all">See Calendar</button>
                                    </div>

                                    {brandDeals.filter(d => d.due_date && d.status !== 'Completed').length === 0 ? (
                                        <div className={cn("p-6 text-center rounded-2xl border border-dashed", isDark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-400")}>
                                            <CalendarIcon className="w-6 h-6 mx-auto mb-1 opacity-20" />
                                            <p className="text-xs">No imminent deadlines</p>
                                        </div>
                                    ) : (
                                        brandDeals.filter(d => d.due_date && d.status !== 'Completed').slice(0, 1).map(deal => (
                                            <div key={deal.id} className={cn(
                                                "rounded-2xl p-4 border flex items-center justify-between shadow-xl transition-colors duration-300",
                                                isDark ? "bg-[#15171B] border-white/5 shadow-black/20" : "bg-white border-slate-200 shadow-slate-200/50"
                                            )}>
                                                <div className="flex gap-4 items-center">
                                                    <div className={cn("w-14 h-14 rounded-2xl border flex flex-col items-center justify-center overflow-hidden", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                                        <div className="w-full h-4 bg-red-500 flex items-center justify-center">
                                                            <div className="flex gap-1">
                                                                <div className="w-[3px] h-[3px] rounded-full bg-red-900" />
                                                                <div className="w-[3px] h-[3px] rounded-full bg-red-900" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex flex-col items-center justify-center pt-1">
                                                            <span className={cn("text-[20px] font-black leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                                {new Date(deal.due_date).getDate()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className={cn("font-bold text-[15px] tracking-tight truncate max-w-[150px]", isDark ? "text-white" : "text-slate-900")}>
                                                            {deal.brand_name}
                                                        </h3>
                                                        <p className={cn("text-[13px] font-medium mt-0.5", secondaryTextColor)}>
                                                            {new Date(deal.due_date).toLocaleDateString('en-IN', { month: 'long' })} • {deal.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="bg-blue-500/10 text-blue-400 text-[11px] font-black px-4 py-1.5 rounded-full border border-blue-500/20 shadow-sm">
                                                    Confirmed
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </section>
                            </div>
                        </>
                    )}

                    {activeTab === 'collabs' && (
                        <div className={cn("min-h-full flex flex-col transition-colors duration-300", isDark ? "bg-[#0A0B0D]" : "bg-slate-50")}>
                            <div className={cn(
                                "px-5 pb-4 border-b shadow-sm sticky top-0 z-50 transition-all pt-safe",
                                isDark ? "bg-[#0A0B0D] border-white/5 shadow-black/10" : "bg-white border-slate-200/70"
                            )} style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center mb-5">
                                    <div className={cn("flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                                        <Handshake className="w-5 h-5 flex-shrink-0" />
                                        <h1 className="text-[22px] font-semibold tracking-tight">Deals</h1>
                                    </div>
                                    <button onClick={() => handleAction('filter_collabs')} className={cn("w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer", isDark ? "text-slate-500 bg-white/5" : "text-slate-500 bg-slate-100")}>
                                        <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={2} />
                                    </button>
                                </div>
                                <div className={cn("flex gap-2 p-1 rounded-lg", isDark ? "bg-white/5" : "bg-slate-100")}>
                                    <button className={cn("flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm bg-white", isDark ? "bg-white/10 text-white" : "text-slate-900")}>ACTIVE ({brandDeals.length})</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[11px] font-bold">COMPLETED</button>
                                </div>
                            </div>

                            <div className="px-5 py-4 space-y-3">
                                {brandDeals.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <ShieldCheck className={cn("w-12 h-12 mx-auto mb-4", isDark ? "text-white/10" : "text-slate-300")} strokeWidth={1.5} />
                                        <h3 className={cn("text-[16px] font-bold", isDark ? "text-white" : "text-slate-900")}>No active contracts</h3>
                                        <p className={cn("text-[14px] max-w-[250px] mx-auto", isDark ? "text-slate-500" : "text-slate-500")}>Accept an offer from the dashboard to initiate your secure collaboration flow.</p>
                                    </div>
                                ) : (
                                    brandDeals.map(deal => (
                                        <div
                                            key={deal.id}
                                            onClick={() => navigate(`/creator-contracts/${deal.id}`)}
                                            className={cn("p-4 rounded-xl border flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    {deal.brand_logo ? <img src={deal.brand_logo} className="w-7 h-7 object-contain" /> : <Shield className="w-5 h-5 text-blue-500" />}
                                                </div>
                                                <div className="text-left">
                                                    <p className={cn("text-[14px] font-bold", isDark ? "text-white" : "text-slate-900")}>{deal.brand_name}</p>
                                                    <p className="text-[11px] text-blue-500 font-bold uppercase">{deal.status}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className={cn("w-4 h-4", isDark ? "text-slate-600" : "text-slate-300")} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className={cn("min-h-full transition-colors duration-300", isDark ? "bg-[#0A0B0D]" : "bg-white")}>
                            <div className={cn(
                                "px-5 pb-5 border-b sticky top-0 z-[110] transition-all",
                                isDark ? "bg-[#0A0B0D] border-white/10" : "bg-white border-slate-100"
                            )} style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <h1 className={cn("text-[22px] font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Ledger</h1>
                            </div>
                            <div className="px-5 pt-6 space-y-6">
                                <div className="bg-[#0F172A] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                    <Shield className="absolute -right-6 -bottom-6 w-40 h-40 text-blue-50/5 -rotate-12 transition-transform group-hover:scale-110 duration-500" strokeWidth={1} />
                                    <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Vault Balance</p>
                                    <h2 className="text-[32px] font-bold text-white tracking-tight relative z-10">{formatCurrency(stats?.earnings || 0)}</h2>
                                    <div className="mt-8 flex items-center justify-between border-t border-slate-700/50 pt-5 relative z-10">
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Pending Payouts</p>
                                            <p className="text-[14px] font-bold text-white">{formatCurrency(stats?.pendingPayments || 0)}</p>
                                        </div>
                                        <button onClick={() => handleAction('withdraw')} className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[13px] font-black shadow-lg shadow-white/10 active:scale-95 transition-all">Payments Hub</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className={cn("min-h-full pb-32 transition-colors duration-300", isDark ? "bg-[#0A0B0D]" : "bg-white")}>
                            <div className={cn(
                                "px-5 pb-5 border-b sticky top-0 z-[110] transition-all",
                                isDark ? "bg-[#0A0B0D] border-white/10" : "bg-white border-slate-100"
                            )} style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center">
                                    <h1 className={cn("text-[22px] font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Profile</h1>
                                    <button onClick={() => navigate('/creator-profile')} className={cn("text-[12px] font-bold px-4 py-1.5 rounded-lg uppercase tracking-wider active:scale-95 transition-all font-mono", isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500")}>Edit Profile</button>
                                </div>
                            </div>
                            <div className="px-5 pt-8 flex flex-col items-center">
                                <div className={cn("w-28 h-28 rounded-full p-1 shadow-2xl transition-all hover:scale-105", isDark ? "bg-blue-500/10 shadow-blue-500/5" : "bg-blue-500/5 shadow-slate-200")}>
                                    <img src={avatarUrl} alt="User" className="w-full h-full rounded-full object-cover border-4 border-transparent shadow-inner" />
                                </div>
                                <h2 className={cn("text-[24px] font-black mt-6 tracking-tight", isDark ? "text-white" : "text-slate-900")}>@{username}</h2>
                                <p className={cn("text-[15px] font-medium mt-1", secondaryTextColor)}>{userEmail || 'creator@example.com'}</p>

                                <div className="w-full mt-10 space-y-3">
                                    <button onClick={() => navigate('/creator-profile')} className={cn("w-full p-4 rounded-xl border flex items-center justify-between", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-blue-500" />
                                            <span className="font-bold">Collab Readiness</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    </button>
                                    <button onClick={() => navigate('/creator-payments')} className={cn("w-full p-4 rounded-xl border flex items-center justify-between", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-5 h-5 text-emerald-500" />
                                            <span className="font-bold">Payments & Bank</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>

                                <button onClick={() => signOutMutation.mutate()} className="mt-10 px-8 py-3 rounded-xl border border-red-500/20 text-red-500 font-bold text-sm active:scale-95 transition-all bg-red-500/5">
                                    Logout Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Bottom Navigation */}
                <div className={cn(
                    "absolute bottom-0 inset-x-0 w-full px-6 py-2 pb-safe z-40 border-t transition-colors duration-300",
                    isDark ? "border-white/5" : "border-slate-200"
                )} style={{ backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', backgroundColor: navBg }}>
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between pb-4 pt-2">
                        <button onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 transition-all active:scale-90 relative",
                            activeTab === 'dashboard' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <Grid2X2 className={cn("w-[24px] h-[24px]", activeTab === 'dashboard' ? "fill-blue-500/20" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Dash</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 relative transition-all active:scale-90",
                            activeTab === 'collabs' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <Mail className={cn("w-[24px] h-[24px]", activeTab === 'collabs' ? "fill-blue-500/20" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Offers</span>
                        </button>

                        <button
                            onClick={() => { triggerHaptic(); navigate('/create-deal'); }}
                            className="transform -translate-y-6 w-[58px] h-[58px] rounded-full flex items-center justify-center bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.45)] active:scale-90 transition-all border-4 relative overflow-hidden"
                            style={{ borderColor: bgColor }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-blue-500" />
                            <Plus className="w-8 h-8 text-white relative z-10" strokeWidth={3.5} />
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 transition-all active:scale-90",
                            activeTab === 'payments' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <CreditCard className={cn("w-[24px] h-[24px]", activeTab === 'payments' ? "fill-blue-500/20" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ledger</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 transition-all active:scale-90",
                            activeTab === 'profile' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <User className={cn("w-[24px] h-[24px]", activeTab === 'profile' ? "fill-blue-500/20" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Self</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden SVG for gradients */}
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
