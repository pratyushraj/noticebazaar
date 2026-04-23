import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    HelpCircle, ShieldCheck, Wallet, ArrowUpRight, 
    FileText, ChevronRight, Smartphone, Landmark, Download,
    CheckCircle2, Clock, AlertCircle, History
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaymentsTabProps {
    isDark: boolean;
    textColor: string;
    profileFormData: any;
    setProfileFormData: React.Dispatch<React.SetStateAction<any>>;
    handleSaveProfile: () => Promise<void>;
    isSavingProfile: boolean;
    profile: any;
    brandDeals: any[];
    getCreatorPaymentListUX: (deal: any) => any;
    getBrandIcon: (logo: string, cat: string, name: string) => React.ReactNode;
    triggerHaptic: () => void;
    setSelectedPayment: (deal: any) => void;
    setActiveSettingsPage: (page: string | null) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
    isDark,
    textColor,
    profileFormData,
    setProfileFormData,
    handleSaveProfile,
    isSavingProfile,
    profile,
    brandDeals,
    getCreatorPaymentListUX,
    getBrandIcon,
    triggerHaptic,
    setSelectedPayment
}) => {
    // Group transactions by date
    const groupedTransactions = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        const sortedDeals = [...brandDeals].sort((a, b) => 
            new Date(b.completed_at || b.updated_at || b.created_at).getTime() - 
            new Date(a.completed_at || a.updated_at || a.created_at).getTime()
        );

        sortedDeals.forEach(deal => {
            const date = new Date(deal.completed_at || deal.updated_at || deal.created_at);
            const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(deal);
        });
        return Object.entries(groups);
    }, [brandDeals]);

    // Calculate dynamic totals from brandDeals
    const totals = React.useMemo(() => {
        let total = 0;
        let processing = 0;
        let paid = 0;

        brandDeals.forEach(deal => {
            const status = String(deal.status || '').toLowerCase();
            const amount = Number(deal.deal_amount || deal.exact_budget || 0);

            if (status.includes('paid') || status.includes('released') || status.includes('completed')) {
                paid += amount;
                total += amount;
            } else if (
                status.includes('approved') || 
                status.includes('delivered') || 
                status.includes('revision') ||
                status.includes('making') ||
                status.includes('accepted') ||
                status.includes('working') ||
                status.includes('ongoing')
            ) {
                processing += amount;
                total += amount;
            }
        });

        return { total, processing, paid };
    }, [brandDeals]);

    const hasUpi = Boolean(profileFormData.payout_upi);

    return (
        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="mb-8 relative z-10">
                    <h1 className={cn("text-4xl font-black italic uppercase tracking-tighter", isDark ? "text-white" : "text-slate-900")}>Earnings</h1>
                    <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-40 leading-tight", textColor)}>Track and manage your revenue</p>
                </div>
                <button className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-sm")}>
                    <HelpCircle className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Earnings Hero Card */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn("p-6 rounded-[2.5rem] border mb-8 relative overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50")}
            >
                <div className="flex justify-between items-start mb-8">
                    <div className="mb-4">
                        <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-1", textColor)}>Total Revenue</p>
                        <h2 className={cn("text-4xl font-black tracking-tighter transition-all duration-500", isDark ? "text-white" : "text-slate-900")}>
                            ₹{totals.total.toLocaleString()}
                        </h2>
                    </div>
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800" : "bg-slate-50")}>
                        <Wallet className="w-7 h-7 text-blue-600" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-2xl border", isDark ? "bg-slate-800/40 border-slate-700" : "bg-orange-50/30 border-orange-100/50")}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing</p>
                        </div>
                        <p className={cn("text-xl font-black", isDark ? "text-slate-200" : "text-slate-900")}>₹{totals.processing.toLocaleString()}</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl border", isDark ? "bg-slate-800/40 border-slate-700" : "bg-green-50/30 border-green-100/50")}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Out</p>
                        </div>
                        <p className={cn("text-xl font-black", isDark ? "text-slate-200" : "text-slate-900")}>₹{totals.paid.toLocaleString()}</p>
                    </div>
                </div>
            </motion.div>

            {/* Payout Method */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className={cn("text-sm font-bold uppercase tracking-widest text-slate-400")}>Payout Method</h4>
                    <button 
                        onClick={() => { triggerHaptic(); setActiveSettingsPage('personal'); }}
                        className="text-xs font-bold text-blue-600 active:scale-95 transition-all"
                    >
                        Edit Details
                    </button>
                </div>
                <div className={cn("p-5 rounded-3xl border flex items-center justify-between", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                    <div 
                        onClick={() => { triggerHaptic(); setActiveSettingsPage('personal'); }}
                        className="flex items-center gap-4 cursor-pointer"
                    >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600")}>
                            <Landmark className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-slate-900")}>UPI Transfer</p>
                                {hasUpi && <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-100")}>Verified</span>}
                            </div>
                            <p className="text-xs font-medium text-slate-400 font-mono tracking-tight">{hasUpi ? `${profileFormData.payout_upi.split('@')[0].slice(0,3)}*****@${profileFormData.payout_upi.split('@')[1]}` : 'Not set'}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
            </div>

            {/* Transactions */}
            <div className="mb-6 px-1 flex items-center justify-between">
                <h4 className={cn("text-sm font-bold uppercase tracking-widest text-slate-400")}>Transactions</h4>
                <button className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> View All
                </button>
            </div>

            <div className="space-y-8">
                {brandDeals.length > 0 ? groupedTransactions.map(([date, deals]) => (
                    <div key={date} className="space-y-3">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{date}</p>
                        <div className={cn("rounded-[24px] border overflow-hidden shadow-sm transition-all duration-300", isDark ? "bg-[#0B1220] border-[#223046]" : "bg-white border-slate-200")}>
                            {deals.map((deal, idx) => {
                                const payUx = getCreatorPaymentListUX(deal);
                                const isProcessing = payUx.tone === 'warning';
                                return (
                                    <div 
                                        key={deal.id || idx} 
                                        className={cn("p-5 flex items-center justify-between active:bg-slate-50 transition-colors border-b last:border-0", isDark ? "border-[#223046] active:bg-[#1A2436]" : "border-slate-100")}
                                        onClick={() => { triggerHaptic(); setSelectedPayment(deal); }}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={cn("w-16 h-16 rounded-2xl border shrink-0 flex items-center justify-center p-1.5 shadow-sm overflow-hidden", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                                {getBrandIcon(
                                                    deal.brand_logo_url || 
                                                    deal.brand_logo || 
                                                    deal.logo_url || 
                                                    deal.brand?.logo_url || 
                                                    deal.brand?.brand_logo_url || 
                                                    deal.brand?.logo ||
                                                    deal.raw?.brand_logo_url || 
                                                    deal.raw?.brand_logo || 
                                                    deal.raw?.logo_url, 
                                                    deal.category || deal.brand?.category, 
                                                    deal.brand_name || deal.brand?.brand_name || deal.brand?.name
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn("text-[17px] font-black truncate tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                                    {deal.brand_name || deal.brand?.brand_name || deal.brand?.name || 'Brand Partner'}
                                                </p>
                                                <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">{isProcessing ? 'Processing Payout' : 'Campaign Revenue'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={cn("text-[18px] font-black mb-1.5 tracking-tight", isDark ? "text-white" : "text-slate-900")}>₹{(deal.deal_amount || 0).toLocaleString()}</p>
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.05em] border",
                                                isProcessing 
                                                    ? "bg-orange-50 text-orange-600 border-orange-100" 
                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}>
                                                {isProcessing ? 'In Transit' : 'Settled'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center px-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className={cn("text-lg font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>No payouts yet</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Accept brand deals and complete collaborators to see your earnings here.</p>
                    </div>
                )}
            </div>

            {/* Reports Section */}
            <div className="mt-12 grid grid-cols-2 gap-3">
                <button className={cn("p-4 rounded-2xl border text-left flex flex-col gap-3", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className={cn("text-[13px] font-bold", isDark ? "text-white" : "text-slate-900")}>Tax Invoices</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Download GST</p>
                    </div>
                </button>
                <button className={cn("p-4 rounded-2xl border text-left flex flex-col gap-3", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Download className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className={cn("text-[13px] font-bold", isDark ? "text-white" : "text-slate-900")}>Statements</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fee breakdown</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

// Types/Icons needed locally if not imported
import { TrendingUp, QrCode, MoreHorizontal, Sun, Moon, Bell, Menu, LayoutDashboard, Briefcase, User, Send, X, AlertTriangle, Instagram, BarChart3, Share2, Copy, Eye, ArrowRight } from 'lucide-react';
