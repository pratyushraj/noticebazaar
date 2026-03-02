import React from 'react';
import { motion } from 'framer-motion';
import {
    Bell, MessageCircle, BarChart3, Target, Calendar,
    TrendingUp, Check, ChevronRight, Share, CheckCircle2,
    Home, Briefcase, Plus, MessageSquare, User, Zap, Lock, Award, FileText, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';
import { useNavigate } from 'react-router-dom';

interface MobileDashboardProps {
    profile?: any;
    userEmail?: string;
}

const MobileDashboardDemo = ({ profile, userEmail }: MobileDashboardProps = {}) => {
    const navigate = useNavigate();
    const isDemoUser = userEmail === 'notice2@yopmail.com';
    const username = profile?.username || profile?.full_name || 'Creator';
    const avatarUrl = profile?.avatar_url || "https://i.pravatar.cc/150?img=47";

    return (
        <div className="fixed inset-0 z-[10000] sm:bg-slate-100 flex justify-center overflow-hidden selection:bg-blue-100" style={{ backgroundColor: '#ffffff' }}>

            {/* Mobile Screen Container */}
            <div className="w-full sm:max-w-[430px] relative h-[100dvh] sm:h-[100dvh] sm:shadow-[0_0_50px_rgba(0,0,0,0.12)] sm:border-x sm:border-slate-200 text-slate-900 font-sans flex flex-col" style={{ backgroundColor: '#F8F9FA' }}>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[84px] scrollbar-hide">
                    {/* Top Header Section */}
                    <div className="px-5 pt-12 pb-5 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-[110]">
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
                                <button className="relative w-10 h-10 bg-[#F8F9FA] rounded-full flex items-center justify-center border border-slate-100 text-slate-600 hover:bg-slate-100 transition-colors">
                                    <Search className="w-5 h-5" />
                                </button>
                                <button className="relative w-10 h-10 bg-[#F8F9FA] rounded-full flex items-center justify-center border border-slate-100 text-slate-600 hover:bg-slate-100 transition-colors">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</span>
                                </button>
                            </div>
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
                            <div className="rounded-2xl p-4 shadow-xl relative overflow-hidden" style={{ backgroundColor: '#0A2540' }}>
                                <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500 rounded-full blur-2xl opacity-20" />
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(224, 231, 255, 0.7)' }}>Vault Balance</p>
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
                                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Active Offers</h2>
                                <button className="text-[13px] text-blue-600 font-semibold flex items-center gap-0.5 hover:text-blue-700 transition-colors">
                                    View All <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Offer Card 1 - Nike */}
                                <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/80 relative overflow-hidden">
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

                                    <div className="h-[1px] bg-slate-100 w-full mb-3" />

                                    {/* Horizontal Action Stack */}
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            className="flex-[2] py-3.5 px-3 rounded-xl font-bold text-[14px] bg-[#10B981] shadow-[0_4px_16px_rgba(16,185,129,0.25)] text-white hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5"
                                        >
                                            Accept Deal <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                        </motion.button>
                                        <button className="flex-[1.2] py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                                            Negotiate
                                        </button>
                                        <button className="flex-1 py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center">
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

                                    <div className="h-[1px] bg-slate-100 w-full mb-4" />

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

                                    <div className="h-[1px] bg-slate-100 w-full mb-3" />

                                    {/* Horizontal Action Stack */}
                                    <div className="flex items-center gap-2">
                                        <motion.button whileTap={{ scale: 0.96 }} className="flex-[2] py-3.5 px-3 rounded-xl font-bold text-[14px] shadow-[0_4px_16px_rgba(15,23,42,0.2)] text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5" style={{ backgroundColor: '#0F172A' }}>
                                            Accept Deal <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                        </motion.button>
                                        <button className="flex-[1.2] py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                                            Negotiate
                                        </button>
                                        <button className="flex-1 py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center">
                                            Question?
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="h-6" />

                    </div> {/* End Padding Content Body */}
                </div> {/* End Scrollable Content Area */}

                {/* Floating Bottom Navigation */}
                <div className="absolute bottom-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/60 px-6 py-2 pb-safe shadow-[0_-10px_40px_rgb(0,0,0,0.05)] z-40">
                    <div className="max-w-md mx-auto flex items-center justify-between pb-4 pt-2">

                        <button onClick={() => navigate('/creator-dashboard')} className="flex flex-col items-center gap-1 w-12 text-slate-900 font-bold">
                            <Home className="w-6 h-6 fill-current" />
                            <span className="text-[10px]">Home</span>
                        </button>

                        <button onClick={() => navigate('/creator-dashboard?tab=deals')} className="flex flex-col items-center gap-1 w-12 text-slate-400 relative hover:text-slate-600 transition-colors">
                            <Briefcase className="w-6 h-6" />
                            <span className="absolute top-0 right-1 w-4 h-4 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm">5</span>
                            <span className="text-[10px] font-medium">Deals</span>
                        </button>

                        {/* Center Action Button */}
                        <button className="transform -translate-y-4 px-6 py-3.5 bg-blue-600 rounded-full flex items-center gap-2 shadow-[0_8px_20px_rgba(37,99,235,0.3)] border-4 border-[#F8F9FA] text-white font-bold text-[15px] hover:bg-blue-700 transition-colors">
                            <Plus className="w-5 h-5" strokeWidth={3} />
                            Pitch
                        </button>

                        <button onClick={() => navigate('/creator-dashboard?tab=messages')} className="flex flex-col items-center gap-1 w-12 text-slate-400 relative hover:text-slate-600 transition-colors">
                            <MessageSquare className="w-6 h-6" />
                            <span className="absolute -top-1 right-0 w-4 h-4 bg-red-400 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm">2</span>
                            <span className="text-[10px] font-medium">Chats</span>
                        </button>

                        <button onClick={() => navigate('/creator-profile')} className="flex flex-col items-center gap-1 w-12 text-slate-400 hover:text-slate-600 transition-colors">
                            <User className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Profile</span>
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
