import React from 'react';
import { motion } from 'framer-motion';
import {
    Briefcase, Bell, User, ChevronRight, Check,
    Clock, AlertCircle, Calendar, ArrowRight, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrandDealConsoleDemo = () => {
    const navigate = useNavigate();

    // Prevent Safari overscroll/bleed + iOS Native PWA configuration
    React.useEffect(() => {
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        const originalColor = metaThemeColor?.getAttribute("content");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", "#ffffff");
        }

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

            {/* Mobile Screen Container */}
            <div className="w-full sm:max-w-[430px] relative h-[100dvh] sm:h-[100dvh] sm:shadow-[0_0_50px_rgba(0,0,0,0.12)] sm:border-x sm:border-slate-200 text-slate-900 font-sans flex flex-col" style={{ background: 'linear-gradient(180deg, #F6F8FB 0%, #EEF1F7 100%)' }}>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[84px] scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {/* Top Header Section */}
                    <div className="px-5 pb-5 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-[110] transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-sm">
                                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 8.216c-3.111.96-6.666 1.838-10.592 1.838-5.333 0-10.37-.878-13.408-2.676v.053c0 6.666 4.667 9.889 10.963 9.889 4.333 0 8.703-1.89 13.037-5.592v-3.512z" /></svg>
                                </div>
                                <div>
                                    <h1 className="text-[17px] font-bold tracking-tight text-slate-900 leading-none">Nike India</h1>
                                    <p className="text-[12px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Session
                                    </p>
                                </div>
                            </div>

                            {/* Top Right Action - Settings or Profile Image */}
                            <button onClick={triggerHaptic} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                                <User className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Primary Collab Engine CTA */}
                        <div className="mt-4">
                            <button
                                onClick={triggerHaptic}
                                className="w-full py-3.5 bg-[#0F172A] text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:bg-slate-800 transition-colors active:opacity-75"
                            >
                                Send New Offer <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="px-5 pt-5 pb-20 space-y-5">

                        {/* ⚡ Install Trigger Prompt (Critical UX) */}
                        <div className="bg-[#F8FAFC] border border-blue-100 p-4 rounded-2xl flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-5" />
                            <h3 className="text-[14px] font-bold text-slate-900 mb-1 relative z-10">Track creator responses in real-time</h3>
                            <p className="text-[12px] text-slate-500 mb-3 relative z-10">No inbox clutter. All deal updates in one place.</p>
                            <button
                                onClick={triggerHaptic}
                                className="bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-slate-50 active:opacity-60 transition-all flex items-center justify-center"
                            >
                                Add to Home Screen
                            </button>
                        </div>

                        {/* Section Header */}
                        <div className="flex items-center justify-between pt-2">
                            <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">Active Offers</h2>
                            <div className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                2 Active
                            </div>
                        </div>

                        {/* Urgent Action Deal Card */}
                        <div className="bg-white rounded-[20px] p-5 border border-slate-200/80 relative overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)' }}>
                            {/* Urgent Status Header */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-[12px] font-bold text-orange-600 tracking-wide uppercase">Counter Pending</span>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-3 items-center">
                                    <img src="https://i.pravatar.cc/150?img=47" alt="Creator" className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm" />
                                    <div>
                                        <h3 className="font-bold text-[16px] text-slate-900 leading-tight">@thebloomingmiss</h3>
                                        <p className="text-[12px] text-slate-500 mt-0.5">Fashion & Lifestyle • 1.2M</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100/50 mb-4">
                                <p className="text-[13px] text-slate-700 leading-snug font-medium">
                                    <span className="font-bold">Creator Countered:</span> Looks great, but I require ₹85,000 for full usage rights across Meta.
                                </p>
                            </div>

                            <div className="h-[1px] bg-black/5 w-full mb-3" />

                            <div className="flex items-center gap-2">
                                <motion.button
                                    onClick={triggerHaptic}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-[2] py-3.5 px-3 rounded-xl font-bold text-[14px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                                    style={{ backgroundColor: '#0F172A' }}
                                >
                                    Approve Counter <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                </motion.button>
                                <button onClick={triggerHaptic} className="flex-1 py-3.5 px-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-95">
                                    Decline
                                </button>
                            </div>
                        </div>

                        {/* Accepted Deal Status Card */}
                        <div className="bg-white rounded-[20px] p-5 border border-slate-200/80 relative overflow-hidden opacity-90" style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[12px] font-bold text-emerald-600 tracking-wide uppercase">Accepted & Secured</span>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-[18px]">
                                        📸
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[16px] text-slate-900 leading-tight">@techninja</h3>
                                        <p className="text-[12px] text-slate-500 mt-0.5">Tech Reviews • 800K</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[14px] font-bold text-slate-900">₹45,000</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-2">
                                <div className="flex items-center justify-between text-[12px]">
                                    <span className="text-slate-500 font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Next Deliverable:</span>
                                    <span className="font-bold text-slate-700">Oct 12th</span>
                                </div>
                            </div>

                            <button onClick={triggerHaptic} className="w-full mt-2 py-3 rounded-xl font-bold text-[13px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-95">
                                View Timeline
                            </button>
                        </div>

                    </div>
                </div>

                {/* Minimalist 3-Tab Brand Navigation */}
                <div className="absolute bottom-0 inset-x-0 w-full border-t border-slate-200/60 px-8 py-2 pb-safe z-40" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.75)' }}>
                    <div className="max-w-md mx-auto flex items-center justify-between pb-4 pt-2">

                        <button onClick={triggerHaptic} className="flex flex-col items-center gap-1 w-20 text-slate-900 font-bold hover:opacity-70 active:opacity-50 transition-opacity shrink-0">
                            <Briefcase className="w-6 h-6 fill-slate-900" />
                            <span className="text-[10px]">Deals</span>
                        </button>

                        <button onClick={triggerHaptic} className="flex flex-col items-center gap-1 w-20 text-slate-400 relative hover:text-slate-900 active:opacity-50 transition-opacity shrink-0">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-0 right-4 w-4 h-4 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm">1</span>
                            <span className="text-[10px] font-medium">Alerts</span>
                        </button>

                        <button onClick={triggerHaptic} className="flex flex-col items-center gap-1 w-20 text-slate-400 hover:text-slate-900 active:opacity-50 transition-opacity shrink-0">
                            <User className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Profile</span>
                        </button>
                    </div>
                    {/* iOS Home Indicator mock */}
                    <div className="w-[130px] h-1.5 bg-slate-900 rounded-full mx-auto mb-2" />
                </div>

            </div>
        </div>
    );
};

export default BrandDealConsoleDemo;
