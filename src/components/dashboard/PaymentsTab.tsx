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
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
    isDark,
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

    return (
        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-100" : "text-slate-900")}>Earnings</h2>
                    <p className="text-slate-500 text-sm font-medium">Manage your payouts and revenue</p>
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
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Revenue</p>
                        <h3 className={cn("text-4xl font-bold tracking-tight mb-2", isDark ? "text-white" : "text-slate-900")}>
                            ₹48,750
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600 text-[13px] font-bold flex items-center gap-0.5">
                                <TrendingUp className="w-3.5 h-3.5" /> +12.5%
                            </span>
                            <span className="text-slate-400 text-[13px] font-medium">vs last month</span>
                        </div>
                    </div>
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800" : "bg-slate-50")}>
                        <Wallet className="w-7 h-7 text-blue-600" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-2xl border", isDark ? "bg-slate-800/40 border-slate-700" : "bg-orange-50/30 border-orange-100/50")}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing</p>
                        </div>
                        <p className={cn("text-xl font-bold", isDark ? "text-slate-200" : "text-slate-900")}>₹22,500</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl border", isDark ? "bg-slate-800/40 border-slate-700" : "bg-green-50/30 border-green-100/50")}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid Out</p>
                        </div>
                        <p className={cn("text-xl font-bold", isDark ? "text-slate-200" : "text-slate-900")}>₹26,250</p>
                    </div>
                </div>
            </motion.div>

            {/* Payout Method */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className={cn("text-sm font-bold uppercase tracking-widest text-slate-400")}>Payout Method</h4>
                    <button className="text-xs font-bold text-blue-600">Edit Details</button>
                </div>
                <div className={cn("p-5 rounded-3xl border flex items-center justify-between", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                    <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600")}>
                            <Landmark className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-slate-900")}>UPI Transfer</p>
                                <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-100")}>Verified</span>
                            </div>
                            <p className="text-xs font-medium text-slate-400 font-mono tracking-tight">{profileFormData.bank_upi ? `${profileFormData.bank_upi.split('@')[0].slice(0,3)}*****@${profileFormData.bank_upi.split('@')[1]}` : 'Not set'}</p>
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
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{date}</p>
                        <div className={cn("rounded-[2rem] border overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                            {deals.map((deal, idx) => {
                                const payUx = getCreatorPaymentListUX(deal);
                                const isProcessing = payUx.tone === 'warning';
                                return (
                                    <div 
                                        key={deal.id || idx} 
                                        className={cn("p-4 flex items-center justify-between active:bg-slate-50 transition-colors border-b last:border-0", isDark ? "border-slate-800 active:bg-slate-800" : "border-slate-100")}
                                        onClick={() => { triggerHaptic(); setSelectedPayment(deal); }}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 p-1.5 overflow-hidden shrink-0">
                                                {getBrandIcon(deal.brand_logo_url || deal.logo_url, deal.category, deal.brand_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn("text-[15px] font-bold truncate", isDark ? "text-white" : "text-slate-900")}>{deal.brand_name || 'Brand Partner'}</p>
                                                <p className="text-xs font-medium text-slate-500">{isProcessing ? 'Processing Payout' : 'Campaign Payout'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={cn("text-[15px] font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>₹{(deal.deal_amount || 0).toLocaleString()}</p>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                isProcessing 
                                                    ? "bg-orange-50 text-orange-600 border border-orange-100" 
                                                    : "bg-green-50 text-green-600 border border-green-100"
                                            )}>
                                                {isProcessing ? 'Processing' : 'Paid'}
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
