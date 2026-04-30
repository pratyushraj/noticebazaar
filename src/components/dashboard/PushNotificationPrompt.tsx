
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
                                    ? "bg-[#0B1324] border-white/10 shadow-black/80" 
                                    : "bg-white border-slate-200 shadow-slate-200/50"
                            )}
                        >
                            {/* Premium Decorative elements */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-3xl rounded-full -mr-20 -mt-20 animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -ml-16 -mb-16" />

                            <div className="p-10 relative z-10 text-center">
                                {/* Icon Header */}
                                <div className="flex justify-center mb-8">
                                    <div className={cn(
                                        "w-24 h-24 rounded-[32px] flex items-center justify-center relative shadow-xl overflow-hidden",
                                        isDark ? "bg-primary/20" : "bg-primary/10"
                                    )}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent opacity-50" />
                                        <Bell className="w-12 h-12 text-primary relative z-10 animate-bounce" style={{ animationDuration: '4s' }} />
                                        <div className="absolute -top-1 -right-1">
                                            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <h2 className={cn(
                                    "text-3xl font-black tracking-tighter mb-4 italic uppercase leading-none",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>
                                    Instant<br />Alerts
                                </h2>
                                <p className={cn(
                                    "text-[15px] font-medium leading-relaxed mb-10",
                                    isDark ? "text-white/50" : "text-slate-600"
                                )}>
                                    Don't miss out on <span className={cn("font-bold", isDark ? "text-white" : "text-primary")}>high-paying deals</span>. Enable notifications to get instant alerts for new offers and payments.
                                </p>

                                {/* Action Buttons */}
                                <div className="space-y-4">
                                    <button
                                        onClick={handleEnable}
                                        disabled={isBusy}
                                        className="w-full h-16 bg-primary text-white font-black italic rounded-2xl text-base uppercase tracking-widest active:scale-95 transition-all shadow-[0_10px_20px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50"
                                    >
                                        {isBusy ? "Enabling..." : "Allow Notifications"}
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className={cn(
                                            "w-full h-12 font-black italic rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all",
                                            isDark ? "text-white/30 hover:text-white/50" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        Maybe Later
                                    </button>
                                </div>

                                {/* Security Note */}
                                <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
                                    <ShieldCheck className={cn("w-4 h-4", isDark ? "text-white" : "text-slate-900")} />
                                    <span className={cn("text-[11px] font-bold uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>
                                        Privacy Protected
                                    </span>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className={cn(
                                    "absolute top-6 right-6 p-2 rounded-full transition-all active:scale-90",
                                    isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                                )}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PushNotificationPrompt;
