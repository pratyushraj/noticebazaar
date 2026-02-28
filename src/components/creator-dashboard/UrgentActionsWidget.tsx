import { motion } from 'framer-motion';
import { AlertTriangle, Clock, IndianRupee, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/utils/currency';

interface UrgentAction {
    id: string;
    type: 'payment_overdue' | 'deliverable_overdue' | 'signature_needed' | 'response_needed';
    brand_name: string;
    amount?: number;
    dueDate?: string;
    daysOverdue?: number;
    onClick: () => void;
}

interface UrgentActionsWidgetProps {
    actions: UrgentAction[];
}

const actionConfig = {
    payment_overdue: {
        icon: IndianRupee,
        color: 'red',
        label: 'Payment Overdue',
        bgClass: 'from-red-500/20 to-orange-500/20',
        borderClass: 'border-red-400/30',
        iconClass: 'bg-red-500/20 text-red-400',
    },
    deliverable_overdue: {
        icon: Clock,
        color: 'orange',
        label: 'Deliverable Overdue',
        bgClass: 'from-orange-500/20 to-yellow-500/20',
        borderClass: 'border-orange-400/30',
        iconClass: 'bg-orange-500/20 text-orange-400',
    },
    signature_needed: {
        icon: Calendar,
        color: 'blue',
        label: 'Signature Needed',
        bgClass: 'from-blue-500/20 to-indigo-500/20',
        borderClass: 'border-blue-400/30',
        iconClass: 'bg-blue-500/20 text-blue-400',
    },
    response_needed: {
        icon: AlertTriangle,
        color: 'purple',
        label: 'Response Needed',
        bgClass: 'from-purple-500/20 to-pink-500/20',
        borderClass: 'border-purple-400/30',
        iconClass: 'bg-purple-500/20 text-purple-400',
    },
};

export const UrgentActionsWidget = ({ actions }: UrgentActionsWidgetProps) => {
    if (actions.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl border-2 border-red-400/20 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg"
        >
            <div className="flex items-center gap-2.5 md:gap-3 mb-3.5 md:mb-4">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                    <h3 className="text-base md:text-lg font-bold text-white">Urgent Actions</h3>
                    <p className="text-xs md:text-sm text-white/60">{actions.length} item{actions.length > 1 ? 's' : ''} need attention</p>
                </div>
            </div>

            <div className="space-y-2.5 md:space-y-3">
                {actions.slice(0, 3).map((action, index) => {
                    const config = actionConfig[action.type];
                    const Icon = config.icon;

                    return (
                        <motion.button
                            key={action.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={action.onClick}
                            className={cn(
                                'w-full bg-gradient-to-br backdrop-blur-xl border-2 rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] group',
                                config.bgClass,
                                config.borderClass
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                                    <div className={cn('w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0', config.iconClass)}>
                                        <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="text-xs md:text-sm font-bold text-white truncate">{action.brand_name}</p>
                                        <p className="text-[11px] md:text-xs text-white/60">{config.label}</p>
                                        {action.daysOverdue && (
                                            <p className="text-[11px] md:text-xs text-red-400 font-bold mt-0.5 md:mt-1">
                                                {action.daysOverdue} day{action.daysOverdue > 1 ? 's' : ''} overdue
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                    {action.amount && (
                                        <span className="text-white font-bold text-xs md:text-sm">
                                            {formatIndianCurrency(action.amount)}
                                        </span>
                                    )}
                                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {actions.length > 3 && (
                <p className="text-center text-xs md:text-sm text-white/40 mt-3 md:mt-4">
                    +{actions.length - 3} more action{actions.length - 3 > 1 ? 's' : ''}
                </p>
            )}
        </motion.div>
    );
};
