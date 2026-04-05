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
    color: 'blue' | 'green' | 'indigo' | 'orange';
    delay?: number;
}

const colorClasses = {
    blue: {
        bg: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-info/30',
        icon: 'bg-info/20 text-info',
        text: 'text-info',
    },
    green: {
        bg: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-400/30',
        icon: 'bg-green-500/20 text-green-400',
        text: 'text-green-400',
    },
    indigo: {
        bg: 'from-indigo-500/20 to-violet-500/20',
        border: 'border-indigo-400/30',
        icon: 'bg-indigo-500/20 text-indigo-400',
        text: 'text-indigo-400',
    },
    orange: {
        bg: 'from-orange-500/20 to-red-500/20',
        border: 'border-orange-400/30',
        icon: 'bg-orange-500/20 text-orange-400',
        text: 'text-orange-400',
    },
};

export const StatCard = ({ label, value, prefix, suffix, trend, icon, color, delay = 0 }: StatCardProps) => {
    const colors = colorClasses[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={cn(
                'bg-gradient-to-br backdrop-blur-xl border rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px] md:min-h-[140px]',
                colors.bg,
                colors.border
            )}
        >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <div className="flex items-start justify-between">
                    <div className={cn('w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0', colors.icon)}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full shrink-0',
                            trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'
                        )}>
                            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-foreground/70 text-[11px] md:text-sm font-medium mb-0.5 md:mb-1">{label}</p>
                    <p className={cn('text-xl md:text-3xl font-bold leading-none truncate', colors.text)}>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
            <StatCard
                label="Total Earnings"
                value={stats.totalEarnings}
                prefix="₹"
                icon={<IndianRupee className="w-5 h-5 md:w-6 md:h-6" />}
                color="green"
                trend={trends?.earnings ? { value: trends.earnings, isPositive: trends.earnings > 0 } : undefined}
                delay={0}
            />
            <StatCard
                label="Active Deals"
                value={stats.activeDeals}
                icon={<FileText className="w-5 h-5 md:w-6 md:h-6" />}
                color="blue"
                trend={trends?.deals ? { value: trends.deals, isPositive: trends.deals > 0 } : undefined}
                delay={0.1}
            />
            <StatCard
                label="Pending Payments"
                value={stats.pendingPayments}
                prefix="₹"
                icon={<Clock className="w-5 h-5 md:w-6 md:h-6" />}
                color="orange"
                delay={0.2}
            />
            <StatCard
                label="Completed"
                value={stats.completedDeals}
                icon={<CheckCircle className="w-5 h-5 md:w-6 md:h-6" />}
                color="indigo"
                delay={0.3}
            />
        </div>
    );
};
