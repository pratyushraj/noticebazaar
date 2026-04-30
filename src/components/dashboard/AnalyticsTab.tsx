import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

interface AnalyticsTabProps {
    isDark: boolean;
    textColor: string;
    secondaryTextColor: string;
    isLoadingDeals: boolean;
    brandDeals: any[];
    activeDealsCount: number;
    creatorActivities: any[];
    setSearchQuery: (query: string) => void;
    setDealFilters: (filters: any) => void;
    setActiveTab: (tab: string) => void;
    handleAction: (action: string) => void;
    avatarUrl: string;
    avatarFallbackUrl: string;
    DashboardLoadingStage: any;
    DashboardMetricsCards: any;
    DealSearchFilter: any;
    EnhancedInsights: any;
    ActivityFeed: any;
    PaymentTimeline: any;
    AchievementBadges: any;
    DealStatusFlow: any;
    DealTimelineView: any;
    SmartNotificationsCenter: any;
    MenuIcon: any;
}

export const AnalyticsTab = React.memo(({
    isDark, textColor, secondaryTextColor, isLoadingDeals, brandDeals,
    activeDealsCount, creatorActivities, setSearchQuery, setDealFilters,
    setActiveTab, handleAction, avatarUrl, avatarFallbackUrl,
    DashboardLoadingStage, DashboardMetricsCards, DealSearchFilter,
    EnhancedInsights, ActivityFeed, PaymentTimeline, AchievementBadges,
    DealStatusFlow, DealTimelineView, SmartNotificationsCenter,
    MenuIcon
}: AnalyticsTabProps) => {
    return (
        <>
            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                <div className="flex items-center justify-between mb-8">
                    <button type="button" onClick={() => handleAction('menu')} aria-label="Open menu" className={cn("w-10 h-10 -ml-1 rounded-xl flex items-center justify-center transition-all active:scale-95", isDark ? "bg-white/5" : "bg-slate-100")}>
                        <MenuIcon className={cn("w-5 h-5", secondaryTextColor)} strokeWidth={2} />
                    </button>

                    <div className="flex items-center gap-1.5 font-bold text-[16px] tracking-tight">
                        <ShieldCheck className={cn("w-4 h-4", isDark ? "text-primary" : "text-primary")} strokeWidth={2.5} />
                        <span className={textColor}>Creator Armour</span>
                    </div>

                    <button type="button" onClick={() => setActiveTab('profile')} className={cn("w-10 h-10 rounded-xl border p-0.5 overflow-hidden transition-all active:scale-95 shadow-sm", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white")}>
                        <div className="w-full h-full rounded-[10px] overflow-hidden">
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).onerror = null;
                                    (e.currentTarget as HTMLImageElement).src = avatarFallbackUrl;
                                }}
                            />
                        </div>
                    </button>
                </div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h1 className={cn('text-[22px] font-black tracking-tight font-outfit', textColor)}>Analytics</h1>
                    <p className={cn('text-[14px] mt-1', secondaryTextColor)}>
                        Performance, deal insights, payments, and activity are all here now.
                    </p>
                </motion.div>
            </div>

            <div className="px-5 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                >
                    <h3 className={cn('text-sm font-bold tracking-tight mb-3', textColor)}>Your Performance</h3>
                </motion.div>
                {isLoadingDeals ? (
                    <DashboardLoadingStage isDark={isDark} />
                ) : (
                    <DashboardMetricsCards
                        totalDealValue={brandDeals?.reduce((sum: number, deal: any) => sum + (deal.deal_amount || 0), 0) || 0}
                        activeDealCount={activeDealsCount}
                        outstandingPayments={brandDeals?.filter((d: any) => {
                            const s = (d.status || '').toLowerCase();
                            return s.includes('payment_pending') || s.includes('payment_awaiting');
                        }).reduce((sum: number, deal: any) => sum + (deal.deal_amount || 0), 0) || 0}
                        avgDealDuration={30}
                        isDark={isDark}
                    />
                )}
            </div>

            <div className="px-5 mb-8">
                <DealSearchFilter
                    onSearch={(query: string) => setSearchQuery(query)}
                    onFilterChange={(filters: any) => setDealFilters(filters)}
                    isDark={isDark}
                    totalDeals={brandDeals?.length || 0}
                />
            </div>

            <div className="px-5 mb-8">
                <EnhancedInsights isDark={isDark} brandDeals={brandDeals} />
            </div>

            <div className="px-5 mb-8">
                <ActivityFeed activities={creatorActivities} isDark={isDark} maxItems={4} />
            </div>

            <div className="px-5 mb-8">
                <PaymentTimeline isDark={isDark} maxItems={5} />
            </div>

            <div className="px-5 mb-8">
                <AchievementBadges isDark={isDark} showUnlocked={true} />
            </div>

            <div className="px-5 mb-8">
                <DealStatusFlow isDark={isDark} />
            </div>

            <div className="px-5 mb-8">
                <DealTimelineView isDark={isDark} />
            </div>

            <div className="px-5 mb-8">
                <SmartNotificationsCenter isDark={isDark} />
            </div>
        </>
    );
});
