import { motion } from 'framer-motion';
import { Plus, Link2, FileText, TrendingUp, MessageCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange';
    onClick: () => void;
    badge?: number;
}

interface QuickActionsWidgetProps {
    actions: QuickAction[];
}

const colorClasses = {
    blue: 'from-blue-500/20 to-indigo-500/20 border-blue-400/30 hover:border-blue-400/50',
    green: 'from-green-500/20 to-emerald-500/20 border-green-400/30 hover:border-green-400/50',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-400/30 hover:border-purple-400/50',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-400/30 hover:border-orange-400/50',
};

export const QuickActionsWidget = ({ actions }: QuickActionsWidgetProps) => {
    return (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
            {actions.map((action, index) => (
                <motion.button
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.onClick}
                    className={cn(
                        'relative bg-gradient-to-br backdrop-blur-xl border-2 rounded-lg md:rounded-xl p-2.5 md:p-4 shadow-lg transition-all group min-h-[88px] md:min-h-[116px]',
                        colorClasses[action.color]
                    )}
                >
                    {action.badge !== undefined && action.badge > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center border-2 border-purple-900">
                            {action.badge > 9 ? '9+' : action.badge}
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-1.5 md:gap-2">
                        <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                            {action.icon}
                        </div>
                        <span className="text-[11px] md:text-xs font-bold text-white text-center leading-tight">
                            {action.label}
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    );
};

// Pre-configured quick actions for common use cases
export const getDefaultQuickActions = (handlers: {
    onCreateDeal: () => void;
    onShareCollabLink: () => void;
    onViewContracts: () => void;
    onViewAnalytics: () => void;
    onViewMessages: () => void;
    onViewCalendar: () => void;
}, badges?: {
    messages?: number;
    contracts?: number;
}): QuickAction[] => [
        {
            id: 'create-deal',
            label: 'Create Deal',
            icon: <Plus className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'green',
            onClick: handlers.onCreateDeal,
        },
        {
            id: 'share-link',
            label: 'Share Link',
            icon: <Link2 className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'blue',
            onClick: handlers.onShareCollabLink,
        },
        {
            id: 'contracts',
            label: 'Contracts',
            icon: <FileText className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'purple',
            onClick: handlers.onViewContracts,
            badge: badges?.contracts,
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'orange',
            onClick: handlers.onViewAnalytics,
        },
        {
            id: 'messages',
            label: 'Messages',
            icon: <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'blue',
            onClick: handlers.onViewMessages,
            badge: badges?.messages,
        },
        {
            id: 'calendar',
            label: 'Calendar',
            icon: <Calendar className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'purple',
            onClick: handlers.onViewCalendar,
        },
    ];
