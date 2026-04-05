import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardStatsSkeleton = () => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card border border-border rounded-2xl p-5"
                >
                    <div className="flex items-start justify-between mb-4">
                        <Skeleton className="w-9 h-9 rounded-xl" />
                        <Skeleton className="w-14 h-5 rounded-full" />
                    </div>
                    <Skeleton className="w-20 h-3 mb-2" />
                    <Skeleton className="w-28 h-7" />
                </motion.div>
            ))}
        </div>
    );
};

export const ActiveDealsSkeleton = () => {
    return (
        <div className="space-y-3">
            {[0, 1].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card border border-border rounded-2xl p-6"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <div className="flex-1">
                                <Skeleton className="w-36 h-4 mb-2" />
                                <Skeleton className="w-24 h-3" />
                            </div>
                        </div>
                        <Skeleton className="w-16 h-8 rounded-full" />
                    </div>
                    <div className="mt-4 h-1 rounded-full bg-secondary overflow-hidden">
                        <Skeleton className="h-full w-3/4" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export const CollabRequestsSkeleton = () => {
    return (
        <div className="space-y-3">
            {[0, 1].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card border border-border rounded-2xl p-6"
                >
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <div className="flex-1">
                                <Skeleton className="w-32 h-4 mb-2" />
                                <Skeleton className="w-20 h-3" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="flex-1 h-10 rounded-xl" />
                        <Skeleton className="flex-1 h-10 rounded-xl" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
