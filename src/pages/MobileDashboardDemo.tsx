import React from 'react';
import { motion } from 'framer-motion';
import {
    Bell, MessageCircle, BarChart3, Target, Calendar,
    TrendingUp, Check, ChevronRight, Share, CheckCircle2,
    Home, Briefcase, Plus, MessageSquare, User, Zap, Lock, Award, FileText, Search, Shield, ShieldCheck, Clock,
    LayoutDashboard, Link as LinkIcon, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';
import { useNavigate } from 'react-router-dom';

interface MobileDashboardProps {
    profile?: any;
    userEmail?: string;
    collabRequests?: any[];
}

const MobileDashboardDemo = ({ profile, userEmail, collabRequests = [] }: MobileDashboardProps = {}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const isDemoUser = userEmail === 'notice2@yopmail.com';
    const username = profile?.username || profile?.full_name || 'Creator';
    const avatarUrl = profile?.avatar_url || "https://i.pravatar.cc/150?img=47";

    React.useEffect(() => {
        // Change theme color for this specific page to blend with white header
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        const originalColor = metaThemeColor?.getAttribute("content");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", "#ffffff");
        }

        // Force body background to hide any Layout gradients bleeding in safe areas
        const originalBodyBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffffff';

        return () => {
            if (metaThemeColor && originalColor) {
                metaThemeColor.setAttribute("content", originalColor);
            }
            document.body.style.backgroundColor = originalBodyBg;
        };
    }, []);

    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] sm:bg-slate-100 flex justify-center overflow-hidden selection:bg-blue-100" style={{ backgroundColor: '#ffffff' }}>

            {/* Mobile / Tablet Screen Container */}
            <div className="w-full md:max-w-3xl lg:max-w-5xl mx-auto relative h-[100dvh] sm:h-[100dvh] md:border-x md:border-slate-200 text-slate-900 font-sans flex flex-col" style={{ background: 'linear-gradient(180deg, #F6F8FB 0%, #EEF1F7 100%)', boxShadow: '0 0 50px rgba(0,0,0,0.05)' }}>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[84px] scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {activeTab === 'dashboard' && (
                        <>
                            {/* Top Header Section */}
                            <div className="px-5 pb-5 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50 transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)', transform: 'translateZ(0)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex shrink-0">
                                            <img
                                                src={avatarUrl}
                                                alt="Profile avatar"
                                                className="w-11 h-11 rounded-full border border-slate-200 object-cover shadow-sm"
                                            />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                            </div>
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold flex items-center gap-1 line-clamp-1 text-slate-900 tracking-tight">
                                                Hey, @{username}
                                            </h1>
                                            <p className="text-[13px] text-slate-500 font-medium">New collab opportunities await 👋</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={triggerHaptic} className="relative w-10 h-10 bg-[#F8F9FA] rounded-full flex items-center justify-center border border-slate-100 text-slate-600 hover:bg-slate-100 transition-colors active:scale-95">
                                            <Bell className="w-5 h-5" />
                                            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="mt-4 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200/80 rounded-xl leading-5 bg-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[14px] font-medium text-slate-900 transition-all shadow-sm"
                                        placeholder="Search brands, collabs, or contracts..."
                                    />
                                </div>
                            </div>

                            <div className="px-5 space-y-6 pt-5 pb-20">
                                {/* Top Cards Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Available Deals Card */}
                                    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider">Deals Inbox</p>
                                            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                                <Briefcase className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-3xl font-bold text-slate-900 tracking-tight">12</span>
                                            <span className="text-[13px] text-slate-500 font-medium">pending</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">5 NEW</span>
                                        </div>
                                    </div>

                                    {/* Total Earnings Card */}
                                    <div className="rounded-2xl p-4 shadow-xl relative overflow-hidden" style={{ backgroundColor: '#0F172A' }}>
                                        <Shield className="absolute -right-6 -bottom-6 w-40 h-40 text-blue-50 opacity-5 -rotate-12" strokeWidth={1} />
                                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-500 rounded-full blur-2xl opacity-10" />
                                        <div className="flex justify-between items-start mb-1 relative z-10">
                                            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Vault Balance</p>
                                        </div>
                                        <p className="text-[26px] font-bold text-white tracking-tight leading-tight relative z-10 mt-1">
                                            ₹3,45,000
                                        </p>
                                        <div className="relative z-10 mt-2 flex items-center gap-1.5">
                                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                                                <CheckCircle2 className="w-3 h-3" /> Earned via secured deals
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Filter Pills */}
                                <div className="flex gap-2 overflow-x-auto pb-4 pt-1 snap-x mb-2 scrollbar-hide -mx-5 px-5">
                                    <button className="snap-start shrink-0 text-white px-5 py-2 rounded-full text-[13px] font-semibold flex items-center shadow-md border" style={{ backgroundColor: '#0F172A', borderColor: '#0F172A' }}>
                                        Action Needed <span className="ml-1.5 text-slate-400 opacity-90">5</span>
                                    </button>
                                    <button className="snap-start shrink-0 bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-full text-[13px] font-medium shadow-sm hover:bg-slate-50 transition-colors flex items-center">
                                        In Negotiation <span className="ml-1.5 opacity-60">2</span>
                                    </button>
                                    <button className="snap-start shrink-0 bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-full text-[13px] font-medium shadow-sm hover:bg-slate-50 transition-colors flex items-center">
                                        Active Contracts <span className="ml-1.5 opacity-60">4</span>
                                    </button>
                                </div>

                                {/* Brand Offers Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight flex items-center gap-1.5 pt-1">
                                            <Lock className="w-4 h-4 text-emerald-600 mb-0.5" /> Secured Deal Offers
                                        </h2>
                                        <button className="text-[13px] text-blue-600 font-semibold flex items-center gap-0.5 hover:text-blue-700 transition-colors">
                                            View All <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                                        {/* Offer Card - iOS depth styling */}
                                        <div className="bg-white rounded-[20px] p-5 border border-slate-200/80 relative overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)' }}>
                                            {/* Brand Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0" style={{ backgroundColor: '#0F172A' }}>
                                                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 8.216c-3.111.96-6.666 1.838-10.592 1.838-5.333 0-10.37-.878-13.408-2.676v.053c0 6.666 4.667 9.889 10.963 9.889 4.333 0 8.703-1.89 13.037-5.592v-3.512z" /></svg>
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <h3 className="font-bold text-[17px] text-slate-900 leading-none tracking-tight">Nike India</h3>
                                                        </div>
                                                        {/* Brand Reliability Indicator */}
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[11px] text-slate-600 font-medium">Responds Fast</span>
                                                        </div>
                                                        {/* Experience Indicator */}
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <span className="text-amber-500 text-[10px]">⭐</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">Worked with creators before</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-slate-900 font-bold text-xl tracking-tight leading-none mb-1">
                                                        ₹75,000
                                                    </div>
                                                    <div className="text-[10px] text-emerald-700 font-bold px-1.5 py-0.5 rounded-sm inline-block" style={{ backgroundColor: 'rgba(209, 250, 229, 0.8)' }}>
                                                        Escrow Ready
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trust Layer Badges */}
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-1.5 mb-4">
                                                <span className="text-emerald-700 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-100/50" style={{ backgroundColor: 'rgba(236, 253, 245, 1)' }}>
                                                    <Lock className="w-3 h-3" /> Payment Secured
                                                </span>
                                                <span className="text-blue-700 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-blue-100/50" style={{ backgroundColor: 'rgba(239, 246, 255, 1)' }}>
                                                    <FileText className="w-3 h-3" /> Contract Ready
                                                </span>
                                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-200/50" style={{ backgroundColor: '#F8F9FA' }}>
                                                    <Award className="w-3 h-3 text-amber-500" /> Brand Verified
                                                </motion.span>
                                            </motion.div>

                                            <div className="h-[1px] bg-slate-100 w-full mb-4" />

                                            {/* Details & Urgency */}
                                            <div className="space-y-3 mb-5">
                                                <div className="flex items-start gap-2">
                                                    <p className="text-[13px] text-slate-500 w-[70px] shrink-0 font-medium">Requires</p>
                                                    <p className="text-[13px] text-slate-900 font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        2 Reels + 3 Stories
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <p className="text-[13px] text-slate-500 w-[70px] shrink-0 font-medium">Expires</p>
                                                    {/* Upgraded Urgency */}
                                                    <motion.div
                                                        animate={{ boxShadow: ["0 0 0px 0px rgba(249, 115, 22, 0)", "0 0 10px 2px rgba(249, 115, 22, 0.15)", "0 0 0px 0px rgba(249, 115, 22, 0)"] }}
                                                        transition={{ repeat: Infinity, duration: 3 }}
                                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-orange-200"
                                                        style={{ backgroundColor: 'rgba(255, 247, 237, 1)' }}
                                                    >
                                                        <Zap className="w-3.5 h-3.5 text-orange-500 fill-current" />
                                                        <p className="text-[12px] text-orange-700 font-bold tracking-tight">
                                                            Offer expires in 5 days
                                                        </p>
                                                    </motion.div>
                                                </div>
                                            </div>

                                            <div className="h-[1px] bg-black/5 w-full mb-3 mt-4" />

                                            {/* Horizontal Action Stack */}
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    onClick={triggerHaptic}
                                                    whileTap={{ scale: 0.97 }}
                                                    animate={{ boxShadow: ["0px 4px 16px rgba(15,23,42,0.2)", "0px 4px 24px rgba(16,185,129,0.3)", "0px 4px 16px rgba(15,23,42,0.2)"] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="flex-[2] py-3.5 px-3 rounded-xl font-bold text-[14px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                    style={{ backgroundColor: '#0F172A' }}
                                                >
                                                    Accept Deal <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                                </motion.button>
                                                <button onClick={triggerHaptic} className="flex-[1.2] py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-95">
                                                    Negotiate
                                                </button>
                                                <button onClick={triggerHaptic} className="flex-1 py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center active:scale-95">
                                                    Question?
                                                </button>
                                            </div>
                                        </div>

                                        {/* Offer Card 2 - mCaffeine */}
                                        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/80 relative overflow-hidden">
                                            {/* Brand Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-12 h-12 bg-[#FFFDF5] rounded-xl flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                                                        <span className="text-slate-900 font-serif italic font-bold leading-tight text-center text-[13px]">m<br />caffeine</span>
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <h3 className="font-bold text-[17px] text-slate-900 leading-none tracking-tight">mCaffeine</h3>
                                                        </div>
                                                        {/* Brand Reliability Indicator */}
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                            <span className="text-[11px] text-slate-600 font-medium">Avg Response: 48h</span>
                                                        </div>
                                                        {/* First Time Indicator */}
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <div className="w-[14px] h-[14px] rounded-full bg-purple-100 flex items-center justify-center">
                                                                <span className="text-[8px]">🟣</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-medium tracking-tight">New on Creator Armour</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-slate-900 font-bold text-xl tracking-tight leading-none mb-1">
                                                        ₹32,500
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trust Layer Badges */}
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                <span className="text-emerald-700 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-100/50" style={{ backgroundColor: 'rgba(236, 253, 245, 1)' }}>
                                                    <Lock className="w-3 h-3" /> Payment Secured
                                                </span>
                                                <span className="text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-200/50" style={{ backgroundColor: '#F8F9FA' }}>
                                                    <Award className="w-3 h-3 text-amber-500" /> Brand Verified
                                                </span>
                                            </div>

                                            {/* Divider for native feel */}
                                            <div className="h-[1px] bg-black/5 w-full mt-4 mb-4" />

                                            {/* Details & Urgency */}
                                            <div className="space-y-3 mb-5">
                                                <div className="flex items-start gap-2">
                                                    <p className="text-[13px] text-slate-500 w-[70px] shrink-0 font-medium">Requires</p>
                                                    <p className="text-[13px] text-slate-900 font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        1 Reel + 1 Story + Shoutout
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <p className="text-[13px] text-slate-500 w-[70px] shrink-0 font-medium">Expires</p>
                                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                                                        <Calendar className="w-3 h-3 text-slate-500" />
                                                        <p className="text-[12px] text-slate-700 font-medium tracking-tight">
                                                            Offer expires in 7 days
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-[1px] bg-black/5 w-full mb-3 mt-4" />

                                            {/* Horizontal Action Stack */}
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    onClick={triggerHaptic}
                                                    whileTap={{ scale: 0.97 }}
                                                    animate={{ boxShadow: ["0px 4px 16px rgba(15,23,42,0.2)", "0px 4px 24px rgba(16,185,129,0.3)", "0px 4px 16px rgba(15,23,42,0.2)"] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="flex-[2] py-3.5 px-3 rounded-xl font-bold text-[14px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                    style={{ backgroundColor: '#0F172A' }}
                                                >
                                                    Accept Deal <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                                </motion.button>
                                                <button onClick={triggerHaptic} className="flex-[1.2] py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-95">
                                                    Negotiate
                                                </button>
                                                <button onClick={triggerHaptic} className="flex-1 py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center active:scale-95">
                                                    Question?
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dynamic Deal Cards (Mapped from actual database) */}
                                        {Array.isArray(collabRequests) && collabRequests.map((req, idx) => (
                                            <div key={req.id || idx} className="bg-white rounded-[20px] p-5 border border-slate-200/80 relative overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)' }}>
                                                {/* Brand Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex gap-3 items-center">
                                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0" style={{ backgroundColor: '#F8F9FA' }}>
                                                            <span className="text-slate-700 font-bold text-[20px] uppercase">{req.brand_name?.charAt(0) || 'B'}</span>
                                                        </div>
                                                        <div className="flex flex-col justify-center">
                                                            <div className="flex items-center gap-1.5">
                                                                <h3 className="font-bold text-[17px] text-slate-900 leading-none tracking-tight">{req.brand_name || 'Brand'}</h3>
                                                            </div>
                                                            {/* Brand Indicator */}
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span className="text-[11px] text-slate-600 font-medium">New Offer</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-slate-900 font-bold text-xl tracking-tight leading-none mb-1">
                                                            ₹{req.exact_budget ? req.exact_budget.toLocaleString('en-IN') : (req.budget_range || 'TBD')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Trust Layer Badges */}
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    <span className="text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-200/50" style={{ backgroundColor: '#F8F9FA' }}>
                                                        <Award className="w-3 h-3 text-amber-500" /> Pending Action
                                                    </span>
                                                </div>

                                                <div className="h-[1px] bg-slate-100 w-full mb-4" />

                                                {/* Details & Urgency */}
                                                <div className="space-y-3 mb-5">
                                                    <div className="flex items-start gap-2">
                                                        <p className="text-[13px] text-slate-500 w-[70px] shrink-0 font-medium">Requires</p>
                                                        <p className="text-[13px] text-slate-900 font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            {req.collab_type || 'Content Creation'}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[13px] text-slate-500 w-[70px] shrink-0 font-medium">Expires</p>
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200" style={{ backgroundColor: '#F8F9FA' }}>
                                                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                            <p className="text-[12px] text-slate-700 font-medium tracking-tight">
                                                                Awaiting review
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="h-[1px] bg-black/5 w-full mb-3 mt-4" />

                                                {/* Horizontal Action Stack */}
                                                <div className="flex items-center gap-2">
                                                    <motion.button onClick={triggerHaptic} whileTap={{ scale: 0.97 }} className="flex-[2] py-3.5 px-3 rounded-xl font-bold text-[14px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5 active:scale-95" style={{ backgroundColor: '#0F172A' }}>
                                                        Review Deal <Check className="w-4 h-4 text-white" />
                                                    </motion.button>
                                                    <button onClick={triggerHaptic} className="flex-[1.2] py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-95">
                                                        Negotiate
                                                    </button>
                                                    <button onClick={triggerHaptic} className="flex-1 py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center active:scale-95">
                                                        Question?
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                </section>

                                <div className="h-6" />

                            </div> {/* End Padding Content Body */}
                        </>)}

                    {/* Collabs Tab View */}
                    {activeTab === 'collabs' && (
                        <>
                            <div className="px-5 pb-5 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-[110] transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Collabs</h1>
                                    <button onClick={triggerHaptic} className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200"><Search className="w-4 h-4" /></button>
                                </div>
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                    <button className="px-4 py-1.5 bg-[#0F172A] text-white rounded-full text-[13px] font-bold shrink-0">Action Needed</button>
                                    <button className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[13px] font-bold shrink-0">Active</button>
                                    <button className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[13px] font-bold shrink-0">Past</button>
                                </div>
                            </div>
                            <div className="px-5 pt-6 space-y-4">
                                {/* Deal Item */}
                                <div className="bg-white rounded-[20px] p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                        <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">Brand Countered</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">N</div>
                                            <div>
                                                <h3 className="font-bold text-[15px] text-slate-900">Nike India</h3>
                                                <p className="text-[12px] text-slate-500">1 Reel + 1 Story</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
                                        <div className="flex justify-between text-[13px]">
                                            <span className="text-slate-500">Counter Budget:</span>
                                            <span className="font-bold text-slate-900">₹85,000</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={triggerHaptic} className="flex-[2] py-2.5 bg-[#0F172A] text-white rounded-lg text-[13px] font-bold hover:bg-slate-800">Approve</button>
                                        <button onClick={triggerHaptic} className="flex-1 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[13px] font-bold">Decline</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Payments Tab View */}
                    {activeTab === 'payments' && (
                        <>
                            <div className="px-5 pb-5 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-[110] transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Ledger</h1>
                            </div>
                            <div className="px-5 pt-6 space-y-6">
                                <div className="bg-[#0F172A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                    <Shield className="absolute -right-6 -bottom-6 w-40 h-40 text-blue-50 opacity-5 -rotate-12" strokeWidth={1} />
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-slate-500 rounded-full blur-3xl opacity-20" />
                                    <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Vault Balance</p>
                                    <h2 className="text-[32px] font-bold text-white tracking-tight relative z-10">₹3,45,000</h2>

                                    <div className="mt-6 flex items-center justify-between border-t border-slate-700/50 pt-4 relative z-10">
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Next Payout</p>
                                            <p className="text-[13px] font-bold text-white">Oct 12, 2026</p>
                                        </div>
                                        <button onClick={triggerHaptic} className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[12px] font-bold">Withdraw</button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[15px] font-bold text-slate-900 mb-3">Recent Transactions</h3>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Check className="w-5 h-5" /></div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-slate-900">Escrow Released</p>
                                                        <p className="text-[11px] text-slate-500">TechNinja Collab</p>
                                                    </div>
                                                </div>
                                                <span className="text-[14px] font-bold text-emerald-600">+₹45,000</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Profile Tab View */}
                    {activeTab === 'profile' && (
                        <>
                            <div className="px-5 pb-5 bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-[110] transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Settings</h1>
                                    <button onClick={triggerHaptic} className="text-[13px] font-bold text-blue-600">Edit</button>
                                </div>
                            </div>
                            <div className="px-5 pt-4 space-y-6">
                                <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <img src={avatarUrl} alt="User" className="w-16 h-16 rounded-full border border-slate-200" />
                                    <div>
                                        <h2 className="text-[18px] font-bold text-slate-900">@{username}</h2>
                                        <p className="text-[13px] text-slate-500">{userEmail || 'creator@example.com'}</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-4 flex items-center justify-between border-b border-slate-100 active:bg-slate-50 transition-colors" onClick={triggerHaptic}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><FileText className="w-4 h-4" /></div>
                                            <span className="text-[14px] font-bold text-slate-900">Tax & GST Info</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="p-4 flex items-center justify-between border-b border-slate-100 active:bg-slate-50 transition-colors" onClick={triggerHaptic}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><CreditCard className="w-4 h-4" /></div>
                                            <span className="text-[14px] font-bold text-slate-900">Bank Accounts</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors" onClick={triggerHaptic}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600"><Lock className="w-4 h-4" /></div>
                                            <span className="text-[14px] font-bold text-red-600">Logout</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div> {/* End Scrollable Content Area */}

                {/* Floating Bottom Navigation */}
                <div className="absolute bottom-0 inset-x-0 w-full border-t border-slate-200/60 px-6 py-2 pb-safe z-40" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.75)' }}>
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between pb-4 pt-2">

                        <button onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className={`flex flex-col items-center gap-1 w-14 font-bold hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400 font-medium'}`}>
                            <LayoutDashboard className="w-[22px] h-[22px] fill-current" />
                            <span className="text-[10px]">Dashboard</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className={`flex flex-col items-center gap-1 w-14 relative hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'collabs' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                            <Briefcase className={`w-[22px] h-[22px] ${activeTab === 'collabs' ? 'fill-slate-900' : ''}`} />
                            <span className="absolute top-0 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm">5</span>
                            <span className="text-[10px]">Collabs</span>
                        </button>

                        {/* Center Action Button: Collab Link Engine */}
                        <button
                            onClick={() => { triggerHaptic(); navigate('/creator-profile'); }}
                            className="transform -translate-y-3 px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-white font-bold text-[13px] hover:opacity-90 active:opacity-75 transition-opacity shrink-0 relative"
                            style={{ backgroundColor: '#0F172A', boxShadow: '0px 6px 16px rgba(15,23,42,0.15), 0px 2px 4px rgba(15,23,42,0.08)' }}
                        >
                            <LinkIcon className="w-4 h-4" strokeWidth={2.5} />
                            Collab Link
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className={`flex flex-col items-center gap-1 w-14 relative hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'payments' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                            <CreditCard className={`w-[22px] h-[22px] ${activeTab === 'payments' ? 'fill-slate-900' : ''}`} />
                            <span className="text-[10px]">Payments</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className={`flex flex-col items-center gap-1 w-14 hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'profile' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                            <User className={`w-[22px] h-[22px] ${activeTab === 'profile' ? 'fill-slate-900' : ''}`} />
                            <span className="text-[10px]">Profile</span>
                        </button>
                    </div>

                    {/* iOS Home Indicator mock */}
                    <div className="w-[130px] h-1.5 bg-slate-900 rounded-full mx-auto mb-2" />
                </div>

            </div> {/* End Mobile Container */}
        </div>
    );
};

export default MobileDashboardDemo;
