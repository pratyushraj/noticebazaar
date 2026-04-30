import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Heart } from 'lucide-react';

interface DiscoveryTabProps {
    isDark: boolean;
    textColor: string;
}

export const DiscoveryTab = React.memo(({ isDark, textColor }: DiscoveryTabProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative mb-10">
                <div className="absolute inset-0 bg-rose-500/30 blur-[80px] rounded-full animate-pulse" />
                <div className="relative w-28 h-28 bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 rounded-[2.8rem] flex items-center justify-center shadow-2xl shadow-rose-500/40 rotate-12 group transition-transform hover:rotate-0 duration-500">
                    <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl rotate-[-12deg] border border-slate-100">
                    <Heart className="w-6 h-6 text-rose-500" />
                </div>
            </div>
            
            <h1 className={cn("text-4xl font-black italic uppercase tracking-tighter mb-4", isDark ? "text-white" : "text-black")}>
                Brand Discovery
            </h1>
            
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-rose-500/15 border border-rose-500/20 mb-8 backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Future Section</span>
            </div>

            <div className={cn(
                "max-w-[320px] p-6 rounded-[32px] border relative overflow-hidden",
                isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-xl shadow-rose-500/5"
            )}>
                <div className="relative z-10">
                    <h3 className={cn("text-lg font-black italic mb-3", textColor)}>Brand Opportunities</h3>
                    <p className={cn("text-[14px] font-medium leading-relaxed opacity-70", textColor)}>
                        This will be the home for discovery cards where brands post active campaigns for influencers to join.
                    </p>
                    
                    <div className="mt-6 flex flex-col gap-2">
                        <div className={cn("h-4 rounded-lg w-full animate-pulse", isDark ? "bg-white/5" : "bg-slate-100")} />
                        <div className={cn("h-4 rounded-lg w-[80%] animate-pulse", isDark ? "bg-white/5" : "bg-slate-100")} />
                        <div className={cn("h-10 rounded-xl w-full mt-4 flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-30 border-2 border-dashed", isDark ? "border-white/10" : "border-slate-200")}>
                            COMING SOON
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
