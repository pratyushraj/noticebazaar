import React from 'react';
import {
    Bell, Check, ChevronRight,
    Plus, User, Zap, Lock, FileText, Search, ShieldCheck, Clock, Handshake, SlidersHorizontal,
    LayoutDashboard, CreditCard, Link as LinkIcon, Shield, Briefcase, ArrowUpRight, Menu, Instagram, Package, Clapperboard, Calendar as CalendarIcon, Target, Dumbbell, Shirt, Mail, Grid2X2
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
    const username = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Pratyush';
    const avatarUrl = profile?.avatar_url || "https://i.pravatar.cc/150?img=47";

    React.useEffect(() => {
        // Change theme color for this specific page to blend with dark theme
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        const originalColor = metaThemeColor?.getAttribute("content");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", "#0A0B0D");
        }

        // Force body background
        const originalBodyBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#0A0B0D';

        return () => {
            if (metaThemeColor && originalColor) {
                metaThemeColor.setAttribute("content", originalColor);
            }
            if (originalBodyBg) {
                document.body.style.backgroundColor = originalBodyBg;
            }
        };
    }, []);

    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    const navigateDealReview = () => {
        triggerHaptic();
        console.log("Navigating to Deal Review");
    };

    return (
        <div className="fixed inset-0 z-[10000] sm:bg-[#050607] flex justify-center overflow-hidden selection:bg-blue-500/30" style={{ backgroundColor: '#0A0B0D' }}>

            {/* Mobile / Tablet Screen Container */}
            <div className="w-full md:max-w-3xl lg:max-w-5xl mx-auto relative h-[100dvh] sm:h-[100dvh] md:border-x md:border-white/5 text-slate-200 font-sans flex flex-col" style={{ backgroundColor: '#0A0B0D' }}>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[120px] scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {activeTab === 'dashboard' && (
                        <>
                            {/* Top Header Section */}
                            <div className="px-5 pb-6 transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                                <div className="flex items-center justify-between mb-8">
                                    <button onClick={triggerHaptic} className="text-white hover:opacity-70 transition-opacity">
                                        <Menu className="w-6 h-6" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Shield className="w-5 h-5 text-white fill-white/10" />
                                        </div>
                                        <span className="text-white font-bold tracking-tight text-lg">CreatorArmour</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button onClick={triggerHaptic} className="relative w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white transition-colors active:scale-95">
                                            <Bell className="w-5 h-5 text-slate-300" />
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#0A0B0D] rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</span>
                                        </button>
                                        <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 p-0.5">
                                            <img
                                                src={avatarUrl}
                                                alt="Profile avatar"
                                                className="w-full h-full rounded-full object-cover shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
                                        Hi, {username}Fit! 👋
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-[12px] font-black">3</span>
                                        </div>
                                        <p className="text-slate-400 text-[14px] font-medium">new brand collaborations for you</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 space-y-6 pt-2">
                                {/* Operational Metrics Row */}
                                <div className="grid grid-cols-3 bg-[#15171B] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                                    {/* Profile Score */}
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Profile Score</p>
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle cx="20" cy="20" r="17" fill="transparent" stroke="currentColor" strokeWidth="2.5" className="text-white/5" />
                                                    <circle cx="20" cy="20" r="17" fill="transparent" stroke="url(#scoreGradient)" strokeWidth="2.5" strokeDasharray={`${(92 / 100) * 107} 107`} strokeLinecap="round" />
                                                    <defs>
                                                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#10B981" />
                                                            <stop offset="100%" stopColor="#3B82F6" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <span className="absolute text-[11px] font-bold text-white leading-none">92</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="text-[14px] font-bold text-white tracking-tight leading-none">92<span className="text-slate-500 text-[11px] font-medium ml-0.5">/100</span></div>
                                                <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tight">Excellent</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-[1px] bg-white/5 h-10 self-center mx-auto" />

                                    {/* Earnings Card */}
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Earnings</p>
                                        <div className="text-center">
                                            <p className="text-[18px] font-black text-white tracking-tight leading-none">
                                                ₹2,48,500
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5 justify-center">
                                                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                                <span className="text-[11px] text-emerald-400 font-bold tracking-tight">+18%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-[1px] bg-white/5 h-10 self-center mx-auto" />

                                    {/* Active Deals Card */}
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Active Deals</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[20px] font-black text-white leading-none">2</span>
                                            <div className="flex -space-x-1.5 relative h-6 items-center ml-1">
                                                <div className="w-6 h-6 rounded-full border-2 border-[#15171B] overflow-hidden shadow-lg">
                                                    <img src="https://i.pravatar.cc/100?img=1" className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="w-6 h-6 rounded-full border-2 border-[#15171B] overflow-hidden shadow-lg">
                                                    <img src="https://i.pravatar.cc/100?img=2" className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center border-2 border-[#15171B] shadow-lg">
                                                    <Plus className="w-3 h-3 text-white" strokeWidth={4} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Offers Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h2 className="text-[16px] font-bold text-white tracking-tight">Brand Offers</h2>
                                        <button className="text-[12px] text-blue-400 font-bold flex items-center gap-1">
                                            View All <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Static Demo Card: FitScience */}
                                        <div className="bg-[#15171B] rounded-2xl p-5 border border-white/5 shadow-lg shadow-black/20">
                                            <div className="flex items-start justify-between mb-5">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E1306C] via-[#FFDC80] to-[#C13584] p-[2px] shadow-lg shrink-0">
                                                        <div className="w-full h-full rounded-[14px] bg-[#15171B] flex items-center justify-center">
                                                            <Instagram className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h3 className="font-bold text-[17px] text-white tracking-tight">FitScience</h3>
                                                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                                            </div>
                                                        </div>
                                                        <p className="text-[12px] text-slate-500 font-medium">Fitness & Nutrition</p>
                                                    </div>
                                                </div>
                                                <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm uppercase tracking-wider">
                                                    New Offer
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between py-4 border-y border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] text-slate-400 font-medium">Collab Budget:</span>
                                                    <span className="text-[15px] text-blue-400 font-black tracking-tight">₹75,000</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-700" />
                                            </div>

                                            <div className="flex items-center justify-between mt-5">
                                                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reel + Story + Post</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={triggerHaptic} className="px-5 py-2.5 rounded-xl font-bold text-[12px] text-slate-300 bg-white/5 border border-white/10 active:scale-95 transition-all">
                                                        View Details
                                                    </button>
                                                    <button onClick={triggerHaptic} className="px-6 py-2.5 rounded-xl font-bold text-[12px] text-white bg-blue-600 shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
                                                        Accept
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mock GlowSkin Card */}
                                        <div className="bg-[#15171B] rounded-2xl p-5 border border-white/5 shadow-lg shadow-black/20">
                                            <div className="flex items-start justify-between mb-5">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-pink-500/20 p-[2px] shrink-0">
                                                        <div className="w-full h-full rounded-[14px] bg-[#15171B] flex items-center justify-center">
                                                            <div className="w-6 h-6 rounded-full bg-pink-500/40 flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-pink-400" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h3 className="font-bold text-[17px] text-white tracking-tight">GlowSkin</h3>
                                                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                                            </div>
                                                        </div>
                                                        <p className="text-[12px] text-slate-500 font-medium">Beauty & Skincare</p>
                                                    </div>
                                                </div>
                                                <div className="bg-orange-500/10 text-orange-400 text-[10px] font-black px-3 py-1 rounded-full border border-orange-500/20 shadow-sm uppercase tracking-wider">
                                                    Pending
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between py-4 border-y border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] text-slate-400 font-medium">Collab Budget:</span>
                                                    <span className="text-[15px] text-blue-400 font-black tracking-tight">₹40,000</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-700" />
                                            </div>

                                            <div className="flex items-center justify-between mt-5">
                                                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Story + Review</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={triggerHaptic} className="px-5 py-2.5 rounded-xl font-bold text-[12px] text-slate-300 bg-white/5 border border-white/10 active:scale-95 transition-all">
                                                        View
                                                    </button>
                                                    <button onClick={triggerHaptic} className="px-6 py-2.5 rounded-xl font-bold text-[12px] text-white bg-orange-600 shadow-lg shadow-orange-500/30 active:scale-95 transition-all">
                                                        Respond
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Deal Cards */}
                                        {Array.isArray(collabRequests) && collabRequests.map((req, idx) => {
                                            const category = (req.category || '').toLowerCase();
                                            const isFitness = category.includes('fitness') || category.includes('gym') || category.includes('health');

                                            return (
                                                <div key={req.id || idx} className="bg-[#15171B] rounded-2xl p-5 border border-white/5 shadow-lg shadow-black/20 opacity-80 scale-95 origin-top">
                                                    <div className="flex items-start justify-between mb-5">
                                                        <div className="flex gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0">
                                                                {req.brand_logo ? <img src={req.brand_logo} className="w-8 h-8 rounded-lg" /> : <Target className="w-6 h-6 text-slate-500" />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <h3 className="font-bold text-[17px] text-white tracking-tight">{req.brand_name || 'Brand'}</h3>
                                                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                                                    </div>
                                                                </div>
                                                                <p className="text-[12px] text-slate-500 font-medium">{req.category || 'Supplements & Gear'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-3 py-1 rounded-full border border-purple-500/20 shadow-sm uppercase tracking-wider">
                                                            In Negotiation
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between py-4 border-y border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[13px] text-slate-400 font-medium">Collab Budget:</span>
                                                            <span className="text-[15px] text-blue-400 font-black tracking-tight">₹1,20,000</span>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-slate-700" />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>

                                {/* Upcoming Campaigns Section */}
                                <section className="pb-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-[16px] font-bold text-white tracking-tight">Upcoming Campaigns</h2>
                                        <button className="text-[12px] text-blue-400 font-bold">See Calendar</button>
                                    </div>
                                    <div className="bg-[#15171B] rounded-2xl p-4 border border-white/5 flex items-center justify-between shadow-xl">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden">
                                                <div className="w-full h-4 bg-red-500 flex items-center justify-center">
                                                    <div className="flex gap-1">
                                                        <div className="w-[3px] h-[3px] rounded-full bg-red-900" />
                                                        <div className="w-[3px] h-[3px] rounded-full bg-red-900" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center pt-1">
                                                    <span className="text-[20px] font-black text-white leading-none">12</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[15px] text-white tracking-tight">Brand Shoot with FitScience</h3>
                                                <p className="text-[13px] text-slate-500 font-medium mt-0.5">12 April, 2:00 PM</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-500/10 text-blue-400 text-[11px] font-black px-4 py-1.5 rounded-full border border-blue-500/20 shadow-sm">
                                            Confirmed
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-2 mt-5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                    </div>
                                </section>
                            </div>
                        </>
                    )}

                    {/* Collabs Tab View */}
                    {activeTab === 'collabs' && (
                        <div className="min-h-full bg-slate-50 flex flex-col">
                            {/* Header */}
                            <div className="px-5 pb-4 bg-white border-b border-slate-200/70 shadow-sm sticky top-0 z-50 transition-all pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center mb-5">
                                    <div className="flex items-center gap-2 text-slate-900">
                                        <Handshake className="w-5 h-5 flex-shrink-0" />
                                        <h1 className="text-[22px] font-semibold tracking-tight">Collaborations</h1>
                                    </div>
                                    <button onClick={triggerHaptic} className="w-9 h-9 flex items-center justify-center text-slate-500 rounded-lg">
                                        <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={2} />
                                    </button>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                    <button className="flex-1 px-3 py-1.5 bg-white text-slate-900 rounded-md text-[11px] font-bold shadow-sm">INTAKE</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[11px] font-bold">CONTRACTING</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[11px] font-bold">EXECUTING</button>
                                </div>
                            </div>
                            <div className="px-5 py-8 flex flex-col items-center justify-center text-center space-y-4">
                                <ShieldCheck className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                                <h3 className="text-slate-900 text-[16px] font-bold">No active contracts</h3>
                                <p className="text-slate-500 text-[14px] max-w-[250px]">Accept an offer from the dashboard to initiate your secure collaboration flow.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="min-h-full bg-white">
                            <div className="px-5 pb-5 bg-white border-b border-slate-100 sticky top-0 z-[110]" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Ledger</h1>
                            </div>
                            <div className="px-5 pt-6 space-y-6">
                                <div className="bg-[#0F172A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                    <Shield className="absolute -right-6 -bottom-6 w-40 h-40 text-blue-50 opacity-5 -rotate-12" strokeWidth={1} />
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
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="min-h-full bg-white pb-32">
                            <div className="px-5 pb-5 bg-white border-b border-slate-100 sticky top-0 z-[110]" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center">
                                    <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Settings</h1>
                                    <button onClick={() => { triggerHaptic(); navigate('/creator-profile'); }} className="text-[12px] font-bold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-lg uppercase tracking-wider">Configure</button>
                                </div>
                            </div>
                            <div className="px-5 pt-6 flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full border-4 border-blue-500/10 p-1 shadow-2xl">
                                    <img src={avatarUrl} alt="User" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <h2 className="text-[22px] font-black text-slate-900 mt-5 tracking-tight">@{username}</h2>
                                <p className="text-[15px] text-slate-500 font-medium">{userEmail || 'creator@example.com'}</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Floating Bottom Navigation */}
                <div className="absolute bottom-0 inset-x-0 w-full px-6 py-2 pb-safe z-40 border-t border-white/5" style={{ backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', backgroundColor: 'rgba(10, 11, 13, 0.88)' }}>
                    <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between pb-4 pt-2">
                        <button onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 transition-all active:scale-90",
                            activeTab === 'dashboard' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <Grid2X2 className={cn("w-[24px] h-[24px]", activeTab === 'dashboard' ? "fill-blue-500/20" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 relative transition-all active:scale-90",
                            activeTab === 'collabs' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <Mail className={cn("w-[24px] h-[24px]", activeTab === 'collabs' ? "fill-blue-500/20" : "")} />
                            {/* <span className="absolute -top-1 right-3.5 w-4 h-4 bg-red-500 border-2 border-[#0A0B0D] rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg">3</span> */}
                            <span className="text-[10px] font-bold uppercase tracking-widest">Offers</span>
                        </button>

                        <button
                            onClick={() => { triggerHaptic(); navigate('/creator-profile'); }}
                            className="transform -translate-y-6 w-[58px] h-[58px] rounded-full flex items-center justify-center bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.45)] active:scale-90 transition-all border-4 border-[#0A0B0D] relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-blue-500" />
                            <Plus className="w-8 h-8 text-white relative z-10" strokeWidth={3.5} />
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 transition-all active:scale-90",
                            activeTab === 'payments' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <CreditCard className={cn("w-[24px] h-[24px]", activeTab === 'payments' ? "fill-blue-500/20" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Payments</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className={cn(
                            "flex flex-col items-center gap-1.5 w-16 transition-all active:scale-90",
                            activeTab === 'profile' ? 'text-blue-500' : 'text-slate-500'
                        )}>
                            <User className={cn("w-[24px] h-[24px]", activeTab === 'profile' ? "fill-blue-500/20" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
                        </button>
                    </div>
                    <div className="w-[120px] h-1.5 bg-white/10 rounded-full mx-auto mb-2" />
                </div>
            </div>
        </div>
    );
};

export default MobileDashboardDemo;
