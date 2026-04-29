
import React, { useEffect, useState } from 'react';
import { Bell, ShieldCheck, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface PushNotificationPromptProps {
    onEnable: () => Promise<void>;
    onDismiss: () => void;
    isBusy?: boolean;
    isDark?: boolean;
}

const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
    onEnable,
    onDismiss,
    isBusy,
    isDark = true,
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleEnable = async () => {
        triggerHaptic(HapticPatterns.light);
        await onEnable();
        setIsVisible(false);
    };

    const handleDismiss = () => {
        triggerHaptic(HapticPatterns.light);
        setIsVisible(false);
        setTimeout(onDismiss, 300);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    {/* Pop-up Container */}
                    <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={cn(
                                "w-full max-w-sm pointer-events-auto overflow-hidden rounded-[40px] border shadow-2xl relative",
                                isDark 
                                    ? "bg-[#0B1324] border-white/10 shadow-black/50" 
                                    : "bg-white border-slate-200 shadow-slate-200/50"
                            )}
                        >
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full -ml-12 -mb-12" />

                            <div className="p-8 relative z-10 text-center">
                                {/* Icon Header */}
                                <div className="flex justify-center mb-6">
                                    <div className={cn(
                                        "w-20 h-20 rounded-3xl flex items-center justify-center relative",
                                        isDark ? "bg-primary/20" : "bg-primary/10"
                                    )}>
                                        <Bell className="w-10 h-10 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
                                        <div className="absolute -top-1 -right-1">
                                            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <h2 className={cn(
                                    "text-2xl font-black tracking-tight mb-3 italic uppercase",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>
                                    Instant Alerts
                                </h2>
                                <p className={cn(
                                    "text-sm font-medium leading-relaxed mb-8 opacity-60",
                                    isDark ? "text-white" : "text-slate-600"
                                )}>
                                    Don't miss out on high-paying deals. Enable notifications to get instant alerts for new offers and payments.
                                </p>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleEnable}
                                        disabled={isBusy}
                                        className="w-full h-14 bg-primary text-white font-black italic rounded-2xl text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {isBusy ? "Enabling..." : "Allow Notifications"}
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className={cn(
                                            "w-full h-14 font-black italic rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all",
                                            isDark ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        Maybe Later
                                    </button>
                                </div>

                                {/* Security Note */}
                                <div className="mt-6 flex items-center justify-center gap-2 opacity-30">
                                    <ShieldCheck className={cn("w-3.5 h-3.5", isDark ? "text-white" : "text-slate-900")} />
                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>
                                        Privacy Protected
                                    </span>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className={cn(
                                    "absolute top-5 right-5 p-2 rounded-full transition-all active:scale-90",
                                    isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                                )}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PushNotificationPrompt;
