import { motion } from 'framer-motion';
import { Clock, CheckCircle, FileText, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/utils/currency';

interface ActivityItem {
    id: string;
    type: 'deal_created' | 'payment_received' | 'contract_signed' | 'deliverable_completed';
    title: string;
    description: string;
    amount?: number;
    timestamp: string;
    relativeTime: string;
}

interface RecentActivityWidgetProps {
    activities: ActivityItem[];
    maxItems?: number;
}

const activityConfig = {
    deal_created: {
        icon: FileText,
        color: 'blue',
        iconClass: 'bg-blue-500/20 text-blue-400',
    },
    payment_received: {
        icon: IndianRupee,
        color: 'green',
        iconClass: 'bg-green-500/20 text-green-400',
    },
    contract_signed: {
        icon: CheckCircle,
        color: 'purple',
        iconClass: 'bg-purple-500/20 text-purple-400',
    },
    deliverable_completed: {
        icon: Clock,
        color: 'orange',
        iconClass: 'bg-orange-500/20 text-orange-400',
    },
};

export const RecentActivityWidget = ({ activities, maxItems = 5 }: RecentActivityWidgetProps) => {
    if (activities.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg"
            >
                <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">Recent Activity</h3>
                <div className="text-center py-6 md:py-8">
                    <Clock className="w-10 h-10 md:w-12 md:h-12 text-white/20 mx-auto mb-2.5 md:mb-3" />
                    <p className="text-white/40 text-xs md:text-sm">No recent activity</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg"
        >
            <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">Recent Activity</h3>

            <div className="space-y-2.5 md:space-y-3">
                {activities.slice(0, maxItems).map((activity, index) => {
                    const config = activityConfig[activity.type];
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="flex items-start gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className={cn('w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0', config.iconClass)}>
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs md:text-sm font-bold text-white truncate">{activity.title}</p>
                                        <p className="text-[11px] md:text-xs text-white/60 mt-0.5">{activity.description}</p>
                                    </div>
                                    {activity.amount && (
                                        <span className="text-xs md:text-sm font-bold text-green-400 shrink-0">
                                            {formatIndianCurrency(activity.amount)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/40 mt-0.5 md:mt-1">{activity.relativeTime}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {activities.length > maxItems && (
                <button className="w-full mt-3 md:mt-4 text-xs md:text-sm text-white/60 hover:text-white transition-colors">
                    View all activity →
                </button>
            )}
        </motion.div>
    );
};
