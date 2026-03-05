import React from 'react';
import {
    Bell, Check, ChevronRight,
    Plus, User, Zap, Lock, FileText, Search, ShieldCheck, Clock, Handshake, SlidersHorizontal,
    LayoutDashboard, CreditCard, Link as LinkIcon, Shield, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';
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

    const navigateDealReview = () => {
        triggerHaptic();
        console.log("Navigating to Deal Review");
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
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status: Active</span>
                                            </div>
                                            <h1 className="text-xl font-bold flex items-center gap-1 line-clamp-1 text-slate-900 tracking-tight">
                                                Command Center
                                            </h1>
                                            <p className="text-[13px] text-slate-500 font-medium">{profile?.full_name || 'Creator'} &bull; @{username}</p>
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
                                {/* Operational Metrics Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Available Deals Card */}
                                    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Pipeline Assets</p>
                                            <div className="w-6 h-6 bg-slate-50 text-slate-400 rounded-md flex items-center justify-center border border-slate-100">
                                                <Briefcase className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-3xl font-bold text-slate-900 tracking-tighter">12</span>
                                            <span className="text-[13px] text-slate-400 font-medium">active</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-blue-100">5 READY TO SIGN</span>
                                        </div>
                                    </div>

                                    {/* Total Earnings Card */}
                                    <div className="rounded-2xl p-4 shadow-xl relative overflow-hidden border border-slate-800" style={{ backgroundColor: '#0F172A' }}>
                                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500 rounded-full blur-[64px] opacity-10" />
                                        <div className="flex justify-between items-start mb-1 relative z-10">
                                            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Vaulted Revenue</p>
                                        </div>
                                        <p className="text-[26px] font-bold text-white tracking-widest leading-tight relative z-10 mt-1">
                                            ₹3,45,000
                                        </p>
                                        <div className="relative z-10 mt-2 flex items-center gap-1.5">
                                            <span className="text-[10px] text-emerald-400/80 font-bold flex items-center gap-1 uppercase tracking-wider">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Secured by escrow
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Filter Pills */}
                                <div className="flex gap-2 overflow-x-auto pb-4 pt-1 snap-x mb-2 scrollbar-hide -mx-5 px-5">
                                    <button className="snap-start shrink-0 text-white px-5 py-2 rounded-full text-[13px] font-semibold flex items-center shadow-md border" style={{ backgroundColor: '#0F172A', borderColor: '#0F172A' }}>
                                        Action Needed <span className="ml-1.5 text-slate-400">5</span>
                                    </button>
                                    <button className="snap-start shrink-0 bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-full text-[13px] font-medium shadow-sm hover:bg-slate-50 transition-colors flex items-center">
                                        In Negotiation <span className="ml-1.5 text-slate-400">2</span>
                                    </button>
                                    <button className="snap-start shrink-0 bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-full text-[13px] font-medium shadow-sm hover:bg-slate-50 transition-colors flex items-center">
                                        Active Contracts <span className="ml-1.5 text-slate-400">4</span>
                                    </button>
                                </div>

                                {/* Pipeline Tracker Header */}
                                <section>
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2 pt-1 border-b border-transparent">
                                            Action Required <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">5</div>
                                        </h2>
                                        <button className="text-[12px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-900 transition-colors">
                                            Sort by Priority
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                                        {/* Offer Card - iOS depth styling */}
                                        <div className="bg-white rounded-[20px] p-5 border border-slate-200/80 relative overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)' }}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 bg-white shrink-0">
                                                        <ShieldCheck className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <h3 className="font-bold text-[15px] text-slate-900 leading-tight">Nike India</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Priority Account</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-slate-900 font-bold text-lg tracking-tight leading-none mb-1">₹75,000</div>
                                                    <div className="text-[9px] text-emerald-600 font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100/50 inline-block uppercase tracking-wider">
                                                        Escrow_Lock
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trust Layer Badges */}
                                            {/* Technical Spec Tags */}
                                            <div className="flex flex-wrap gap-1 mb-5">
                                                <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">CONTRACT_GEN</span>
                                                <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">FUNDS_VERIFIED</span>
                                            </div>

                                            <div className="h-[1px] bg-slate-100 w-full mb-4" />

                                            {/* Details & Urgency */}
                                            <div className="space-y-2 mb-5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Services</p>
                                                    <p className="text-[11px] text-slate-900 font-bold">2 Reels, 3 Stories</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">SLA Deadline</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-orange-500" />
                                                        <p className="text-[11px] text-orange-600 font-bold tracking-tight">T-Minus 5 Days</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Stack */}
                                            <div className="flex items-center gap-2 mt-4">
                                                <button
                                                    onClick={triggerHaptic}
                                                    className="flex-1 py-3 px-4 rounded-lg font-bold text-[13px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                                    style={{ backgroundColor: '#0F172A' }}
                                                >
                                                    Process Offer <ChevronRight className="w-4 h-4" />
                                                </button>
                                                <button onClick={triggerHaptic} className="px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                                                    Query
                                                </button>
                                            </div>
                                        </div>

                                        {/* Offer Card 2 - mCaffeine */}
                                        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/80 relative overflow-hidden">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                                                        <ShieldCheck className="w-5 h-5 text-slate-300" />
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <h3 className="font-bold text-[15px] text-slate-900 leading-tight">mCaffeine</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Standard Account</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-slate-900 font-bold text-lg tracking-tight leading-none mb-1">₹32,500</div>
                                                    <div className="text-[9px] text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/50 inline-block uppercase tracking-wider">
                                                        Direct_Lock
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Technical Spec Tags */}
                                            <div className="flex flex-wrap gap-1 mb-5">
                                                <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">CONTRACT_READY</span>
                                                <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">ESCROW_PENDING</span>
                                            </div>

                                            <div className="space-y-2 mb-5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Services</p>
                                                    <p className="text-[11px] text-slate-900 font-bold">1 Reel, 1 Story, Shoutout</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">SLA Deadline</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <p className="text-[11px] text-slate-500 font-bold tracking-tight">T-Minus 7 Days</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-[1px] bg-slate-100 w-full mb-4" />

                                            {/* Action Stack */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={triggerHaptic}
                                                    className="flex-1 py-3 px-4 rounded-lg font-bold text-[13px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                                    style={{ backgroundColor: '#0F172A' }}
                                                >
                                                    Process Offer <ChevronRight className="w-4 h-4" />
                                                </button>
                                                <button onClick={triggerHaptic} className="px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                                                    Query
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dynamic Deal Cards (Mapped from actual database) */}
                                        {Array.isArray(collabRequests) && collabRequests.map((req, idx) => {
                                            const expiryDateSource = req.offer_expires_at || req.deadline;
                                            const msRemaining = expiryDateSource ? new Date(expiryDateSource).getTime() - new Date().getTime() : 0;
                                            const daysRemaining = expiryDateSource ? Math.ceil(msRemaining / (1000 * 3600 * 24)) : 5;

                                            // Determine display badge and styles based on status.
                                            const isOffer = req.status === 'pending' || req.status === 'awaiting_review' || !req.status;
                                            const isExpired = isOffer && daysRemaining <= 0;

                                            let statusLabel = isExpired ? "Offer Expired" : "New Offer";
                                            let statusDot = isExpired ? "bg-slate-300" : "bg-emerald-500 animate-pulse";
                                            let topRightBadge = isExpired ? "Locking Period Passed" : "Escrow Ready";

                                            return (
                                                <div key={req.id || idx} className="bg-white rounded-[20px] p-5 border border-slate-200/80 relative overflow-hidden mb-4" style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' }}>
                                                    {/* Brand Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex gap-3 items-center">
                                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 shrink-0" style={{ backgroundColor: '#F8F9FA' }}>
                                                                <span className="text-slate-400 font-bold text-[14px] uppercase">{req.brand_name?.charAt(0) || 'B'}</span>
                                                            </div>
                                                            <div className="flex flex-col justify-center">
                                                                <h3 className="font-bold text-[15px] text-slate-900 leading-tight">{req.brand_name || 'Brand'}</h3>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{statusLabel}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-slate-900 font-bold text-lg tracking-tight leading-none mb-1">
                                                                ₹{req.exact_budget ? req.exact_budget.toLocaleString('en-IN') : (req.budget_range || 'TBD')}
                                                            </div>
                                                            <div className="text-[9px] text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/50 inline-block uppercase tracking-wider">
                                                                {topRightBadge.replace(' ', '_').toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Technical Spec Tags */}
                                                    <div className="flex flex-wrap gap-1 mb-5">
                                                        <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">FUNDS_VERIFIED</span>
                                                        <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">CONTRACT_GEN</span>
                                                    </div>

                                                    <div className="space-y-2 mb-5">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Services</p>
                                                            <p className="text-[11px] text-slate-900 font-bold">{req.collab_type || 'Content Creation'}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">SLA Deadline</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className={`w-3 h-3 ${isExpired ? 'text-slate-400' : 'text-orange-500'}`} />
                                                                <p className={`text-[11px] font-bold tracking-tight ${isExpired ? 'text-slate-400' : 'text-orange-600'}`}>
                                                                    {isExpired ? 'PASSED' : `T-Minus ${daysRemaining} Days`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-[1px] bg-slate-100 w-full mb-4" />

                                                    {/* Action Stack */}
                                                    <div className="flex items-center gap-2">
                                                        {isOffer ? (
                                                            isExpired ? (
                                                                <button disabled className="w-full py-3 px-4 rounded-lg font-bold text-[13px] text-slate-400 bg-slate-50 cursor-not-allowed border border-slate-200 uppercase tracking-wider">
                                                                    Offer Expired
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={triggerHaptic}
                                                                        className="flex-1 py-3 px-4 rounded-lg font-bold text-[13px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                                                        style={{ backgroundColor: '#0F172A' }}
                                                                    >
                                                                        Process Offer <ChevronRight className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={triggerHaptic} className="px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                                                                        Query
                                                                    </button>
                                                                </>
                                                            )
                                                        ) : (
                                                            <button onClick={triggerHaptic} className="w-full py-3 px-4 rounded-lg font-bold text-[13px] text-white hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: '#0F172A' }}>
                                                                View Project <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}

                                    </div>
                                </section>

                                <div className="h-6" />

                            </div> {/* End Padding Content Body */}
                        </>)}

                    {/* Collabs Tab View */}
                    {activeTab === 'collabs' && (
                        <div className="min-h-full bg-slate-50 flex flex-col">
                            {/* Header */}
                            <div className="px-5 pb-4 bg-white border-b border-slate-200/70 shadow-sm sticky top-0 z-50 transition-all pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)', transform: 'translateZ(0)' }}>
                                <div className="flex justify-between items-center mb-5">
                                    <div className="flex items-center gap-2 text-slate-900">
                                        <Handshake className="w-5 h-5 flex-shrink-0" />
                                        <h1 className="text-[22px] font-semibold tracking-tight">Collaborations</h1>
                                    </div>
                                    <button onClick={triggerHaptic} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                        <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={2} />
                                    </button>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                    <button className="flex-1 px-3 py-1.5 bg-white text-slate-900 rounded-md text-[12px] font-bold shadow-sm">Review</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[12px] font-bold">Active</button>
                                    <button className="flex-1 px-3 py-1.5 text-slate-500 text-[12px] font-bold">Closed</button>
                                </div>
                            </div>

                            <div className="px-4 py-6 space-y-4 flex-1 pb-24">
                                {collabRequests && collabRequests.length > 0 ? collabRequests.map((req, idx) => {
                                    const expirySource = req.offer_expires_at || req.deadline;
                                    const msRemaining = expirySource ? new Date(expirySource).getTime() - new Date().getTime() : 0;
                                    const daysRemaining = expirySource ? Math.ceil(msRemaining / (1000 * 3600 * 24)) : 5;

                                    const isOffer = req.status === 'pending' || req.status === 'awaiting_review' || !req.status;
                                    const isExpired = isOffer && daysRemaining <= 0;
                                    const isInProgress = req.status === 'in_progress' || req.status === 'accepted';
                                    const isCountered = req.status === 'countered';
                                    const isCompleted = req.status === 'completed';

                                    let statusLabel = isExpired ? "Offer Expired" : "New Offer";
                                    let statusDot = isExpired ? "bg-slate-300" : "bg-emerald-500 animate-pulse";
                                    let topRightBadge = isExpired ? "Expired" : "Escrow Ready";

                                    if (isInProgress) {
                                        statusLabel = "In Progress";
                                        statusDot = "bg-blue-500";
                                    } else if (isCountered) {
                                        statusLabel = "Countered by You";
                                        statusDot = "bg-orange-500";
                                        topRightBadge = "Awaiting Brand";
                                    } else if (isCompleted) {
                                        statusLabel = "Completed";
                                        statusDot = "bg-slate-400";
                                        topRightBadge = "Paid Out";
                                    }

                                    return (
                                        <div key={req.id || idx} className="bg-white rounded-[20px] p-5 border border-slate-200/80 relative overflow-hidden mb-4" style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' }}>
                                            {/* Brand Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 shrink-0" style={{ backgroundColor: '#F8F9FA' }}>
                                                        <span className="text-slate-400 font-bold text-[14px] uppercase">{req.brand_name?.charAt(0) || 'B'}</span>
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <h3 className="font-bold text-[15px] text-slate-900 leading-tight">{req.brand_name || 'Brand Partner'}</h3>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{statusLabel}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-slate-900 font-bold text-lg tracking-tight leading-none mb-1">
                                                        ₹{req.exact_budget ? req.exact_budget.toLocaleString('en-IN') : (req.budget_range || 'TBD')}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/50 inline-block uppercase tracking-wider">
                                                        {topRightBadge.replace(' ', '_').toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Technical Spec Tags */}
                                            <div className="flex flex-wrap gap-1 mb-5">
                                                <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">FUNDS_VERIFIED</span>
                                                <span className="text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest">CONTRACT_GEN</span>
                                            </div>

                                            <div className="space-y-2 mb-5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Services</p>
                                                    <p className="text-[11px] text-slate-900 font-bold">{req.collab_type || 'Content Creation'}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">SLA Deadline</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className={`w-3 h-3 ${isExpired ? 'text-slate-400' : 'text-slate-400'}`} />
                                                        <p className={`text-[11px] font-bold tracking-tight ${isExpired ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {isExpired ? 'PASSED' : isCompleted ? 'COMPLETED' : `T-Minus ${daysRemaining} Days`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-[1px] bg-slate-100 w-full mb-4" />

                                            {/* Action Stack */}
                                            <div className="flex items-center gap-2">
                                                {isOffer ? (
                                                    isExpired ? (
                                                        <button disabled className="w-full py-3 px-4 rounded-lg font-bold text-[13px] text-slate-400 bg-slate-50 cursor-not-allowed border border-slate-200 uppercase tracking-wider">
                                                            Offer Expired
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={navigateDealReview}
                                                                className="flex-1 py-3 px-4 rounded-lg font-bold text-[13px] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                                                style={{ backgroundColor: '#0F172A' }}
                                                            >
                                                                Process Offer <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={triggerHaptic} className="px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                                                                Query
                                                            </button>
                                                        </>
                                                    )
                                                ) : isCountered ? (
                                                    <>
                                                        <button onClick={triggerHaptic} className="flex-1 py-3 px-4 rounded-lg font-bold text-[13px] text-white hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm" style={{ backgroundColor: '#0F172A' }}>
                                                            Respond <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={triggerHaptic} className="px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                                                            Withdraw
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={triggerHaptic} className="w-full py-3 px-4 rounded-lg font-bold text-[13px] text-white hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: '#0F172A' }}>
                                                        View Project <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm mt-4 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-slate-50/50" />
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <ShieldCheck className="w-12 h-12 text-slate-300 mb-4" strokeWidth={1.5} />
                                            <h3 className="text-slate-900 text-[16px] font-bold tracking-tight mb-2">Deal Desk Ready</h3>
                                            <p className="text-slate-500 text-[14px] font-medium max-w-[250px] leading-relaxed">
                                                Your secure infrastructure is active. Share your Partner Portal link to receive legally binding offers.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="h-6" />
                            </div>
                        </div>
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
                                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Transaction History</h3>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100 flex-shrink-0">
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-slate-900 leading-tight">Escrow Clearance</p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">RELEASED</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">Ref: #TRX-902{i}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[15px] font-bold text-slate-900">+₹45,000</span>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Oct 0{i}, 2026</p>
                                                </div>
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
                            {/* Premium Header */}
                            <div className="px-5 pb-5 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-[110] transition-all" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
                                <div className="flex justify-between items-center">
                                    <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Settings</h1>
                                    <button onClick={() => { triggerHaptic(); navigate('/creator-profile'); }} className="text-[12px] font-bold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-wider">Configure</button>
                                </div>
                            </div>

                            <div className="px-5 pt-6 space-y-8 pb-32">
                                {/* Profile Card */}
                                <div className="flex flex-col items-center bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-100 to-slate-50" />
                                    <div className="relative z-10 p-1 bg-white rounded-full shadow-sm mb-4 mt-4">
                                        <img src={avatarUrl} alt="User" className="w-20 h-20 rounded-full border border-slate-100 object-cover" />
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">@{username || 'creator'}</h2>
                                        <p className="text-[14px] text-slate-500 font-medium mt-0.5">{userEmail || 'creator@example.com'}</p>
                                    </div>
                                    <div className="relative z-10 mt-5 w-full bg-slate-50 rounded-xl p-4 flex justify-around">
                                        <div className="text-center">
                                            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Deals</p>
                                            <p className="text-[18px] font-bold text-slate-900 mt-0.5">{collabRequests ? collabRequests.length : 0}</p>
                                        </div>
                                        <div className="w-[1px] bg-slate-200" />
                                        <div className="text-center">
                                            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Status</p>
                                            <div className="flex items-center gap-1 mt-1 justify-center">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                <p className="text-[14px] font-bold text-slate-900">Verified</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Link & Assets */}
                                <div className="space-y-3">
                                    <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider px-1">Infrastructure</h3>
                                    <div className="bg-white rounded-[20px] border border-slate-200/80 overflow-hidden shadow-sm">
                                        <div className="p-4 flex items-center justify-between border-b border-slate-100 active:bg-slate-50 transition-colors cursor-pointer" onClick={() => { triggerHaptic(); navigate('/creator-profile?section=collab'); }}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><LinkIcon className="w-4.5 h-4.5" /></div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[15px] font-bold text-slate-900">Partner Portal Link</span>
                                                    <span className="text-[12px] text-slate-500 font-medium">Manage intake schema</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <div className="p-4 flex items-center justify-between border-b border-slate-100 active:bg-slate-50 transition-colors cursor-pointer" onClick={() => { triggerHaptic(); navigate('/creator-profile?section=profile'); }}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600"><Zap className="w-4.5 h-4.5" /></div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[15px] font-bold text-slate-900">Rate Card Config</span>
                                                    <span className="text-[12px] text-slate-500 font-medium">Standardize service pricing</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <div className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors cursor-pointer" onClick={() => { triggerHaptic(); navigate('/creator-profile?section=profile'); }}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600"><FileText className="w-4.5 h-4.5" /></div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[15px] font-bold text-slate-900">Technical Attachments</span>
                                                    <span className="text-[12px] text-slate-500 font-medium">Media kit & specs integration</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>
                                </div>

                                {/* Financial */}
                                <div className="space-y-3">
                                    <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider px-1">Financial</h3>
                                    <div className="bg-white rounded-[20px] border border-slate-200/80 overflow-hidden shadow-sm">
                                        <div className="p-4 flex items-center justify-between border-b border-slate-100 active:bg-slate-50 transition-colors cursor-pointer" onClick={triggerHaptic}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700"><CreditCard className="w-4.5 h-4.5" /></div>
                                                <span className="text-[15px] font-bold text-slate-900">Bank Accounts</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <div className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors cursor-pointer" onClick={triggerHaptic}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700"><FileText className="w-4.5 h-4.5" /></div>
                                                <span className="text-[15px] font-bold text-slate-900">Tax & GST Info</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="space-y-3">
                                    <div className="bg-white rounded-[20px] border border-red-100 overflow-hidden shadow-sm mt-8">
                                        <div className="p-4 flex items-center justify-between active:bg-red-50/50 transition-colors cursor-pointer" onClick={() => { triggerHaptic(); signOutMutation.mutate(); }}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><Lock className="w-4.5 h-4.5" /></div>
                                                <span className="text-[15px] font-bold text-red-600">Logout securely</span>
                                            </div>
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

                        <button onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }} className={`flex flex-col items-center gap-1 w-16 font-bold hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400 font-medium'}`}>
                            <LayoutDashboard className="w-[20px] h-[20px] fill-current" />
                            <span className="text-[9px] uppercase tracking-wide">Overview</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('collabs'); }} className={`flex flex-col items-center gap-1 w-16 relative hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'collabs' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                            <Briefcase className={`w-[20px] h-[20px] ${activeTab === 'collabs' ? 'stroke-slate-900' : ''}`} />
                            <span className="absolute -top-0.5 right-2 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm">5</span>
                            <span className="text-[9px] uppercase tracking-wide">Projects</span>
                        </button>

                        {/* Center Action Button: Collab Link Engine */}
                        <button
                            onClick={() => { triggerHaptic(); navigate('/creator-profile'); }}
                            className="transform -translate-y-4 px-5 py-3 rounded-[12px] flex items-center gap-2 text-white font-bold text-[12px] uppercase tracking-wider hover:opacity-90 active:opacity-75 transition-all shrink-0 relative"
                            style={{
                                backgroundColor: '#0F172A',
                                boxShadow: '0px 8px 24px rgba(15,23,42,0.4), 0px 4px 8px rgba(15,23,42,0.2)'
                            }}
                        >
                            <Plus className="w-4 h-4 text-sky-400" strokeWidth={3} />
                            Intake
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('payments'); }} className={`flex flex-col items-center gap-1 w-16 relative hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'payments' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                            <CreditCard className={`w-[20px] h-[20px] ${activeTab === 'payments' ? 'fill-slate-900' : ''}`} />
                            <span className="text-[9px] uppercase tracking-wide">Ledger</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setActiveTab('profile'); }} className={`flex flex-col items-center gap-1 w-16 hover:opacity-70 active:opacity-50 transition-opacity shrink-0 ${activeTab === 'profile' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                            <User className={`w-[20px] h-[20px] ${activeTab === 'profile' ? 'fill-slate-900' : ''}`} />
                            <span className="text-[9px] uppercase tracking-wide">Account</span>
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
