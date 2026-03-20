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
        bgClass: 'from-blue-600/20 to-indigo-600/20',
        borderClass: 'border-blue-400/30',
        iconClass: 'bg-blue-600/20 text-blue-400',
    },
    response_needed: {
        icon: AlertTriangle,
        color: 'cyan',
        label: 'Response Needed',
        bgClass: 'from-cyan-600/20 to-blue-600/20',
        borderClass: 'border-cyan-400/30',
        iconClass: 'bg-cyan-600/20 text-cyan-400',
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
                                'w-full bg-gradient-to-br backdrop-blur-xl border border-white/10 rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden',
                                config.bgClass
                            )}
                        >
                            {/* Accent line on left */}
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.iconClass.split(' ')[0])} />

                            <div className="flex items-center justify-between pl-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', config.iconClass)}>
                                        <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{action.brand_name}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <p className="text-[11px] text-white/60 font-medium">{config.label}</p>
                                            {action.daysOverdue && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <p className="text-[11px] text-red-400 font-semibold">
                                                        {action.daysOverdue}d overdue
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                    {action.amount && (
                                        <span className={cn("font-bold text-sm", config.iconClass.split(' ')[1])}>
                                            {formatIndianCurrency(action.amount)}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 text-[10px] text-white/40 group-hover:text-white/70 transition-colors">
                                        Action <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
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
