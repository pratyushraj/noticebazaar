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
    color: 'blue' | 'green' | 'purple' | 'orange';
    delay?: number;
}

const colorClasses = {
    blue: {
        bg: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-blue-400/30',
        icon: 'bg-blue-500/20 text-blue-400',
        text: 'text-blue-400',
    },
    green: {
        bg: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-400/30',
        icon: 'bg-green-500/20 text-green-400',
        text: 'text-green-400',
    },
    purple: {
        bg: 'from-purple-500/20 to-pink-500/20',
        border: 'border-purple-400/30',
        icon: 'bg-purple-500/20 text-purple-400',
        text: 'text-purple-400',
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
                'bg-gradient-to-br backdrop-blur-xl border-2 rounded-xl md:rounded-2xl p-3.5 md:p-6 shadow-lg relative overflow-hidden',
                colors.bg,
                colors.border
            )}
        >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2.5 md:mb-4">
                    <div className={cn('w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center', colors.icon)}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full',
                            trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        )}>
                            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>

                <p className="text-white/65 text-[11px] md:text-sm mb-1 md:mb-2 leading-tight">{label}</p>
                <p className={cn('text-[22px] md:text-3xl font-bold leading-tight', colors.text)}>
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
                color="purple"
                delay={0.3}
            />
        </div>
    );
};
