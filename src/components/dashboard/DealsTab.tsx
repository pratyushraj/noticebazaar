import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
    ChevronRight, Clock, CreditCard, AlertCircle, Zap, 
    CheckCircle2, Camera 
} from 'lucide-react';

interface DealsTabProps {
    isDark: boolean;
    textColor: string;
    collabSubTab: 'pending' | 'active' | 'completed';
    setCollabSubTab: (tab: 'pending' | 'active' | 'completed') => void;
    searchParams: URLSearchParams;
    setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void;
    triggerHaptic: (pattern?: any) => void;
    activeDealsCount: number;
    activeDealsList: any[];
    completedDealsCount: number;
    completedDealsList: any[];
    pendingOffersCount: number;
    pendingOffersDeduplicated: any[];
    getCreatorDealCardUX: (deal: any) => any;
    resolveCreatorDealProductImage: (deal: any) => string;
    setSelectedItem: (item: any) => void;
    setSelectedType: (type: 'deal' | 'offer') => void;
    handleAccept: (req: any) => void;
    onDeclineRequest: (id: string) => void;
}

export const DealsTab = React.memo(({ 
    isDark, textColor, collabSubTab, 
    setCollabSubTab, searchParams, setSearchParams, triggerHaptic, 
    activeDealsCount, activeDealsList, completedDealsCount, 
    completedDealsList, pendingOffersDeduplicated, getCreatorDealCardUX, 
    resolveCreatorDealProductImage, setSelectedItem, 
    setSelectedType, pendingOffersCount, handleAccept, onDeclineRequest
}: DealsTabProps) => {
    return (
        <div className={cn("px-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20", isDark ? "" : "bg-slate-50")}>
            <div className="pt-2 mb-6">
                <div className={cn("p-1.5 rounded-[22px] border flex gap-1.5 backdrop-blur-xl", isDark ? "bg-secondary/[0.06] border-border/50" : "bg-slate-100/80 border-slate-200/60")}>
                    {(['pending', 'active', 'completed'] as const).map((tab) => (
                        <button key={tab} type="button"
                            onClick={() => {
                                triggerHaptic();
                                setCollabSubTab(tab);
                                const next = new URLSearchParams(searchParams);
                                next.set('tab', 'deals');
                                next.set('subtab', tab);
                                next.delete('requestId');
                                setSearchParams(next, { replace: true });
                            }}
                            className={cn(
                                "flex-1 h-11 rounded-[18px] px-3 transition-all flex items-center justify-center",
                                collabSubTab === tab
                                    ? isDark ? 'bg-card text-foreground shadow-lg' : 'bg-blue-600 text-white shadow-lg'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab === 'pending' ? 'Offers' : tab}</span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {collabSubTab === 'active' ? (
                    <motion.div key="active" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <h2 className={cn("text-[20px] font-bold tracking-tight mb-4", textColor)}>Active Deals</h2>
                        {activeDealsCount > 0 ? (
                            <div className="space-y-4">
                                {activeDealsList.map((deal: any, idx: number) => {
                                    const ux = getCreatorDealCardUX(deal);
                                    const productImage = resolveCreatorDealProductImage(deal);
                                    const isBarter = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').toLowerCase().includes('barter');
                                    const budget = Number(deal?.deal_amount || deal?.budget_amount || deal?.exact_budget || deal?.product_value || 0);
                                    return (
                                        <motion.div key={deal.id || idx} whileTap={{ scale: 0.98 }} onClick={() => { triggerHaptic(); setSelectedItem(deal); setSelectedType('deal'); }} className={cn("relative w-full aspect-[1.2/1] rounded-[2.5rem] overflow-hidden bg-[#0B1220] border-0 shadow-2xl mb-6")}>
                                            <div className="absolute inset-0">
                                                {productImage && <img src={productImage} className="w-full h-full object-cover" />}
                                                <div className={cn(
                                                    "absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30",
                                                    isBarter && "bg-amber-950/40"
                                                )} />
                                            </div>
                                            <div className="relative h-full p-5 flex flex-col justify-between z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2.5 py-1.5 rounded-full bg-emerald-500 self-start text-[11px] font-black text-white uppercase tracking-widest shadow-sm">{ux.stagePill}</div>
                                                    <div className={cn(
                                                        "px-2.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest",
                                                        isBarter 
                                                            ? "bg-orange-500 text-white shadow-sm" 
                                                            : "bg-blue-500 text-white shadow-sm"
                                                    )}>
                                                        {isBarter ? 'Barter' : 'Paid'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <h2 className="text-xl font-black italic uppercase text-white">{deal.brand_name || 'Partner'}</h2>
                                                        <p className="text-lg font-black text-white">₹{budget.toLocaleString()}</p>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div className={cn(
                                                            "h-full transition-all duration-1000",
                                                            isBarter ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "bg-emerald-400"
                                                        )} style={{ width: `${(ux.progressStep / 5) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : <div className="p-10 text-center opacity-40">No active deals</div>}
                    </motion.div>
                ) : collabSubTab === 'completed' ? (
                    <motion.div key="completed" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                         <h2 className={cn("text-[20px] font-bold tracking-tight mb-4", textColor)}>Completed</h2>
                         {completedDealsCount > 0 ? (
                             <div className="space-y-4">
                                {completedDealsList.map((deal: any, idx: number) => {
                                    const productImage = resolveCreatorDealProductImage(deal);
                                    const isBarter = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').toLowerCase().includes('barter');
                                    const budget = Number(deal?.deal_amount || deal?.budget_amount || deal?.exact_budget || deal?.product_value || 0);
                                    return (
                                        <motion.div key={deal.id || idx} whileTap={{ scale: 0.98 }} onClick={() => { triggerHaptic(); setSelectedItem(deal); setSelectedType('deal'); }} className={cn("relative w-full aspect-[1.2/1] rounded-[2.5rem] overflow-hidden bg-[#0B1220] border-0 shadow-2xl mb-6")}>
                                            <div className="absolute inset-0">
                                                {productImage && <img src={productImage} className="w-full h-full object-cover opacity-50" />}
                                                <div className={cn(
                                                    "absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30",
                                                    isBarter && "bg-amber-950/40"
                                                )} />
                                            </div>
                                            <div className="relative h-full p-5 flex flex-col justify-between z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2.5 py-1.5 rounded-full bg-slate-500 self-start text-[11px] font-black text-white uppercase tracking-widest shadow-sm">Completed</div>
                                                    <div className={cn(
                                                        "px-2.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest",
                                                        isBarter 
                                                            ? "bg-orange-500 text-white shadow-sm" 
                                                            : "bg-blue-500 text-white shadow-sm"
                                                    )}>
                                                        {isBarter ? 'Barter' : 'Paid'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <h2 className="text-xl font-black italic uppercase text-white">{deal.brand_name || 'Partner'}</h2>
                                                        <p className="text-lg font-black text-white">₹{budget.toLocaleString()}</p>
                                                    </div>
                                                    <div className="h-1 w-full bg-emerald-500/30 rounded-full overflow-hidden"><div className={cn("h-full w-full", isBarter ? "bg-amber-400" : "bg-emerald-400")} /></div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                             </div>
                         ) : <div className="p-10 text-center opacity-40">No completed deals</div>}
                    </motion.div>
                ) : (
                    <motion.div key="pending" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <h2 className={cn("text-[20px] font-bold tracking-tight mb-4", textColor)}>Offers</h2>
                        {pendingOffersCount > 0 ? (
                            <div className="space-y-4">
                                {pendingOffersDeduplicated.map((req: any, idx: number) => {
                                    const productImage = resolveCreatorDealProductImage(req);
                                    const isBarter = String(req?.collab_type || req?.deal_type || req?.raw?.collab_type || '').toLowerCase().includes('barter');
                                    const budget = Number(req?.budget_amount || req?.exact_budget || req?.deal_amount || req?.product_value || 0);
                                    return (
                                        <motion.div key={req.id || idx} whileTap={{ scale: 0.98 }} onClick={() => { triggerHaptic(); setSelectedItem(req); setSelectedType('offer'); }} className={cn("relative w-full aspect-[1.2/1] rounded-[2.5rem] overflow-hidden bg-[#0B1220] border-0 shadow-2xl mb-6")}>
                                            <div className="absolute inset-0">
                                                {productImage && <img src={productImage} className="w-full h-full object-cover" />}
                                                <div className={cn(
                                                    "absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30",
                                                    isBarter && "bg-amber-950/40"
                                                )} />
                                            </div>
                                            <div className="relative h-full p-5 flex flex-col justify-between z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2.5 py-1.5 rounded-full bg-violet-600 self-start text-[11px] font-black text-white uppercase tracking-widest shadow-sm">New Offer</div>
                                                    <div className={cn(
                                                        "px-2.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest",
                                                        isBarter 
                                                            ? "bg-orange-500 text-white shadow-sm" 
                                                            : "bg-blue-500 text-white shadow-sm"
                                                    )}>
                                                        {isBarter ? 'Barter' : 'Paid'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-end mb-4">
                                                        <h2 className="text-xl font-black italic uppercase text-white truncate max-w-[60%]">{req.brand_name || 'Brand Partner'}</h2>
                                                        <p className="text-lg font-black text-white">₹{budget.toLocaleString()}</p>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleAccept(req); 
                                                            }}
                                                            className={cn(
                                                                "flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg",
                                                                isBarter ? "bg-amber-500 text-white" : "bg-white text-black"
                                                            )}
                                                        >
                                                            {isBarter ? 'Claim Product' : 'Accept'}
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                triggerHaptic(); 
                                                                onDeclineRequest(req.id);
                                                            }}
                                                            className="flex-1 h-11 rounded-xl bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center active:scale-95 transition-all"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                             </div>
                        ) : <div className="p-10 text-center opacity-40">No pending offers</div>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
