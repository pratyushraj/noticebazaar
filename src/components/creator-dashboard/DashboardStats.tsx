import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, IndianRupee, FileText, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';

interface StatCardProps {
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon: React.ReactNode;
    accent?: boolean; // true = use green, false = neutral
    delay?: number;
}

export const StatCard = ({ label, value, prefix, suffix, trend, icon, accent = false, delay = 0 }: StatCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3, ease: 'easeOut' }}
            className={cn(
                'rounded-2xl border border-border bg-card p-5 flex flex-col gap-4',
                accent ? 'shadow-md' : 'shadow-sm'
            )}
        >
            <div className="flex items-start justify-between">
                <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center',
                    accent ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                )}>
                    {icon}
                </div>
                {trend && (
                    <div className={cn(
                        'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                        trend.isPositive ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
                    )}>
                        {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={cn(
                    'text-2xl font-semibold tracking-tight',
                    accent ? 'text-foreground' : 'text-foreground'
                )}>
                    {prefix}
                    <CountUp
                        end={value}
                        duration={1.5}
                        delay={delay}
                        separator=","
                        decimals={0}
                    />
                    {suffix}
                </p>
            </div>
        </motion.div>
    );
};

interface DashboardStatsProps {
    stats: {
        totalEarnings: number;
        activeDeals: number;
        pendingPayments: number;
        completedDeals: number;
    };
    trends?: {
        earnings?: number;
        deals?: number;
    };
}

export const DashboardStats = ({ stats, trends }: DashboardStatsProps) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Total Earnings"
                value={stats.totalEarnings}
                prefix="₹"
                icon={<IndianRupee className="w-4 h-4" />}
                accent={true}
                trend={trends?.earnings ? { value: trends.earnings, isPositive: trends.earnings > 0 } : undefined}
                delay={0}
            />
            <StatCard
                label="Active Deals"
                value={stats.activeDeals}
                icon={<FileText className="w-4 h-4" />}
                accent={false}
                trend={trends?.deals ? { value: trends.deals, isPositive: trends.deals > 0 } : undefined}
                delay={0.05}
            />
            <StatCard
                label="Pending Payments"
                value={stats.pendingPayments}
                prefix="₹"
                icon={<Clock className="w-4 h-4" />}
                accent={false}
                delay={0.1}
            />
            <StatCard
                label="Completed"
                value={stats.completedDeals}
                icon={<CheckCircle className="w-4 h-4" />}
                accent={false}
                delay={0.15}
            />
        </div>
    );
};
