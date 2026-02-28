import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardStatsSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-2xl p-6 shadow-lg"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                    <Skeleton className="w-24 h-4 mb-2" />
                    <Skeleton className="w-32 h-8" />
                </motion.div>
            ))}
        </div>
    );
};

export const ActiveDealsSkeleton = () => {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl p-4 shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <div className="flex-1">
                                <Skeleton className="w-32 h-4 mb-2" />
                                <Skeleton className="w-24 h-3" />
                            </div>
                        </div>
                        <Skeleton className="w-20 h-6" />
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl p-4 shadow-lg"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="w-32 h-4 mb-2" />
                                <Skeleton className="w-24 h-3" />
                            </div>
                        </div>
                        <Skeleton className="w-20 h-6 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="flex-1 h-10 rounded-lg" />
                        <Skeleton className="flex-1 h-10 rounded-lg" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
