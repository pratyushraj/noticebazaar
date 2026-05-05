const DashboardLoadingStage = ({ 
    isDark, 
    tab = 'analytics',
    triggerHaptic = () => {},
    setActiveTab = () => {},
    setActiveSettingsPage = () => {},
    userId
}: { 
    isDark: boolean; 
    tab?: string;
    triggerHaptic?: any;
    setActiveTab?: any;
    setActiveSettingsPage?: any;
    userId?: string;
}) => {
    const textColor = isDark ? "text-slate-100" : "text-slate-900";
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {tab === 'dashboard' ? (
                <>
                    {/* Skeleton for Welcome Header */}
                    <div className="relative z-10 -mt-2 mb-6">
                        <div className={cn(
                            "absolute inset-0 -z-10 overflow-hidden rounded-b-[40px] border-b",
                            isDark ? "bg-[#0B1A14] border-emerald-900/20" : "bg-emerald-600 border-emerald-700"
                        )}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>
                        <div className="px-6 pt-8 pb-12 space-y-3">
                            <div className={cn("h-3 w-32 rounded-full", isDark ? "bg-white/10" : "bg-white/20")} />
                            <div className={cn("h-8 w-64 rounded-xl", isDark ? "bg-white/10" : "bg-white/20")} />
                            <div className={cn("h-4 w-48 rounded-lg", isDark ? "bg-white/10" : "bg-white/20")} />
                        </div>
                    </div>

                    <div className="px-5 space-y-6">
                        {/* Skeleton for Earnings Card */}
                        <div className={cn("h-40 rounded-[32px] border relative overflow-hidden", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>

                        {/* Skeleton for Offers Section */}
                        <div className={cn("p-8 rounded-[40px] border space-y-6", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")}>
                            <div className="flex items-center justify-between">
                                <div className={cn("h-6 w-40 rounded-lg", isDark ? "bg-white/10" : "bg-slate-100")} />
                                <div className={cn("h-4 w-20 rounded-full", isDark ? "bg-white/10" : "bg-slate-100")} />
                            </div>
                            {[0, 1].map(i => (
                                <div key={i} className={cn("h-24 rounded-3xl border relative overflow-hidden", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Skeleton for Analytics Header */}
                    <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn("w-6 h-6 rounded-full", isDark ? "bg-white/10" : "bg-slate-200")} />
                            <div className={cn("h-4 w-32 rounded-lg", isDark ? "bg-white/10" : "bg-slate-200")} />
                            <div className={cn("w-11 h-11 rounded-full", isDark ? "bg-white/10" : "bg-slate-200")} />
                        </div>
                        <div className="space-y-3">
                            <div className={cn("h-7 w-32 rounded-lg", isDark ? "bg-white/10" : "bg-slate-200")} />
                            <div className={cn("h-4 w-full rounded-lg", isDark ? "bg-white/10" : "bg-slate-200")} />
                        </div>
                    </div>

                    <div className="px-5 space-y-6">
                        {/* Skeleton for Performance Card */}
                        <div className={cn("h-32 rounded-3xl border relative overflow-hidden", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>

                        {/* Skeleton for Filter */}
                        <div className={cn("h-12 rounded-2xl border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")} />

                        {/* Skeleton for Insights */}
                        <div className={cn("h-48 rounded-[32px] border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")} />

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18, duration: 0.35 }}
                            className="space-y-3"
                        >
                            <ShimmerSkeleton className="h-24 w-full rounded-3xl" />
                            <div className="grid grid-cols-2 gap-3">
                                <ShimmerSkeleton className="h-24 rounded-2xl" />
                                <ShimmerSkeleton className="h-24 rounded-2xl" />
                             </div>
                         </motion.div>
                         {/* Quick Actions / Lifestyle Shield */}
                                         <div className="px-5 space-y-4">
                                             <div className={cn(
                                                 "p-6 rounded-[32px] border relative overflow-hidden group",
                                                 isDark ? "bg-[#0B1324] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/40"
                                             )}>
                                                 <div className="flex items-center gap-4 relative z-10">
                                                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                         <Shield className="w-6 h-6" />
                                                     </div>
                                                     <div className="flex-1 min-w-0">
                                                         <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-70 dark:opacity-40 mb-0.5", textColor)}>Professional Protection</p>
                                                         <div className="flex-1 min-w-0">
                                                             <h3 className={cn("text-[17px] font-black tracking-tight", textColor)}>Legal Shield</h3>
                                                             <p className={cn("text-[12px] font-medium opacity-60 leading-tight mt-1", textColor)}>
                                                                 Delayed payout or contract breach? File a legal notice in minutes.
                                                             </p>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div className="flex gap-3 mt-6 relative z-10">
                                                     <button
                                                         onClick={() => { triggerHaptic(); setActiveTab('profile'); setActiveSettingsPage('consumer-complaints'); }}
                                                         className="flex-1 bg-primary text-white font-black italic py-3 rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20"
                                                     >
                                                         File Notice
                                                     </button>
                                                     <button
                                                         onClick={() => {
                                                             triggerHaptic();
                                                             window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20a%20creator%20legal%20dispute`, '_blank');
                                                         }}
                                                         className={cn(
                                                             "px-5 py-3 rounded-xl border flex items-center justify-center transition-all active:scale-95",
                                                             isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                                                         )}
                                                     >
                                                         <MessageSquare className="w-4 h-4 text-emerald-500" />
                                                     </button>
                                                 </div>
                                                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                             </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                 <button
                                                     onClick={() => {
                                                         triggerHaptic();
                                                         window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20a%20legal%20issue`, '_blank');
                                                     }}
                                                     className={cn(
                                                         "p-5 rounded-[2.5rem] border flex flex-col gap-4 text-left group transition-all active:scale-95",
                                                         isDark ? "bg-[#0F172A] border-white/5" : "bg-slate-50 border-slate-200"
                                                     )}
                                                 >
                                                     <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                         <Landmark className="w-5 h-5" />
                                                     </div>
                                                     <div>
                                                         <p className={cn("text-[13px] font-black italic leading-tight mb-1", textColor)}>Contact Lawyer</p>
                                                         <p className={cn("text-[10px] font-bold opacity-60 dark:opacity-30 uppercase tracking-widest", textColor)}>Legal Support</p>
                                                     </div>
                                                 </button>
                                                 <button
                                                     onClick={() => {
                                                         triggerHaptic();
                                                         window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20the%20app`, '_blank');
                                                     }}
                                                     className={cn(
                                                         "p-5 rounded-[2.5rem] border flex flex-col gap-4 text-left group transition-all active:scale-95",
                                                         isDark ? "bg-[#0F172A] border-white/5" : "bg-slate-50 border-slate-200"
                                                     )}
                                                 >
                                                     <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                         <Clock className="w-5 h-5" />
                                                     </div>
                                                     <div>
                                                         <p className={cn("text-[13px] font-black italic leading-tight mb-1", textColor)}>24/7 Response</p>
                                                         <p className={cn("text-[10px] font-bold opacity-60 dark:opacity-30 uppercase tracking-widest", textColor)}>Fast Support</p>
                                                     </div>
                                                 </button>
                                             </div>
                                         </div>
                    </div>
                </>
            )}
        </div>
    );
};

const getCreatorPaymentListUX = (deal: any) => {
    const ux = getCreatorDealCardUX(deal);
    const rawStatus = ux.rawStatus;
    const isPaid = rawStatus.includes('completed') || rawStatus === 'paid' || rawStatus.includes('payment_received');
    const isPaymentReleased = rawStatus.includes('payment_released');
    const isApproved = rawStatus.includes('content_approved');
    const isAwaitingApproval = rawStatus.includes('content_delivered') || rawStatus.includes('revision_done') || rawStatus.includes('draft_review') || rawStatus.includes('content_pending');
    const isContractPending = rawStatus.includes('contract_ready') || rawStatus === 'sent' || rawStatus.includes('needs signature');

    if (isPaid || isPaymentReleased) return { label: 'PROCESSING', sublabel: 'Payment being settled', tone: 'success' as const };

    if (ux.isRevisionRequested) return { label: 'REVISION REQUIRED', sublabel: 'Fix requested by brand', tone: 'warning' as const };

    if (isApproved) return { label: 'APPROVED', sublabel: 'Ready for payout', tone: 'success' as const };

    if (rawStatus.includes('content_delivered') || rawStatus.includes('revision_done')) {
        return { label: 'AWAITING APPROVAL', sublabel: 'Brand is reviewing content', tone: 'warning' as const };
    }

    if (rawStatus.includes('draft_review') || rawStatus.includes('content_pending') || rawStatus.includes('active') || rawStatus.includes('working') || rawStatus.includes('ongoing')) {
        return { label: 'AWAITING CONTENT', sublabel: 'Waiting for your delivery', tone: 'info' as const };
    }

    if (isAwaitingApproval) return { label: 'AWAITING APPROVAL', sublabel: 'Waiting for brand review', tone: 'warning' as const };

    return { label: 'PENDING', sublabel: 'Transaction in progress', tone: 'info' as const };
};

// Animated Number Counter
const AnimatedCounter = ({ value }: { value: number }) => {
    const springValue = useSpring(0, { stiffness: 45, damping: 20 });
    const displayValue = useTransform(springValue, (latest) => Math.floor(latest).toLocaleString());

    useEffect(() => {
        const timeout = setTimeout(() => springValue.set(value), 400);
        return () => clearTimeout(timeout);
    }, [value, springValue]);

    return <motion.span>{displayValue}</motion.span>;
};

// Helper components for iOS-style Settings
const SettingsRow = ({ icon, label, subtext, iconColorClass, hasChevron, isDark, onClick, rightElement, labelClassName }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "flex items-center gap-4 py-4 px-5 active:opacity-60 transition-all cursor-pointer group",
            isDark ? "hover:bg-white/5 active:bg-white/10" : "hover:bg-slate-50 active:bg-slate-100"
        )}
    >
        <div className={cn("w-6 h-6 flex items-center justify-center shrink-0", iconColorClass)}>
            {icon && React.cloneElement(icon, { size: 20, strokeWidth: 1.5 })}
        </div>
        <div className="flex-1 min-w-0">
            <p className={cn("text-[15px] font-bold leading-tight", isDark ? "text-white" : "text-[#111827]", labelClassName)}>{label}</p>
            {subtext && <p className={cn("text-[12px] font-medium leading-tight mt-1 opacity-70", isDark ? "text-white/80" : "text-[#6B7280]")}>{subtext}</p>}
        </div>
        {rightElement}
        {hasChevron && !rightElement && <ChevronRight className={cn("w-5 h-5 opacity-60 dark:opacity-30", isDark ? "text-white" : "text-slate-600")} />}
    </div>
);

const SettingsGroup = ({ children, isDark, className }: any) => (
    <div className={cn(
        "mx-5 overflow-hidden rounded-[2.5rem] border mb-6",
        isDark ? "bg-[#0b1324]/40 border-white/10 divide-white/5 shadow-2xl shadow-black/20" : "bg-white border-slate-100 divide-slate-50 shadow-xl shadow-slate-200/40",
        "divide-y backdrop-blur-xl",
        className
    )}>
        {children}
    </div>
);

const SectionHeader = ({ title, isDark }: any) => (
    <p className={cn(
        "px-6 mb-3 mt-8 text-[11px] font-black uppercase tracking-[0.25em] opacity-80",
        isDark ? "text-white/30" : "text-slate-600"
    )}>
        {title}
    </p>
);

const ToggleSwitch = ({ active, onToggle, isDark }: any) => (
    <button type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
            "w-[44px] h-[26px] rounded-full relative transition-all duration-300 ease-in-out px-1 flex items-center shadow-inner",
            active ? (isDark ? "bg-primary" : "bg-primary") : (isDark ? "bg-white/10" : "bg-slate-200")
        )}
    >
        <motion.div
const BottomNavigationBar = React.memo(({
    activeTab,
    effectiveTab,
    isDark,
    secondaryTextColor,
    pendingOffersCount,
    triggerHaptic,
    setActiveTab,
    scrollRef,
    scrollPositionsRef,
    isOverlayOpen
}: BottomNavigationProps) => {
    return (
        <div
            className={cn(
                'fixed bottom-0 inset-x-0 border-t z-[1100] transition-all duration-500',
                isDark ? 'border-white/10 bg-[#0B0F14]' : 'border-slate-200 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.04)]',
                isOverlayOpen && 'pointer-events-none'
            )}
            style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 6px)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)'
            }}
        >
            <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 pt-2 gap-1 relative">
                {/* Active Tab Background Indicator (Sliding) */}
                <div className="absolute inset-x-6 top-2 h-[54px] pointer-events-none">
                    <motion.div
                        animate={{
                            left: effectiveTab === 'dashboard' ? '0%'
                                : effectiveTab === 'deals' ? '20%'
                                : effectiveTab === 'analytics' ? '40%'
                                : effectiveTab === 'payments' ? '60%'
                                : '80%'
                        }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        className={cn(
                            "absolute h-full rounded-2xl border transition-colors",
                            isDark ? "bg-white/5 border-white/10" : "bg-white shadow-sm border-[#E5E7EB]"
                        )}
                        style={{
                            width: 'calc(20% - 4px)', // 5 tabs (Home, Deals, Stats, Pay, Me)
                        }}
                    />
                </div>

                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                        if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop;
                        triggerHaptic(HapticPatterns.light);
                        setActiveTab('dashboard');
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                        activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-400' : secondaryTextColor)
                    )}
                >
                    <LayoutDashboard className="w-[22px] h-[22px]" strokeWidth={effectiveTab === 'dashboard' ? 2.5 : 2} />
                    <span className={cn('text-[10px] tracking-tight font-black uppercase', effectiveTab === 'dashboard' ? 'opacity-40 dark:opacity-100' : (isDark ? 'opacity-70' : 'opacity-40 dark:opacity-100'))}>Home</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                        if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop;
                        triggerHaptic(HapticPatterns.light);
                        setActiveTab('deals');
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                        activeTab === 'deals' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-400' : secondaryTextColor)
                    )}
                >
                    <div className="relative">
                        <Briefcase className="w-[22px] h-[22px]" strokeWidth={effectiveTab === 'deals' ? 2.5 : 2} />
                        {pendingOffersCount > 0 && (
                            <span className={cn(
                                "absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 text-[9px] font-black flex items-center justify-center text-white bg-destructive animate-in zoom-in duration-300",
                                isDark ? "border-[#0B0F14]" : "border-white"
                            )}>
                                {pendingOffersCount}
                            </span>
                        )}
                    </div>
                    <span className={cn('text-[10px] tracking-tight font-black uppercase', effectiveTab === 'deals' ? 'opacity-40 dark:opacity-100' : (isDark ? 'opacity-70' : 'opacity-40 dark:opacity-100'))}>Deals</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                        if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop;
                        triggerHaptic(HapticPatterns.light);
                        setActiveTab('analytics');
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                        activeTab === 'analytics' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-400' : secondaryTextColor)
                    )}
                >
                    <TrendingUp className="w-[22px] h-[22px]" strokeWidth={effectiveTab === 'analytics' ? 2.5 : 2} />
                    <span className={cn('text-[10px] tracking-tight font-black uppercase', effectiveTab === 'analytics' ? 'opacity-40 dark:opacity-100' : (isDark ? 'opacity-70' : 'opacity-40 dark:opacity-100'))}>Stats</span>
                </motion.button>


                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                        if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop;
                        triggerHaptic(HapticPatterns.light);
                        setActiveTab('payments');
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                        activeTab === 'payments' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-400' : secondaryTextColor)
                    )}
                >
                    <CreditCard className="w-[22px] h-[22px]" strokeWidth={effectiveTab === 'payments' ? 2.5 : 2} />
                    <span className={cn('text-[10px] tracking-tight font-black uppercase', effectiveTab === 'payments' ? 'opacity-40 dark:opacity-100' : (isDark ? 'opacity-70' : 'opacity-40 dark:opacity-100'))}>Pay</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                        if (scrollRef.current) scrollPositionsRef.current[activeTab] = scrollRef.current.scrollTop;
                        triggerHaptic(HapticPatterns.light);
                        setActiveTab('profile');
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 h-[54px] z-10 transition-colors",
                        activeTab === 'profile' ? (isDark ? 'text-white' : 'text-primary') : (isDark ? 'text-slate-400' : secondaryTextColor)
                    )}
                >
                    <User className="w-[22px] h-[22px]" strokeWidth={effectiveTab === 'profile' ? 2.5 : 2} />
                    <span className={cn('text-[10px] tracking-tight font-black uppercase', effectiveTab === 'profile' ? 'opacity-40 dark:opacity-100' : (isDark ? 'opacity-70' : 'opacity-40 dark:opacity-100'))}>Me</span>
                </motion.button>
            </div>
        </div>
    );
});
