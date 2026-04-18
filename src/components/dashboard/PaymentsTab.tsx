import React from 'react';
import { motion } from 'framer-motion';
import { 
    HelpCircle, ShieldCheck, Info, Wallet, ArrowUpRight, 
    FileText, ChevronRight, Smartphone, Landmark, Download 
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
    return (
        <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Payments Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h2 className={cn("text-[26px] font-black tracking-tight leading-none mb-1", isDark ? "text-white" : "text-[#111827]")}>Payments</h2>
                    <p className={cn("text-[13px] font-bold opacity-60", isDark ? "text-white" : "text-[#6B7280]")}>Manage your earnings & payouts</p>
                </div>
                <button className={cn("w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-all active:scale-[0.98]", isDark ? "bg-[#1B1D23] border-[#2B2D33]" : "bg-white border-[#E5E7EB]")}>
                    <HelpCircle className={cn("w-[20px] h-[20px] opacity-70", isDark ? "text-white" : "text-[#111827]")} />
                </button>
            </div>

            {/* Creator Armour Banner */}
            <div className={cn("mb-6 p-4 rounded-3xl border relative overflow-hidden", isDark ? "bg-gradient-to-br from-[#06180F] to-[#122A1E] border-emerald-900/50 shadow-[0_4px_24px_rgba(16,185,129,0.05)]" : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 shadow-sm")}>
                <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                    <div className={cn("w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 border", isDark ? "bg-[#1E3029]/80 border-emerald-500/30" : "bg-white border-emerald-200/80 shadow-sm")}>
                        <ShieldCheck className={cn("w-[22px] h-[22px]", isDark ? "text-emerald-400" : "text-emerald-600")} strokeWidth={2.5} />
                    </div>
                    <div className="pt-0.5">
                        <h3 className={cn("text-[15px] font-black tracking-tight mb-1", isDark ? "text-emerald-400" : "text-emerald-700")}>Creator Armour Active</h3>
                        <p className={cn("text-[12px] font-bold leading-snug", isDark ? "text-[#9CA3AF]" : "text-emerald-900/70")}>Your payouts are secured in escrow. Escalate any disputes directly from the contract.</p>
                    </div>
                </div>
            </div>

            {/* Main Earnings Card */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn("p-5 rounded-[24px] border shadow-sm mb-10 relative overflow-hidden", isDark ? "bg-[#1B1D23] border-[#2B2D33]" : "bg-white border-[#E5E7EB]")}
            >
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={cn("text-[12px] font-bold tracking-tight opacity-90", isDark ? "text-white" : "text-[#111827]")}>Total Earnings</span>
                            <Info className="w-3.5 h-3.5 opacity-50" />
                        </div>
                        <div className={cn("text-[32px] font-black tracking-tighter mb-1.5 leading-none", isDark ? "text-white" : "text-[#111827]")}>
                            ₹48,750
                        </div>
                        <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            +12.5% <span className={cn("font-semibold", isDark ? "text-white/50" : "text-[#6B7280]")}>vs last month</span>
                            <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </div>
                    </div>
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shrink-0", isDark ? "bg-[#1E3029]" : "bg-[#ECFDF5]")}>
                        <Wallet className="w-6 h-6 text-[#10B981]" />
                    </div>
                </div>

                <div className={cn("h-[1px] w-full mb-6 relative z-10", isDark ? "bg-[#2B2D33]" : "bg-[#F3F4F6]")} />

                <div className="grid grid-cols-3 gap-0 relative z-10">
                    <div className="flex flex-col pr-3">
                        <span className={cn("text-[10px] font-bold opacity-60 mb-2 truncate", isDark ? "text-white" : "text-[#111827]")}>Available to Payout</span>
                        <span className="text-[17px] font-black text-[#10B981] mb-4 truncate">₹18,250</span>
                        <button className={cn("py-2 px-0 rounded-xl text-[11px] font-black transition-all", isDark ? "bg-[#1E3029] text-[#10B981]" : "bg-[#ECFDF5] text-[#059669]")}>Withdraw</button>
                    </div>
                    <div className={cn("flex flex-col border-l px-3", isDark ? "border-[#2B2D33]" : "border-[#F3F4F6]")}>
                        <span className={cn("text-[10px] font-bold opacity-60 mb-2 truncate", isDark ? "text-white" : "text-[#111827]")}>Pending</span>
                        <span className="text-[17px] font-black text-amber-500 mb-4 truncate">₹22,500</span>
                        <button className={cn("py-2 px-0 rounded-xl text-[11px] font-black transition-all", isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-600")}>View Details</button>
                    </div>
                    <div className={cn("flex flex-col border-l pl-3", isDark ? "border-[#2B2D33]" : "border-[#F3F4F6]")}>
                        <span className={cn("text-[10px] font-bold opacity-60 mb-2 truncate", isDark ? "text-white" : "text-[#111827]")}>Paid Out</span>
                        <span className={cn("text-[17px] font-black mb-4 truncate", isDark ? "text-white/90" : "text-[#6B7280]")}>₹8,000</span>
                        <button className={cn("py-2 px-0 rounded-xl text-[11px] font-black transition-all", isDark ? "bg-[#2B2D33] text-white/80" : "bg-[#F3F4F6] text-[#4B5563]")}>View History</button>
                    </div>
                </div>
            </motion.div>

            {/* Financial Reports */}
            <h3 className={cn("text-[16px] font-black tracking-tight mb-4 px-1", isDark ? "text-white" : "text-[#111827]")}>Financial Reports</h3>
            <div className={cn("rounded-[24px] border shadow-sm mb-10 overflow-hidden", isDark ? "bg-[#1B1D23] border-[#2B2D33]" : "bg-white border-[#E5E7EB]")}>
                <button className={cn("w-full p-4 flex items-center justify-between border-b transition-colors", isDark ? "hover:bg-[#2B2D33]/50 border-white/5" : "hover:bg-slate-50 border-slate-100")}>
                    <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-400")}>
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className={cn("text-[14px] font-bold", isDark ? "text-white" : "text-[#111827]")}>Tax Invoices (GST)</p>
                            <p className={cn("text-[11px] opacity-40 font-semibold", isDark ? "text-white" : "text-[#111827]")}>Download monthly summaries</p>
                        </div>
                    </div>
                    <Download className="w-4 h-4 opacity-40" />
                </button>
                <button className={cn("w-full p-4 flex items-center justify-between transition-colors", isDark ? "hover:bg-[#2B2D33]/50" : "hover:bg-slate-50")}>
                    <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400")}>
                            <Download className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className={cn("text-[14px] font-bold", isDark ? "text-white" : "text-[#111827]")}>Payout Statements</p>
                            <p className={cn("text-[11px] opacity-40 font-semibold", isDark ? "text-white" : "text-[#111827]")}>Detailed breakdown of fees</p>
                        </div>
                    </div>
                    <Download className="w-4 h-4 opacity-40" />
                </button>
            </div>

            {/* Payout Methods Section */}
            <h3 className={cn("text-[16px] font-black tracking-tight mb-4 px-1", isDark ? "text-white" : "text-[#111827]")}>Payout Methods</h3>
            <div className="space-y-3 mb-10">
                <div className={cn("rounded-[24px] border p-4 shadow-sm", isDark ? "bg-[#1B1D23] border-[#2B2D33]" : "bg-white border-[#E5E7EB]")}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={cn("w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0", isDark ? "bg-[#1E3029]" : "bg-[#ECFDF5]")}>
                                <Smartphone className="w-5 h-5 text-[#10B981]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-[#111827]")}>UPI Transfer</span>
                                    <span className={cn("px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider", isDark ? "bg-[#1E3029] text-[#10B981]" : "bg-[#ECFDF5] text-[#059669]")}>Primary</span>
                                </div>
                                <input 
                                    className="bg-transparent text-[13px] font-semibold opacity-60 outline-none w-full"
                                    value={profileFormData.bank_upi || ''}
                                    onChange={(e) => setProfileFormData(p => ({ ...p, bank_upi: e.target.value }))}
                                    placeholder="yourname@upi"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className={cn("h-[1px] w-full mb-4", isDark ? "bg-[#2B2D33]" : "bg-[#F3F4F6]")} />
                    
                    <div className="flex items-center gap-4">
                        <div className={cn("w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0", isDark ? "bg-[#1E3029]" : "bg-[#ECFDF5]")}>
                            <Landmark className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-[11px] font-bold opacity-40 uppercase mb-1", textColor)}>Account Holder</p>
                            <input 
                                className="bg-transparent text-[14px] font-bold outline-none w-full"
                                value={profileFormData.bank_account_name || ''}
                                onChange={(e) => setProfileFormData(p => ({ ...p, bank_account_name: e.target.value }))}
                                placeholder="Legal Name on Bank Account"
                            />
                        </div>
                    </div>

                    {(profileFormData.bank_upi !== profile?.bank_upi || profileFormData.bank_account_name !== profile?.bank_account_name) && (
                        <button 
                            onClick={handleSaveProfile}
                            className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all"
                        >
                            {isSavingProfile ? 'Saving...' : 'Save Payout Info'}
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className={cn("text-[16px] font-black tracking-tight", isDark ? "text-white" : "text-[#111827]")}>Recent Transactions</h3>
                <button className="text-[12px] font-bold text-blue-500 hover:text-blue-600 transition-colors">View All</button>
            </div>
            
            <div className={cn("rounded-[24px] border shadow-sm mb-10 overflow-hidden", isDark ? "bg-[#1B1D23] border-[#2B2D33]" : "bg-white border-[#E5E7EB]")}>
                {brandDeals.length > 0 ? (
                    brandDeals.map((deal: any, idx: number) => {
                        const payUx = getCreatorPaymentListUX(deal);
                        const isProcessing = payUx.tone === 'warning';
                        
                        return (
                            <div key={idx} className={cn("flex items-center justify-between p-4 border-b group active:scale-[0.98] transition-all cursor-pointer", isDark ? "border-[#2B2D33]" : "border-[#F3F4F6]")} onClick={() => { triggerHaptic(); setSelectedPayment(deal); }}>
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden", isDark ? "bg-[#1E3029]" : "bg-[#ECFDF5]", isDark ? "text-emerald-500" : "text-emerald-600")}>
                                        {getBrandIcon(deal.brand_logo_url || deal.logo_url, deal.category, deal.brand_name)}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className={cn("text-[15px] font-bold mb-0.5 leading-none", isDark ? "text-white" : "text-[#111827]")}>{deal.brand_name || 'Brand Partner'}</div>
                                        <div className={cn("text-[12px] font-semibold opacity-60 mb-1 leading-none pt-0.5", isDark ? "text-white" : "text-[#6B7280]")}>{payUx.sublabel || deal.collab_type || 'Collaboration'}</div>
                                        <div className={cn("text-[10px] font-bold opacity-40 leading-none", isDark ? "text-white" : "text-[#6B7280]")}>
                                            {new Date(deal.completed_at || deal.updated_at || deal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-center items-end">
                                    <div className={cn("text-[15px] font-black mb-1.5", isDark ? "text-white" : "text-[#111827]")}>₹{(deal.deal_amount || 0).toLocaleString()}</div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider", 
                                        isProcessing 
                                            ? (isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600')
                                            : (isDark ? 'bg-[#1E3029] text-emerald-500' : 'bg-[#ECFDF5] text-[#059669]')
                                    )}>
                                        {payUx.label || (isProcessing ? 'Processing' : 'Completed')}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12">
                        <h3 className={cn("text-[18px] font-black tracking-tight mb-2 font-outfit", isDark ? "text-white" : "text-[#111827]")}>No recent transactions</h3>
                        <p className={cn("text-sm font-bold opacity-30", isDark ? "text-white" : "text-[#111827]")}>Complete your first brand deal to start earning</p>
                    </div>
                )}
                
                <button className={cn("w-full p-4 flex items-center justify-between transition-colors", isDark ? "hover:bg-[#2B2D33]/50 active:bg-[#2B2D33]" : "hover:bg-slate-50 active:bg-slate-100")}>
                    <div className="flex items-center gap-2.5">
                        <FileText className="w-[18px] h-[18px] text-[#3B82F6]" />
                        <span className="text-[13px] font-bold text-[#3B82F6]">View All Transactions</span>
                    </div>
                    <ChevronRight className="w-[18px] h-[18px] text-[#3B82F6] opacity-60" />
                </button>
            </div>
        </div>
    );
};
