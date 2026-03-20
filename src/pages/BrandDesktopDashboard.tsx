import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Bell, User, Plus, FileText, CheckCircle2,
    Clock, TrendingUp, LayoutDashboard, CreditCard, Shield,
    Settings, MoreHorizontal, ArrowRight, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { StatCard, SectionCard } from '@/components/ui/card-variants';

const BrandDesktopDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pipeline');
    const isDark = true; // Default to true to match new system, assuming 'theme' context is not available here.

    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const bgColor = isDark ? 'bg-black' : 'bg-slate-50';

    return (
        <div className={cn("min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden", bgColor, textColor)}>

            {/* Spotlight Background Effect */}
            {isDark && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
                </div>
            )}

            {/* Top Navigation Bar - Premium Glassmorphism */}
            <header className={cn(
                "h-20 border-b px-8 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl transition-all duration-300",
                isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-slate-200"
            )}>
                <div className="flex items-center gap-12">
                    {/* Brand Identity */}
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className={cn("text-[16px] font-black tracking-tight font-outfit uppercase", textColor)}>
                                Nike India
                            </h1>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-40", textColor)}>
                                Brand Console
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {[
                            { id: 'pipeline', label: 'Pipeline', icon: LayoutDashboard },
                            { id: 'creators', label: 'Creators', icon: User },
                            { id: 'payments', label: 'Payments', icon: CreditCard },
                            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "px-4 py-2 text-[13px] font-bold rounded-[14px] transition-all flex items-center gap-2",
                                    activeTab === item.id
                                        ? (isDark ? "bg-white/10 text-white" : "bg-slate-900 text-white")
                                        : (isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")
                                )}
                            >
                                <item.icon className="w-4 h-4 opacity-70" strokeWidth={2.5} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {/* Search Bar */}
                    <div className="relative hidden xl:block w-72">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 opacity-40" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find creator or campaign..."
                            className={cn(
                                "block w-full pl-11 pr-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all focus:outline-none focus:ring-4 placeholder:opacity-40",
                                isDark
                                    ? "bg-white/5 border-white/10 text-white focus:ring-blue-500/10 focus:border-blue-500/50"
                                    : "bg-slate-100 border-slate-200 text-slate-900 focus:ring-slate-900/5 focus:border-slate-900/20"
                            )}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className={cn(
                                "text-[10px] font-black border rounded-lg px-2 py-1 opacity-20",
                                isDark ? "border-white" : "border-black"
                            )}>⌘K</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ring-inset",
                            isDark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}>
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-black" />
                        </button>

                        <button className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
                            isDark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}>
                            <Settings className="w-5 h-5" />
                        </button>

                        <div className="h-8 w-[1px] mx-2 opacity-10 bg-current" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className={cn("text-[12px] font-black font-outfit", textColor)}>Priya S.</p>
                                <p className={cn("text-[10px] opacity-40 uppercase font-black tracking-widest", textColor)}>Admin</p>
                            </div>
                            <button className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20">
                                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <img
                                        src="https://i.pravatar.cc/150?img=32"
                                        className="w-full h-full object-cover"
                                        alt="User"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Priya+S&background=random&color=fff`;
                                        }}
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1440px] mx-auto px-8 py-10">

                {/* Header & Primary Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h2 className={cn("text-[32px] font-black tracking-tight font-outfit mb-1", textColor)}>Active Pipeline</h2>
                        <div className="flex items-center gap-3">
                            <p className={cn("text-[15px] font-medium opacity-50", textColor)}>Manage your creator partnerships and deal closures</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className={cn("text-[12px] font-black uppercase tracking-widest text-blue-500")}>Real-time updates</span>
                        </div>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { triggerHaptic(HapticPatterns.success); navigate('/create-deal'); }}
                        className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] text-[14px] font-black shadow-xl shadow-blue-600/20 flex items-center gap-3 hover:bg-blue-500 transition-all uppercase tracking-widest group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" strokeWidth={3} />
                        Send New Offer
                    </motion.button>
                </div>

                <div className="grid grid-cols-12 gap-8">

                    {/* Left Column: Pipeline Table */}
                    <div className="col-span-12 lg:col-span-9 space-y-8">

                        {/* Pipeline Filter Strip */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { id: 'all', label: 'All Stages', count: 12 },
                                { id: 'action', label: 'Needs Action', count: 2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                { id: 'active', label: 'Active', count: 8, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { id: 'completed', label: 'Completed', count: 42, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    className={cn(
                                        "px-5 py-2.5 rounded-2xl text-[13px] font-black border transition-all flex items-center gap-3 whitespace-nowrap",
                                        filter.id === 'all'
                                            ? (isDark ? "bg-white text-black border-white" : "bg-slate-900 text-white border-slate-900")
                                            : (isDark ? "bg-white/5 text-white/60 border-white/5 hover:border-white/10" : "bg-white text-slate-500 border-slate-100 shadow-sm")
                                    )}
                                >
                                    {filter.label}
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[10px]",
                                        filter.bg || (isDark ? "bg-white/20" : "bg-slate-100")
                                    )}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Pipeline Table Container */}
                        <SectionCard
                            variant="tertiary"
                            className="overflow-visible"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className={cn(
                                            "border-b",
                                            isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/50 border-slate-100"
                                        )}>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Creator Partnership</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Current Status</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Timeline</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Investment</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] opacity-40 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className={cn("divide-y", isDark ? "divide-white/5" : "divide-slate-100")}>

                                        {/* Row 1: High Priority / Countered */}
                                        <tr className={cn("group transition-all", isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/50")}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden border border-white/10 bg-white/5 p-[2px]">
                                                        <img
                                                            src="https://i.pravatar.cc/150?img=47"
                                                            className="w-full h-full object-cover rounded-[1.1rem]"
                                                            alt="Creator"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Blooming&background=0D8ABC&color=fff`;
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className={cn("text-[16px] font-black font-outfit", textColor)}>@thebloomingmiss</div>
                                                        <div className={cn("text-[12px] font-bold opacity-40 uppercase tracking-widest")}>1 Instagram Reel</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                    <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">Countered</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn("text-[14px] font-bold font-outfit", textColor)}>Oct 15, 2025</div>
                                                <div className={cn("text-[11px] text-orange-500 font-black uppercase tracking-widest mt-0.5")}>Review Required</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn("text-[15px] font-black font-outfit", textColor)}>₹60,000</div>
                                                <div className={cn("text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5")}>Offer Sent</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className={cn(
                                                    "px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all",
                                                    isDark ? "bg-white text-black hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-900/10"
                                                )}>
                                                    Review
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Row 2: Active / Payment Due */}
                                        <tr className={cn("group transition-all", isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/50")}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                        <span className="text-xl">📸</span>
                                                    </div>
                                                    <div>
                                                        <div className={cn("text-[16px] font-black font-outfit", textColor)}>@techninja</div>
                                                        <div className={cn("text-[12px] font-bold opacity-40 uppercase tracking-widest")}>YouTube Deep-Dive</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Payment Due</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn("text-[14px] font-bold font-outfit", textColor)}>Oct 12, 2025</div>
                                                <div className={cn("text-[11px] text-red-500 font-black uppercase tracking-widest mt-0.5")}>Urgent: Tomorrow</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn("text-[15px] font-black font-outfit", textColor)}>₹45,000</div>
                                                <div className={cn("text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5")}>Escrow Ready</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                                                    Fund Now
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Row 3: Accepted */}
                                        <tr className={cn("group transition-all", isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/50")}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden border border-white/10 bg-white/5 p-[2px]">
                                                        <img
                                                            src="https://i.pravatar.cc/150?img=12"
                                                            className="w-full h-full object-cover rounded-[1.1rem]"
                                                            alt="Creator"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Style&background=6366f1&color=fff`;
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className={cn("text-[16px] font-black font-outfit", textColor)}>@stylewithme</div>
                                                        <div className={cn("text-[12px] font-bold opacity-40 uppercase tracking-widest")}>2x Stories + 1 Post</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Accepted</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn("text-[14px] font-bold font-outfit", textColor)}>Oct 20, 2025</div>
                                                <div className={cn("text-[11px] font-medium opacity-40 uppercase tracking-widest mt-0.5")}>Agreement Signed</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn("text-[15px] font-black font-outfit", textColor)}>₹85,000</div>
                                                <div className={cn("text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-0.5")}>+ ₹15k Adjusted</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all ml-auto",
                                                    isDark ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                )}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>

                                    </tbody>
                                </table>
                            </div>

                            {/* Table Footer / Pagination */}
                            <div className={cn(
                                "px-8 py-5 flex items-center justify-between border-t",
                                isDark ? "bg-white/[0.01] border-white/5" : "bg-slate-50/30 border-slate-100"
                            )}>
                                <span className={cn("text-[12px] font-black opacity-30 uppercase tracking-[0.15em]", textColor)}>
                                    Showing 3 of 12 active partnerships
                                </span>
                                <button className={cn("text-[12px] font-black uppercase tracking-widest text-blue-500 hover:opacity-70 transition-opacity")}>
                                    View Full Pipeline <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                                </button>
                            </div>
                        </SectionCard>

                    </div>

                    {/* Right Column: Insights & Stats */}
                    <div className="col-span-12 lg:col-span-3 space-y-8">

                        {/* Financial Powercard */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-8"
                        >
                            <StatCard
                                label="Financial Snapshot"
                                value="₹75,000"
                                icon={<Shield className="w-5 h-5 text-emerald-500" />}
                                subtitle="In Escrow Protection"
                                trend={{ value: 12, isPositive: true }}
                                variant="tertiary"
                                className="p-8 h-auto"
                            />

                            <StatCard
                                label="Awaiting Funding"
                                value="₹45,000"
                                icon={<CreditCard className="w-5 h-5 text-red-500" />}
                                subtitle="Payment gap detected"
                                trend={{ value: 5, isPositive: false }}
                                variant="tertiary"
                                className="p-8 h-auto"
                            />
                            <button className={cn(
                                "w-full mt-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest border transition-all active:scale-[0.97]",
                                isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"
                            )}>
                                View Detailed Invoices
                            </button>
                        </motion.div>

                        {/* Recent Activity Mini-Feed */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <SectionCard
                                title="Activity Ledger"
                                icon={<Activity className="w-4 h-4 text-blue-500" />}
                                variant="tertiary"
                                className="p-8 h-auto"
                            >
                                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                                    {[
                                        { user: '@thebloomingmiss', event: 'countered offer', time: '2h ago', icon: FileText, color: 'blue' },
                                        { user: '@stylewithme', event: 'signed agreement', time: 'Yesterday', icon: CheckCircle2, color: 'emerald' },
                                        { user: '@techninja', event: 'reached milestone', time: '2 days ago', icon: TrendingUp, color: 'purple' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex gap-4 relative z-10">
                                            <div className={cn(
                                                "w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center bg-[#0d0d0f]",
                                                isDark ? "border-white/10" : "border-slate-100"
                                            )}>
                                                <item.icon className={cn("w-2.5 h-2.5", `text-${item.color}-500`)} />
                                            </div>
                                            <div>
                                                <p className={cn("text-[13px] font-bold leading-tight", textColor)}>
                                                    <span className="font-outfit font-black">{item.user}</span> {item.event}
                                                </p>
                                                <p className={cn("text-[10px] font-black uppercase tracking-[0.1em] opacity-30 mt-1")}>{item.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className={cn(
                                    "w-full mt-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all",
                                    isDark ? "text-white/30 hover:text-white" : "text-slate-400 hover:text-slate-900"
                                )}>
                                    View Global Audit Log
                                </button>
                            </SectionCard>
                        </motion.div>

                    </div>

                </div>
            </main>
        </div>
    );
};


export default BrandDesktopDashboard;
