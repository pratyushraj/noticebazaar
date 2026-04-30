import React from 'react';
import { motion } from 'framer-motion';
import { Home, Zap, DollarSign, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
    activeTab: string;
    effectiveTab: string;
    isDark: boolean;
    secondaryTextColor: string;
    pendingOffersCount: number;
    triggerHaptic: (pattern?: any) => void;
    setActiveTab: (tab: string) => void;
    scrollRef: React.RefObject<HTMLDivElement>;
    scrollPositionsRef: React.MutableRefObject<Record<string, number>>;
    isOverlayOpen: boolean;
}

export const BottomNavigationBar = React.memo(({
    activeTab, effectiveTab, isDark, secondaryTextColor,
    pendingOffersCount, triggerHaptic, setActiveTab,
    scrollRef, scrollPositionsRef, isOverlayOpen
}: BottomNavigationProps) => {
    const tabs = [
        { id: 'dashboard', label: 'Home', icon: Home },
        { id: 'discovery', label: 'Discovery', icon: Zap },
        { id: 'deals', label: 'Deals', icon: Briefcase, badge: pendingOffersCount > 0 ? pendingOffersCount : undefined },
        { id: 'payments', label: 'Revenue', icon: DollarSign },
        { id: 'profile', label: 'Account', icon: User }
    ];

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-[100] pb-safe pt-2 px-4 transition-all duration-500",
            isOverlayOpen ? "opacity-0 translate-y-20 pointer-events-none" : "opacity-100 translate-y-0"
        )}>
            <div className={cn(
                "max-w-md mx-auto rounded-[2.5rem] border backdrop-blur-3xl p-2 flex items-center justify-between shadow-2xl",
                isDark ? "bg-[#0B1A14]/80 border-emerald-900/30" : "bg-white/90 border-slate-200"
            )}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (isActive) {
                                    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                } else {
                                    triggerHaptic();
                                    if (scrollRef.current) {
                                        scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop;
                                    }
                                    setActiveTab(tab.id);
                                }
                            }}
                            className="relative flex-1 flex flex-col items-center justify-center py-2 transition-all duration-300"
                        >
                            <div className={cn(
                                "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                isActive 
                                    ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                    : "text-slate-400"
                            )}>
                                <Icon className={cn("w-6 h-6 transition-transform duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                                
                                {tab.badge && (
                                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-rose-500 border-2 border-white dark:border-[#0B1A14] flex items-center justify-center px-1">
                                        <span className="text-[10px] font-black text-white leading-none">{tab.badge}</span>
                                    </div>
                                ) }
                            </div>
                            
                            {isActive && (
                                <motion.div 
                                    layoutId="navIndicator"
                                    className={cn("absolute -bottom-1 w-1.5 h-1.5 rounded-full", isDark ? "bg-emerald-400" : "bg-emerald-600")}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});
