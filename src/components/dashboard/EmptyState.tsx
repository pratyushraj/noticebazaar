import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
    isDark: boolean;
    textColor: string;
    completionScore: number;
    onOptimize: () => void;
    onShare: () => void;
}

export const DashboardEmptyState: React.FC<EmptyStateProps> = ({
    isDark,
    textColor,
    completionScore,
    onOptimize,
    onShare
}) => {
    return (
        <div className="space-y-6">
            <div className={cn(
                "p-8 rounded-[2.5rem] relative overflow-hidden border",
                isDark ? "bg-card border-white/5" : "bg-white border-[#E5E7EB] shadow-2xl shadow-indigo-500/5"
            )}>
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/5 blur-[50px] rounded-full -mr-20 -mt-20" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl", isDark ? "bg-primary/20 text-primary border border-primary/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100")}>
                            <Rocket className="w-7 h-7" />
                        </div>
                        <div className="text-right">
                            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", textColor)}>Profile Strength</p>
                            <p className={cn("text-xl font-black tabular-nums", textColor)}>{completionScore}%</p>
                        </div>
                    </div>

                    <h3 className={cn("text-[24px] font-black tracking-tight mb-2 leading-none", textColor)}>Ready for Lift-off?</h3>
                    <p className={cn("text-[14px] font-bold opacity-40 mb-6 max-w-[280px] leading-relaxed", textColor)}>
                        Your link is live, but adding more data makes you <span className={cn("font-black", isDark ? "text-primary" : "text-emerald-600")}>3.5x more likely</span> to get brand deals.
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className={cn("h-3 w-full rounded-full overflow-hidden relative", isDark ? "bg-white/5" : "bg-slate-100")}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${completionScore}%` }}
                                className={cn("h-full absolute left-0 top-0", isDark ? "bg-primary shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-emerald-500 shadow-sm shadow-emerald-500/20")} 
                            />
                        </div>
                        <div className="flex justify-between mt-2.5">
                            <p className={cn("text-[10px] font-black opacity-30", textColor)}>ROOKIE</p>
                            <p className={cn("text-[10px] font-black text-primary", textColor)}>CERTIFIED CREATOR</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={onOptimize}
                            className={cn("w-full py-4 rounded-[20px] font-black text-[13px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2", isDark ? "bg-white text-black" : "bg-slate-900 text-white")}
                        >
                            Optimize Link
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                        <button
                            type="button"
                            onClick={onShare}
                            className={cn("w-full py-4 rounded-[20px] font-black text-[12px] uppercase tracking-widest transition-all active:scale-[0.98] border", isDark ? "bg-transparent border-white/10 text-white/60 hover:bg-white/5" : "bg-white border-slate-200 text-slate-500")}
                        >
                            Share Live Link
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity Mini-Feed */}
            <div className="px-1">
                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-30 mb-4", textColor)}>Growth Tips</p>
                <div className="space-y-3">
                    {[
                        { icon: <CheckCircle2 className="text-emerald-500 w-5 h-5" />, text: "Verified badge increases brand trust by 45%" },
                        { icon: <Zap className="text-amber-500 w-5 h-5" />, text: "Creators with 3+ packages get 6x more deals" },
                    ].map((tip, i) => (
                        <div key={i} className={cn("flex items-start gap-3 p-4 rounded-2xl border", isDark ? "bg-card border-border" : "bg-white border-slate-100")}>
                            <div className="shrink-0 mt-0.5">{tip.icon}</div>
                            <p className={cn("text-[12px] font-bold opacity-60 leading-tight", textColor)}>{tip.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
