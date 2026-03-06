import React from 'react';
import {
    Bell, Check, ChevronRight,
    Plus, User, Zap, Lock, FileText, Search, ShieldCheck, Clock, Handshake, SlidersHorizontal,
    LayoutDashboard, CreditCard, Link as LinkIcon, Shield, Briefcase, ArrowUpRight, Menu, Instagram, Package, Clapperboard, Calendar as CalendarIcon, Target, Dumbbell, Shirt, Mail, Grid2X2, Sun, Moon, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';

interface MobileDashboardProps {
    profile?: any;
    userEmail?: string;
    collabRequests?: any[];
}

const MobileDashboardDemo = ({ profile, userEmail, collabRequests = [] }: MobileDashboardProps = {}) => {
    const navigate = useNavigate();
    const signOutMutation = useSignOut();
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

    // Pull-to-refresh state
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [pullDistance, setPullDistance] = React.useState(0);
    const [startY, setStartY] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Interactivity state
    const [acceptedDeals, setAcceptedDeals] = React.useState<string[]>([]);
    const [processingDeal, setProcessingDeal] = React.useState<string | null>(null);

    const username = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Pratyush';
    const avatarUrl = profile?.avatar_url || "https://i.pravatar.cc/150?img=47";

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
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshing) {
            setStartY(e.touches[0].pageY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY > 0 && scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshing) {
            const currentY = e.touches[0].pageY;
            const diff = currentY - startY;
            if (diff > 0) {
                // Apply a resistance curve to the pull distance
                const tension = 0.4;
                const newDist = Math.min(diff * tension, 80);
                setPullDistance(newDist);
                // Prevent default scrolling if pulling down at top
                if (diff > 10) e.stopPropagation();
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 50) {
            triggerRefresh();
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    const triggerRefresh = () => {
        triggerHaptic();
        setIsRefreshing(true);
        setPullDistance(60); // Hold at active position

        // Simulate background data fetch
        setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            console.log("Dashboard data refreshed!");
        }, 1500);
    };

    React.useEffect(() => {
        // Change theme color for this specific page to blend with current theme
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        const originalColor = metaThemeColor?.getAttribute("content");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", bgColor);
        }

        // Force body background
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

    const handleAction = (action: string, id?: string) => {
        triggerHaptic();

        if (action === 'accept' && id) {
            setProcessingDeal(id);
            // Simulate processing
            setTimeout(() => {
                setProcessingDeal(null);
                setAcceptedDeals(prev => [...prev, id]);
                alert(`Offer from ${id} has been accepted! Moving to contracting...`);
            }, 1200);
            return;
        }

        if (action === 'notifications') {
            alert("Latest notifications: 3 new offers pending!");
        } else if (action === 'menu') {
            alert("Menu options: Profile, Settings, Help, Log Out");
        } else if (action === 'view_all') {
            setActiveTab('collabs');
        } else if (action === 'withdraw') {
            alert("Withdrawal request initiated for ₹3,45,000");
        }
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
                        {isRefreshing ? (
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
                        // Reset pull state if user manual scrolls
                        if (e.currentTarget.scrollTop > 10 && pullDistance > 0 && !isRefreshing) {
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
                    {/* Visual spacer to prevent header from being hidden in PTR flow */}
                    <div className="h-0 transition-all duration-300" style={{ height: isRefreshing ? '60px' : '0' }} />

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
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ borderColor: bgColor }}>3</span>
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
                                        Hi, {username}Fit! 👋
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-[12px] font-black">3</span>
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
                                                    <circle cx="20" cy="20" r="17" fill="transparent" stroke="url(#scoreGradient)" strokeWidth="2.5" strokeDasharray={`${(92 / 100) * 107} 107`} strokeLinecap="round" />
                                                </svg>
                                                <span className={cn("absolute text-[11px] font-bold leading-none", isDark ? "text-white" : "text-slate-900")}>92</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className={cn("text-[14px] font-bold tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>92<span className="text-slate-500 text-[11px] font-medium ml-0.5">/100</span></div>
                                                <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tight">Excellent</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn("w-[1px] h-10 self-center mx-auto", isDark ? "bg-white/5" : "bg-slate-100")} />

                                    <div className="flex flex-col items-center">
                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>Earnings</p>
                                        <div className="text-center">
                                            <p className={cn("text-[18px] font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>
                                                ₹2,48,500
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5 justify-center">
                                                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                                <span className="text-[11px] text-emerald-400 font-bold tracking-tight">+18%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn("w-[1px] h-10 self-center mx-auto", isDark ? "bg-white/5" : "bg-slate-100")} />

                                    <div className="flex flex-col items-center">
                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>Active Deals</p>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-[20px] font-black leading-none", isDark ? "text-white" : "text-slate-900")}>2</span>
                                            <div className="flex -space-x-1.5 h-6 items-center ml-1">
                                                <div className={cn("w-6 h-6 rounded-full border-2 overflow-hidden shadow-lg", isDark ? "border-[#15171B]" : "border-slate-50")}>
                                                    <img src="https://i.pravatar.cc/100?img=1" className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className={cn("w-6 h-6 rounded-full border-2 overflow-hidden shadow-lg", isDark ? "border-[#15171B]" : "border-slate-50")}>
                                                    <img src="https://i.pravatar.cc/100?img=2" className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className={cn("w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center border-2 shadow-lg", isDark ? "border-[#15171B]" : "border-slate-50")}>
                                                    <Plus className="w-3 h-3 text-white" strokeWidth={4} />
                                                </div>
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
                                        {/* Static Demo Card: FitScience */}
                                        <div className={cn(
                                            "rounded-2xl p-5 border shadow-lg transition-all duration-300 relative overflow-hidden",
                                            isDark ? "bg-[#15171B] border-white/5 shadow-black/20" : "bg-white border-slate-200 shadow-slate-200/50",
                                            acceptedDeals.includes('FitScience') && "opacity-60 grayscale pointer-events-none"
                                        )}>
                                            {acceptedDeals.includes('FitScience') && (
                                                <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center z-10">
                                                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                                                        <Check className="w-4 h-4" /> Accepted
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between mb-5">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E1306C] via-[#FFDC80] to-[#C13584] p-[2px] shadow-lg shrink-0">
                                                        <div className={cn("w-full h-full rounded-[14px] flex items-center justify-center", isDark ? "bg-[#15171B]" : "bg-white")}>
                                                            <Instagram className={cn("w-6 h-6", isDark ? "text-white" : "text-slate-900")} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h3 className={cn("font-bold text-[17px] tracking-tight", isDark ? "text-white" : "text-slate-900")}>FitScience</h3>
                                                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                                            </div>
                                                        </div>
                                                        <p className={cn("text-[12px] font-medium", secondaryTextColor)}>Fitness & Nutrition</p>
                                                    </div>
                                                </div>
                                                <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm uppercase tracking-wider">
                                                    New Offer
                                                </div>
                                            </div>

                                            <div className={cn("flex items-center justify-between py-4 border-y", isDark ? "border-white/5" : "border-slate-100")}>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[13px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Collab Budget:</span>
                                                    <span className="text-[15px] text-blue-400 font-black tracking-tight">₹75,000</span>
                                                </div>
                                                <ChevronRight className={cn("w-5 h-5", isDark ? "text-slate-700" : "text-slate-200")} />
                                            </div>

                                            <div className="flex items-center justify-between mt-5">
                                                <div className={cn("px-3 py-1.5 rounded-full border", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Reel + Story + Post</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleAction('view_details_fitscience')} className={cn(
                                                        "px-5 py-2.5 rounded-xl font-bold text-[12px] border active:scale-95 transition-all",
                                                        isDark ? "text-slate-300 bg-white/5 border-white/10" : "text-slate-600 bg-slate-100 border-slate-200"
                                                    )}>
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('accept', 'FitScience')}
                                                        className={cn(
                                                            "px-6 py-2.5 rounded-xl font-bold text-[12px] text-white shadow-lg active:scale-95 transition-all flex items-center gap-2",
                                                            processingDeal === 'FitScience' ? "bg-blue-400" : "bg-blue-600 shadow-blue-500/30"
                                                        )}
                                                    >
                                                        {processingDeal === 'FitScience' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mock GlowSkin Card */}
                                        <div className={cn(
                                            "rounded-2xl p-5 border shadow-lg transition-all duration-300 relative",
                                            isDark ? "bg-[#15171B] border-white/5 shadow-black/20" : "bg-white border-slate-200 shadow-slate-200/50",
                                            acceptedDeals.includes('GlowSkin') && "opacity-60 grayscale pointer-events-none"
                                        )}>
                                            {acceptedDeals.includes('GlowSkin') && (
                                                <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center z-10">
                                                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                                                        <Check className="w-4 h-4" /> Accepted
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between mb-5">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-pink-500/20 p-[2px] shrink-0">
                                                        <div className={cn("w-full h-full rounded-[14px] flex items-center justify-center", isDark ? "bg-[#15171B]" : "bg-white")}>
                                                            <div className="w-6 h-6 rounded-full bg-pink-500/40 flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-pink-400" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h3 className={cn("font-bold text-[17px] tracking-tight", isDark ? "text-white" : "text-slate-900")}>GlowSkin</h3>
                                                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                                            </div>
                                                        </div>
                                                        <p className={cn("text-[12px] font-medium", secondaryTextColor)}>Beauty & Skincare</p>
                                                    </div>
                                                </div>
                                                <div className="bg-orange-500/10 text-orange-400 text-[10px] font-black px-3 py-1 rounded-full border border-orange-500/20 shadow-sm uppercase tracking-wider">
                                                    Pending
                                                </div>
                                            </div>

                                            <div className={cn("flex items-center justify-between py-4 border-y", isDark ? "border-white/5" : "border-slate-100")}>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[13px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Collab Budget:</span>
                                                    <span className="text-[15px] text-blue-400 font-black tracking-tight">₹40,000</span>
                                                </div>
                                                <ChevronRight className={cn("w-5 h-5", isDark ? "text-slate-700" : "text-slate-200")} />
                                            </div>

                                            <div className="flex items-center justify-between mt-5">
                                                <div className={cn("px-3 py-1.5 rounded-full border", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Story + Review</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleAction('view_glowskin')} className={cn(
                                                        "px-5 py-2.5 rounded-xl font-bold text-[12px] border active:scale-95 transition-all",
                                                        isDark ? "text-slate-300 bg-white/5 border-white/10" : "text-slate-600 bg-slate-100 border-slate-200"
                                                    )}>
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('accept', 'GlowSkin')}
                                                        className={cn(
                                                            "px-6 py-2.5 rounded-xl font-bold text-[12px] text-white shadow-lg active:scale-95 transition-all flex items-center gap-2",
                                                            processingDeal === 'GlowSkin' ? "bg-orange-400" : "bg-orange-600 shadow-orange-500/30"
                                                        )}
                                                    >
                                                        {processingDeal === 'GlowSkin' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Respond"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Upcoming Campaigns Section */}
                                <section className="pb-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className={cn("text-[16px] font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Upcoming Campaigns</h2>
                                        <button onClick={() => handleAction('see_calendar')} className="text-[12px] text-blue-400 font-bold active:scale-95 transition-all">See Calendar</button>
                                    </div>
                                    <div className={cn(
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
                                                    <span className={cn("text-[20px] font-black leading-none", isDark ? "text-white" : "text-slate-900")}>12</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className={cn("font-bold text-[15px] tracking-tight", isDark ? "text-white" : "text-slate-900")}>Brand Shoot with FitScience</h3>
                                                <p className={cn("text-[13px] font-medium mt-0.5", secondaryTextColor)}>12 April, 2:00 PM</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-500/10 text-blue-400 text-[11px] font-black px-4 py-1.5 rounded-full border border-blue-500/20 shadow-sm">
                                            Confirmed
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </>
                    )}

                    {/* Standard tabs logic persists... */}
                    {activeTab === 'collabs' && (
                        <div className={cn("min-h-full flex flex-col transition-colors duration-300", isDark ? "bg-[#0A0B0D]" : "bg-slate-50")}>
                            <div className={cn(
                                "px-5 pb-4 border-b shadow-sm sticky top-0 z-50 transition-all pt-safe",
                                isDark ? "bg-[#0A0B0D] border-white/5 shadow-black/10" : "bg-white border-slate-200/70"
                            )} style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center mb-5">
                                    <div className={cn("flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                                        <Handshake className="w-5 h-5 flex-shrink-0" />
                                        <h1 className="text-[22px] font-semibold tracking-tight">Collaborations</h1>
                                    </div>
                                    <button onClick={() => handleAction('filter_collabs')} className={cn("w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer", isDark ? "text-slate-500 bg-white/5" : "text-slate-500 bg-slate-100")}>
                                        <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={2} />
                                    </button>
                                </div>
                                <div className={cn("flex gap-2 p-1 rounded-lg", isDark ? "bg-white/5" : "bg-slate-100")}>
                                    <button className={cn("flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm", isDark ? "bg-white/10" : "bg-white")}>INTAKE ({acceptedDeals.length})</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[11px] font-bold">CONTRACTING</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[11px] font-bold">EXECUTING</button>
                                </div>
                            </div>

                            <div className="px-5 py-20 flex flex-col items-center justify-center text-center space-y-4">
                                {acceptedDeals.length === 0 ? (
                                    <>
                                        <ShieldCheck className={cn("w-12 h-12", isDark ? "text-white/10" : "text-slate-300")} strokeWidth={1.5} />
                                        <h3 className={cn("text-[16px] font-bold", isDark ? "text-white" : "text-slate-900")}>No active contracts</h3>
                                        <p className={cn("text-[14px] max-w-[250px]", isDark ? "text-slate-500" : "text-slate-500")}>Accept an offer from the dashboard to initiate your secure collaboration flow.</p>
                                    </>
                                ) : (
                                    <div className="w-full space-y-4">
                                        {acceptedDeals.map(deal => (
                                            <div key={deal} className={cn("p-4 rounded-xl border flex items-center justify-between", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100")}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                        <Check className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={cn("text-[14px] font-bold", isDark ? "text-white" : "text-slate-900")}>{deal}</p>
                                                        <p className="text-[11px] text-emerald-500 font-bold uppercase">Contract Pending</p>
                                                    </div>
                                                </div>
                                                <button className="text-blue-500 text-[12px] font-bold">Review</button>
                                            </div>
                                        ))}
                                    </div>
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
                                    <h2 className="text-[32px] font-bold text-white tracking-tight relative z-10">₹3,45,000</h2>
                                    <div className="mt-8 flex items-center justify-between border-t border-slate-700/50 pt-5 relative z-10">
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Next Payout</p>
                                            <p className="text-[14px] font-bold text-white">Oct 12, 2026</p>
                                        </div>
                                        <button onClick={() => handleAction('withdraw')} className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[13px] font-black shadow-lg shadow-white/10 active:scale-95 transition-all">Withdraw</button>
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
                                    <button onClick={() => handleAction('configure_profile')} className={cn("text-[12px] font-bold px-4 py-1.5 rounded-lg uppercase tracking-wider active:scale-95 transition-all font-mono", isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500")}>Edit</button>
                                </div>
                            </div>
                            <div className="px-5 pt-8 flex flex-col items-center">
                                <div className={cn("w-28 h-28 rounded-full p-1 shadow-2xl transition-all hover:scale-105", isDark ? "bg-blue-500/10 shadow-blue-500/5" : "bg-blue-500/5 shadow-slate-200")}>
                                    <img src={avatarUrl} alt="User" className="w-full h-full rounded-full object-cover border-4 border-transparent shadow-inner" />
                                </div>
                                <h2 className={cn("text-[24px] font-black mt-6 tracking-tight", isDark ? "text-white" : "text-slate-900")}>@{username}</h2>
                                <p className={cn("text-[15px] font-medium mt-1", secondaryTextColor)}>{userEmail || 'creator@example.com'}</p>

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
                            onClick={() => { triggerHaptic(); navigate('/creator-profile'); }}
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
        </div>
    );
};

export default MobileDashboardDemo;
