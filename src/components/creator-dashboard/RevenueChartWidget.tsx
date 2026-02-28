import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/utils/currency';

interface RevenueDataPoint {
    month: string;
    amount: number;
}

interface RevenueChartWidgetProps {
    data: RevenueDataPoint[];
    totalRevenue: number;
    trend: {
        value: number;
        isPositive: boolean;
    };
}

export const RevenueChartWidget = ({ data, totalRevenue, trend }: RevenueChartWidgetProps) => {
    // Calculate max value for scaling
    const maxValue = Math.max(...data.map(d => d.amount), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-2 border-green-400/30 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg"
        >
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-0.5 md:mb-1">Revenue Trend</h3>
                    <p className="text-xs md:text-sm text-white/60">Last 6 months</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'flex items-center gap-1 text-[11px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full',
                        trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    )}>
                        {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend.value)}%
                    </div>
                </div>
            </div>

            {/* Total Revenue */}
            <div className="mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-white/60 mb-1">Total Revenue</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400">
                    {formatIndianCurrency(totalRevenue)}
                </p>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-1.5 md:gap-2 h-24 md:h-32">
                {data.map((point, index) => {
                    const heightPercentage = (point.amount / maxValue) * 100;

                    return (
                        <div key={point.month} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercentage}%` }}
                                transition={{ delay: 0.3 + index * 0.1, duration: 0.5, ease: 'easeOut' }}
                                className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg relative group cursor-pointer"
                                style={{ minHeight: point.amount > 0 ? '4px' : '0' }}
                            >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        {formatIndianCurrency(point.amount)}
                                    </div>
                                    <div className="w-2 h-2 bg-black/90 rotate-45 -mt-1 mx-auto"></div>
                                </div>
                            </motion.div>
                            <span className="text-[9px] md:text-[10px] text-white/40 font-medium">
                                {point.month}
                            </span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};
