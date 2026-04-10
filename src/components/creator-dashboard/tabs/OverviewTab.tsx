import React from 'react';
import { motion } from 'framer-motion';
import { ios, typography } from '@/lib/design-system';
import { Card, CardContent } from '@/components/ui/card';
import HeroEarningsCard from '../HeroEarningsCard';
import { UrgentActionsWidget } from '../UrgentActionsWidget';

interface OverviewTabProps {
    profile: any;
    brandDeals: any[];
    monthlyRevenue: number;
    urgentActions: any[];
}

const OverviewTab = ({
    profile,
    brandDeals,
    monthlyRevenue,
    urgentActions,
}: OverviewTabProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* 1. Earnings (Primary) */}
            <div className="w-full">
                <HeroEarningsCard
                    current={monthlyRevenue}
                    previous={0}
                    goal={100000}
                    brandDeals={brandDeals}
                />
            </div>

            {/* 2. Deal Status (Urgent Actions) */}
            {urgentActions.length > 0 && (
                <section>
                    <UrgentActionsWidget actions={urgentActions} />
                </section>
            )}

            {/* 3. Status Feedback (if deals exist but none are urgent) */}
            {urgentActions.length === 0 && brandDeals.length > 0 && (
                <Card className={ios.glass.full}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-white">All collaborations are up to date</p>
                            <p className="text-xs text-white/40 mt-0.5">Check back later for brand responses</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary text-sm">✓</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
};

export default OverviewTab;
