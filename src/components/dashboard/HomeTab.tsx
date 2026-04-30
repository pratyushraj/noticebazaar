import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
    Menu, Zap, BarChart3, Shield, Landmark, Clock, MessageSquare 
} from 'lucide-react';
import { ShimmerSkeleton } from '@/components/ui/ShimmerSkeleton';

interface HomeTabProps {
    isDark: boolean;
    textColor: string;
    secondaryTextColor: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    handleAction: (action: string) => void;
    profile: any;
    avatarUrl: string;
    avatarFallbackUrl: string;
    monthlyRevenue: number;
    activeDealsCount: number;
    completedDealsCount: number;
    pendingOffersCount: number;
    isLoadingProfile: boolean;
    DashboardLoadingStage: any;
    triggerHaptic: (pattern?: any) => void;
    setActiveSettingsPage: (page: string | null) => void;
}

export const HomeTab = React.memo(({
    isDark, textColor, secondaryTextColor, activeTab, setActiveTab,
    handleAction, profile, avatarUrl, avatarFallbackUrl,
    monthlyRevenue, activeDealsCount, completedDealsCount, pendingOffersCount,
    isLoadingProfile, DashboardLoadingStage, triggerHaptic,
    setActiveSettingsPage
}: HomeTabProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="pb-24 overflow-x-hidden"
        >
            {/* Native Header */}
            <div className="relative z-20">
                <div className={cn(
                    "absolute inset-0 -z-10 overflow-hidden rounded-b-[40px] border-b transition-colors duration-500",
                    isDark ? "bg-[#0B1A14] border-emerald-900/20" : "bg-emerald-600 border-emerald-700 shadow-xl shadow-emerald-900/10"
                )}>
                    {/* Animated background element */}
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square bg-emerald-400/10 blur-[100px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-emerald-500/10 blur-[80px] rounded-full" />
                </div>

                <div className="px-5 pb-10 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                    <div className="flex items-center justify-between mb-8">
                        <button type="button" onClick={() => handleAction('menu')} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95", isDark ? "bg-white/5 border border-white/10" : "bg-white/20 border border-white/30 backdrop-blur-md")}>
                            <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </button>

                        <div className="flex items-center gap-1.5 font-black text-white text-[14px] uppercase tracking-widest italic">
                            <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                            <span>Creator Dashboard</span>
                        </div>

                        <button type="button" onClick={() => setActiveTab('profile')} className={cn("w-10 h-10 rounded-xl border p-0.5 overflow-hidden transition-all active:scale-95 shadow-lg", isDark ? "border-white/10 bg-white/5" : "border-white/30 bg-white/20")}>
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

                    <div className="space-y-1.5">
                        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/40 italic">Influencer Status</p>
                        <h1 className="text-[28px] font-black tracking-tight text-white italic uppercase leading-none">
                            Welcome back, {profile?.first_name || 'Creator'}!
                        </h1>
                        <div className="flex items-center gap-2 pt-1">
                            <div className="flex -space-x-1.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-emerald-900 bg-slate-800" />
                                ))}
                            </div>
                            <p className="text-[11px] font-bold text-white/50 italic">Verified in 12+ Brand Campaigns</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Scroll Content */}
            <div className="relative z-10 -mt-6 px-5 space-y-6">
                {/* Earnings Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        "p-8 rounded-[3.5rem] border relative overflow-hidden group shadow-2xl transition-all duration-500",
                        isDark ? "bg-[#0B1324] border-white/5" : "bg-white border-slate-200"
                    )}
                >
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-emerald-400" : "text-emerald-600")}>Estimated Earnings</p>
                            <div className="flex items-baseline gap-2 mt-3">
                                <span className={cn("text-[38px] font-black tracking-tighter leading-none", textColor)}>
                                    ₹{monthlyRevenue.toLocaleString()}
                                </span>
                                {completedDealsCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        +{(completedDealsCount > 5 ? 3 : 1)} Today
                                    </span>
                                )}
                            </div>
                            <p className={cn("text-[13px] font-bold mt-3 opacity-60", textColor)}>
                                {activeDealsCount} Collaboration{activeDealsCount === 1 ? '' : 's'} running
                            </p>
                        </div>
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", isDark ? "bg-white/5 border border-white/10" : "bg-slate-100 border border-slate-200")}>
                            <BarChart3 className={cn("w-6 h-6", isDark ? "text-white" : "text-slate-900")} />
                        </div>
                    </div>

                    {/* Integrated Actions Card if pending offers exist */}
                    {pendingOffersCount > 0 && (
                        <div className={cn("mt-8 p-6 rounded-[2.5rem] border transition-all duration-500", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <Zap className="w-6 h-6 fill-primary" />
                                    </div>
                                    <div>
                                        <p className={cn("text-[16px] font-black italic", textColor)}>{pendingOffersCount} Actions Pending</p>
                                        <p className={cn("text-[11px] font-bold opacity-40 uppercase tracking-widest", textColor)}>New offers waiting</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { triggerHaptic(); setActiveTab('deals'); }}
                                    className="px-6 h-12 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                >
                                    Review
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className={cn("absolute bottom-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full -mr-16 -mb-16 pointer-events-none transition-opacity duration-700", isDark ? "opacity-100" : "opacity-0")} />
                </motion.div>

                {/* Quick Actions / Lifestyle Shield */}
                <div className="space-y-4">
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

                {/* Offer Card for Offers Section (if loading or empty) */}
                <div className="space-y-4 pb-10">
                    <div className="flex items-center justify-between px-1">
                        <h3 className={cn("text-lg font-black italic uppercase tracking-tight", textColor)}>Available Offers</h3>
                        <button onClick={() => setActiveTab('deals')} className="text-[10px] font-black uppercase tracking-widest text-primary">View All</button>
                    </div>

                    {isLoadingProfile ? (
                        <div className="space-y-4">
                            <ShimmerSkeleton className="h-48 w-full rounded-[2.5rem]" />
                        </div>
                    ) : (
                        <div className={cn(
                            "p-8 rounded-[3rem] border flex flex-col gap-6 relative overflow-hidden",
                            isDark ? "bg-[#0B1324] border-white/5" : "bg-white border-slate-200 shadow-xl shadow-slate-200/20"
                        )}>
                            <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-500">
                                <Zap className="w-7 h-7 fill-violet-500" />
                            </div>
                            <div>
                                <h4 className={cn("text-xl font-black italic uppercase", textColor)}>Claim Your First Offer</h4>
                                <p className={cn("text-sm font-medium opacity-40 mt-1 leading-relaxed", textColor)}>
                                    Browse through hundreds of brands looking for creators like you.
                                </p>
                            </div>
                            <button 
                                onClick={() => { triggerHaptic(); setActiveTab('deals'); }}
                                className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all"
                            >
                                Start Discovering
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});
