import React from 'react';
import { motion } from 'framer-motion';
import {
    Bell, MessageCircle, BarChart3, Target, Calendar,
    TrendingUp, Check, ChevronRight, Share, CheckCircle2,
    Home, Briefcase, Plus, MessageSquare, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';

// Premium Light Dashboard Demo Page based on screenshot
const MobileDashboardDemo = () => {
    return (
        <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans sm:pb-0 pb-[84px]">

            {/* Top Header Section */}
            <div className="px-5 pt-12 pb-4 bg-gradient-to-b from-orange-50/80 to-transparent">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src="https://i.pravatar.cc/150?img=47"
                                alt="Profile avatar"
                                className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                <Plus className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-1">
                                Hey, @FitWithAva <span className="text-xl">👋</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">New collab opportunities await!</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                            <Bell className="w-5 h-5 text-slate-600" />
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">3</span>
                        </button>
                        <button className="relative w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shadow-sm border border-blue-100 text-blue-600">
                            <MessageCircle className="w-5 h-5 fill-current" />
                            <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">1</span>
                        </button>
                    </div>
                </div>

                {/* Top Cards Row */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Available Deals Card */}
                    <div className="bg-[#1C1C28] rounded-2xl p-4 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-2xl rounded-full -mr-10 -mt-10" />
                        <p className="text-xs text-white/80 font-medium mb-1">Available Deals</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white tracking-tight">12</span>
                            <span className="text-[13px] text-white/70 font-medium">New Offers</span>
                        </div>
                        {/* 3D Stacked Cards Graphic */}
                        <div className="absolute bottom-3 right-3 flex items-center justify-center">
                            <div className="w-10 h-12 bg-orange-400/80 rounded-lg absolute rotate-6 translate-x-1" />
                            <div className="w-10 h-12 bg-amber-500 rounded-lg relative z-10 flex items-center justify-center border border-amber-300 shadow-md">
                                <span className="text-white font-bold text-lg">5</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-4 w-6 h-1 bg-blue-500 rounded-t-full" />
                    </div>

                    {/* Total Earnings Card */}
                    <div className="bg-[#095E4F] rounded-2xl p-4 shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-400/20 blur-2xl rounded-full" />
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-xs text-white/80 font-medium">Total Earnings</p>
                            <TrendingUp className="w-4 h-4 text-emerald-300" />
                        </div>
                        <p className="text-[26px] font-bold text-white tracking-tight leading-tight">
                            ₹3,45,000
                        </p>
                        <div className="flex items-center gap-1 mt-1 z-10 relative">
                            <span className="text-[11px] font-bold text-emerald-300">+18%</span>
                            <span className="text-[11px] text-white/60">this month</span>
                        </div>
                        {/* Trend chart lines decorative */}
                        <div className="absolute bottom-2 right-3 flex items-end gap-[3px] opacity-40">
                            {[1, 3, 2, 4, 3, 5, 4, 6, 8, 7, 10].map((h, i) => (
                                <div key={i} className="w-1 bg-emerald-400 rounded-t-sm" style={{ height: `${h * 4}px` }} />
                            ))}
                        </div>
                        <div className="absolute bottom-0 right-10 w-8 h-1 bg-white/30 rounded-t-full" />
                    </div>
                </div>

                {/* Scrollable Nav Pills */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2 -mx-5 px-5 [&::-webkit-scrollbar]:hidden">
                    <button className="snap-start shrink-0 bg-blue-600 text-white px-5 py-2.5 rounded-full text-[13px] font-semibold relative shadow-md shadow-blue-500/20">
                        Inbox
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">5</span>
                    </button>
                    <button className="snap-start shrink-0 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-[13px] font-semibold relative shadow-sm">
                        Shortlisted
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">2</span>
                    </button>
                    <button className="snap-start shrink-0 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-[13px] font-semibold shadow-sm">
                        Negotiation
                    </button>
                    <button className="snap-start shrink-0 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-[13px] font-semibold shadow-sm">
                        Completed
                    </button>
                </div>
            </div>

            <div className="px-5 space-y-6 pb-20">

                {/* Brand Offers Section */}
                <section>
                    <div className="flex items-center justify-between xl mb-4">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Brand Offers</h2>
                        <button className="text-[13px] text-slate-500 font-medium flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                            Sort by: <span className="text-slate-900 font-semibold">Newest</span>
                            <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Offer Card 1 - Nike */}
                        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-3 items-center">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
                                            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 8.216c-3.111.96-6.666 1.838-10.592 1.838-5.333 0-10.37-.878-13.408-2.676v.053c0 6.666 4.667 9.889 10.963 9.889 4.333 0 8.703-1.89 13.037-5.592v-3.512z" /></svg>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                                            <span className="text-[10px] font-bold">★</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-[17px] text-slate-900 leading-none">Nike India</h3>
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <span className="text-amber-500">✷</span> Premium
                                            </span>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-current" />
                                        </div>
                                        <p className="text-[13px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="text-amber-400 font-bold">★</span> Fitness & Activewear
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-emerald-50 text-emerald-700 font-bold text-lg px-2.5 py-1 rounded-lg">
                                        ₹75,000
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1">Campaign</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-5">
                                <div className="flex items-start gap-2">
                                    <p className="text-[13px] text-slate-500 w-[85px] shrink-0 font-medium">Deliverables</p>
                                    <p className="text-[13px] text-slate-900 font-bold flex items-center gap-1.5">
                                        <span className="text-amber-500">📄</span> 2 Reels + 3 Stories
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] text-slate-500 w-[85px] shrink-0 font-medium">Deadline</p>
                                    <p className="text-[13px] text-red-600 font-bold flex items-center gap-1.5">
                                        <span className="text-red-500">📅</span> 5 days left
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-3.5 px-4 rounded-2xl font-bold text-[14px] border-2 border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                                    View Details
                                </button>
                                <button className="py-3.5 px-4 rounded-2xl font-bold text-[14px] bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity">
                                    Accept Deal
                                </button>
                            </div>
                        </div>

                        {/* Offer Card 2 - mCaffeine */}
                        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-3 items-center">
                                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center p-2 shadow-sm border border-slate-100">
                                        <span className="text-white font-serif italic font-bold">m<br />caffeine</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-[17px] text-slate-900 leading-none">mCaffeine</h3>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-current" />
                                        </div>
                                        <p className="text-[13px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="text-red-400 font-bold">💄</span> Beauty & Wellness
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-red-50 text-red-700 font-bold text-[17px] px-2.5 py-1 rounded-lg">
                                        ₹32,500
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1 mt-1">
                                        <Check className="w-3 h-3 text-slate-600 p-[1px] bg-slate-200 rounded-sm" /> 1 Post
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-5">
                                <div className="flex items-start gap-2">
                                    <p className="text-[13px] text-slate-500 w-[85px] shrink-0 font-medium">Deliverables</p>
                                    <p className="text-[13px] text-slate-900 font-bold flex items-center gap-1.5">
                                        <span className="text-amber-500">📄</span> 1 Reel + 1 Story + Shoutout
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] text-slate-500 w-[85px] shrink-0 font-medium">Deadline</p>
                                    <p className="text-[13px] text-slate-700 font-bold flex items-center gap-1.5">
                                        <span className="text-slate-400">📅</span> 7 days left
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-3.5 px-4 rounded-2xl font-bold text-[14px] text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    Negotiate
                                </button>
                                <button className="py-3.5 px-4 rounded-2xl font-bold text-[14px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity">
                                    Accept
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Top Brands For You */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Top Brands for You</h2>
                        <a href="#" className="text-[13px] font-semibold text-blue-600">View All</a>
                    </div>

                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 -mx-5 px-5 [&::-webkit-scrollbar]:hidden">
                        {/* Brand 1 */}
                        <div className="snap-start shrink-0 bg-white border border-slate-100 shadow-sm rounded-full pr-4 pl-1.5 py-1.5 flex items-center gap-2">
                            <div className="relative">
                                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-serif text-[10px]">
                                    ZARA
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-100 rounded-full border border-white flex items-center justify-center">
                                    <span className="text-[8px] text-red-500">↗</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 flex items-center gap-1">Zara <span className="text-[10px] bg-auto text-amber-500">✷</span></p>
                                <p className="text-[11px] text-slate-500 font-medium">Fashion</p>
                            </div>
                        </div>

                        {/* Brand 2 */}
                        <div className="snap-start shrink-0 bg-white border border-slate-100 shadow-sm rounded-full pr-4 pl-1.5 py-1.5 flex items-center gap-2">
                            <div className="relative">
                                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs italic">
                                    boat
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                                    <Plus className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 flex items-center gap-1">
                                    ₹50k
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium">Tech</p>
                            </div>
                        </div>

                        {/* Brand 3 */}
                        <div className="snap-start shrink-0 bg-white border border-slate-100 shadow-sm rounded-full pr-4 pl-1.5 py-1.5 flex items-center gap-2">
                            <div className="relative">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                                    plum
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                                    <Plus className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 flex items-center gap-1">
                                    ₹40k
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium">Beauty</p>
                            </div>
                        </div>

                        {/* Brand 4 */}
                        <div className="snap-start shrink-0 bg-white border border-slate-100 shadow-sm rounded-full pr-4 pl-1.5 py-1.5 flex items-center gap-2">
                            <div className="relative">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold italic">
                                    Z<span className="text-[10px]">.</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 flex items-center gap-1">
                                    Gymshark <span className="bg-auto text-amber-500 text-[10px]">₹80k</span>
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium">Fitness</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Your Stats This Month */}
                <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Your Stats This Month</h2>
                        <button className="text-slate-400">
                            <span className="text-xl leading-none tracking-widest">...</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {/* Views */}
                        <div className="text-center relative">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-blue-500 font-bold text-sm">👁</span>
                                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Views</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 flex justify-center items-center gap-1 mb-1">
                                <span className="text-purple-600 text-lg">🎵</span> 1.2M
                            </p>
                            <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-0.5 rounded-full mb-3">
                                +22%
                            </div>
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-600 rounded-full" />
                        </div>

                        {/* Collabs */}
                        <div className="text-center relative bg-orange-50/50 rounded-xl px-2 pt-2 -mt-2 pb-0">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-orange-500 font-bold text-sm">👤</span>
                                <span className="text-[11px] text-orange-700 font-semibold uppercase tracking-wider">Collabs</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 flex justify-center items-center gap-1 mb-1">
                                8 <TrendingUp className="w-5 h-5 text-orange-500" />
                            </p>
                            <div className="inline-flex items-center justify-center bg-orange-100 text-orange-700 font-bold text-[10px] px-2 py-0.5 rounded-full mb-3">
                                +3 new
                            </div>
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-orange-400 rounded-full" />
                        </div>

                        {/* Earnings */}
                        <div className="text-center relative">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-emerald-500 font-bold text-sm">💰</span>
                                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Earnings</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900 mb-1">
                                ₹3.4L
                            </p>
                            <div className="flex justify-center items-end h-5 gap-0.5 opacity-80 mb-3 overflow-hidden">
                                {[2, 3, 2, 4, 3, 6, 7].map((h, i) => (
                                    <div key={i} className={`w-[3px] rounded-t-sm ${i === 6 ? 'bg-emerald-500' : 'bg-emerald-200'}`} style={{ height: `${h * 3}px` }} />
                                ))}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500 rounded-full" />
                        </div>
                    </div>
                </section>

            </div>

            {/* Floating Bottom Navigation */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-6 py-2 pb-safe shadow-[0_-10px_40px_rgb(0,0,0,0.05)] sm:block">
                <div className="max-w-md mx-auto flex items-center justify-between pb-4 pt-2">

                    <button className="flex flex-col items-center gap-1 w-12 text-slate-900 font-semibold">
                        <Home className="w-6 h-6 fill-current" />
                        <span className="text-[10px]">Home</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 w-12 text-slate-400 relative">
                        <Briefcase className="w-6 h-6" />
                        <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">5</span>
                        <span className="text-[10px] font-medium">Deals</span>
                    </button>

                    {/* Center Blue Action Button */}
                    <button className="transform -translate-y-4 px-6 py-3.5 bg-blue-600 rounded-full flex items-center gap-1.5 shadow-[0_8px_20px_rgba(37,99,235,0.3)] border-4 border-[#F8F9FA] text-white font-bold text-[15px]">
                        <Plus className="w-5 h-5" />
                        New Pitch
                    </button>

                    <button className="flex flex-col items-center gap-1 w-12 text-slate-400 relative">
                        <MessageSquare className="w-6 h-6" />
                        <span className="absolute -top-1 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">2</span>
                        <span className="text-[10px] font-medium">Chats</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 w-12 text-slate-400">
                        <User className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </div>

                {/* iOS Home Indicator mock */}
                <div className="w-[120px] h-1.5 bg-black rounded-full mx-auto mb-2" />
            </div>

        </div>
    );
};

export default MobileDashboardDemo;
