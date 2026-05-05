const DashboardTab = React.memo(({
    isDark, textColor, secondaryTextColor, isLoadingDeals,
    activeDealsCount, activeDealsList = [], completedDealsCount, monthlyRevenue, totalEarnings,
    availableAmount, inEscrowAmount, processingAmount, pendingAmount,
    pendingOffersCount, pendingOffersDeduplicated, displayName, username,
    avatarUrl, avatarFallbackUrl, shouldShowPushPrompt,
    isPushSubscribed, triggerHaptic, setActiveTab, setActiveSettingsPage,
    setCollabSubTab, navigate, resolveCreatorDealProductImage, getBrandIcon,
    counterOfferCount, profile,
    TrendingUp, ArrowRight, ArrowUpRight, Clock, ChevronRight, User, DollarSign, Zap,
    setSelectedItem, setSelectedType, setShowShareSheet, handleCopyStorefront,
    Instagram, Copy, Eye, MessageCircleMore, handleAccept, onDeclineRequest,
    analyticsSummary, analyticsLoading
}: any) => {
    const hasDeals = activeDealsCount > 0 || completedDealsCount > 0;
    const storefrontUrl = `creatorarmour.com/${username}`;

    const handleWhatsAppShare = () => {
        triggerHaptic();
        const text = `Check out my creator profile on Creator Armour: ${storefrontUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        trackEvent('collab_link_shared', { method: 'whatsapp' });
    };

    const handleInstagramShare = () => {
        triggerHaptic();
        handleCopyStorefront();
        toast.success("Link copied! Paste it in your Instagram Bio settings.", {
            duration: 4000,
            icon: '📸'
        });
        trackEvent('collab_link_shared', { method: 'instagram' });
    };

    const handleNativeShare = async () => {
        triggerHaptic();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Creator Profile',
                    text: 'Check out my work and collaborate with me on Creator Armour!',
                    url: `https://${storefrontUrl}`
                });
                trackEvent('collab_link_shared', { method: 'native' });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    handleCopyStorefront();
                }
            }
        } else {
            handleCopyStorefront();
        }
    };

    // Get the most recent active deal for the hero tracker
    const featuredDeal = activeDealsList[0];

    const getDealProgress = (deal: any) => {
        if (!deal) return { step: 0, label: 'Inactive' };
        const status = getCanonicalDealStatus(deal);
        const shippingStatus = String(deal?.shipping_status || deal?.raw?.shipping_status || '').toLowerCase();

        // Step 1: Agreement (Signed but waiting for next steps)
        if (status === 'SENT' || status === 'FULLY_EXECUTED') return { step: 1, label: 'Agreement' };

        // Step 2: Shipment (For barter/shipping deals)
        const requiresShipping = isBarterLikeCollab(deal);
        if (requiresShipping && (status === 'AWAITING_BRAND_ADDRESS' || (status === 'CONTENT_MAKING' && shippingStatus !== 'received' && shippingStatus !== 'delivered'))) {
            return { step: 2, label: 'Shipment' };
        }

        // Step 3: Content (Making or Delivered)
        if (status === 'CONTENT_MAKING' || status === 'CONTENT_DELIVERED' || status === 'REVISION_REQUESTED') {
            return { step: 3, label: 'Content' };
        }

        // Step 4: Payment (Completed)
        if (status === 'COMPLETED') return { step: 4, label: 'Payment' };

        return { step: 1, label: 'Agreement' }; // Fallback
    };

    const progress = getDealProgress(featuredDeal);

    if (isLoadingDeals) {
        return (
            <DashboardLoadingStage 
                isDark={isDark} 
                tab="dashboard" 
                triggerHaptic={triggerHaptic}
                setActiveTab={setActiveTab}
                setActiveSettingsPage={setActiveSettingsPage}
                userId={profile?.id}
            />
        );
    }

    return (
        <div className="space-y-6 pb-32 pt-6">

            {/* 2. Hero Section (Ultra Premium) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-5"
            >
                <div className="relative h-[220px] rounded-[2.5rem] bg-slate-950 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-950" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px] -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[60px] -ml-10 -mb-10" />

                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                        <div>
                            <p className="text-emerald-300/80 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Welcome Back</p>
                            <h1 className="text-white text-[28px] font-black tracking-tighter leading-tight">
                                Hey {displayName || 'Creator'}, <br />
                                <span className="text-emerald-400">Scale your influence.</span>
                            </h1>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { triggerHaptic(); setActiveTab('deals'); }}
                                className="h-12 px-6 rounded-2xl bg-white text-slate-950 font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                            >
                                Find Deals
                            </button>
                            <button
                                onClick={() => { triggerHaptic(); setActiveTab('analytics'); }}
                                className="h-12 px-6 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-[11px] uppercase tracking-widest backdrop-blur-md active:scale-95 transition-all"
                            >
                                View Stats
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-5"
            >
                <div className={cn(
                    "rounded-[2.5rem] border overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.04)]",
                    isDark ? "bg-[#0B1324] border-white/5" : "bg-gradient-to-b from-white to-[#F0FDF4] border-slate-200"
                )}>
                    <div className="p-7 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <IndianRupee className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Earnings</span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                Lifetime
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className={cn("text-4xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                ₹{totalEarnings.toLocaleString('en-IN')}
                            </h2>
                            <p className="text-[12px] font-medium text-slate-500">Total lifetime earnings</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '65%' }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Available</p>
                                <p className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>₹{availableAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Processing</p>
                                <p className={cn("text-lg font-black", isDark ? "text-blue-500" : "text-blue-600")}>₹{processingAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">In Escrow</p>
                                <p className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>₹{inEscrowAmount.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        <div className={cn(
                            "grid grid-cols-2 gap-2 rounded-2xl border p-3 text-[10px] font-bold",
                            isDark ? "border-white/10 bg-white/[0.03] text-white/60" : "border-emerald-100 bg-white/70 text-slate-500"
                        )}>
                            <div>
                                <p className="font-black uppercase tracking-widest text-slate-400">Payout</p>
                                <p className={cn("mt-0.5", isDark ? "text-white/80" : "text-slate-800")}>Bank / UPI linked</p>
                            </div>
                            <div>
                                <p className="font-black uppercase tracking-widest text-slate-400">India tax</p>
                                <p className={cn("mt-0.5", isDark ? "text-white/80" : "text-slate-800")}>TDS/GST shown on invoice</p>
                            </div>
                        </div>

                        <button
                            onClick={() => { 
                                triggerHaptic(); 
                                if (availableAmount > 0) {
                                    toast.success('Withdrawal request initiated!'); 
                                } else {
                                    toast.info("No funds available to withdraw yet. Complete deals to earn!");
                                }
                            }}
                            className="w-full h-14 rounded-[1.2rem] bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 active:scale-[0.96] transition-all"
                        >
                            Withdraw Now
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Active Deal Hero Tracker (Redesigned Timeline UI) */}
            {activeDealsCount > 0 && featuredDeal ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="px-5"
                >
                    <div className={cn(
                        "p-7 rounded-[2.5rem] border overflow-hidden transition-all duration-500",
                        isDark
                            ? "bg-[#0B1324] border-white/5 shadow-2xl"
                            : "bg-white border-slate-200 shadow-[0_15px_40px_rgba(0,0,0,0.04)]"
                    )}
                    onClick={() => { triggerHaptic(); setSelectedItem(featuredDeal); setSelectedType('deal'); }}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={cn("text-[14px] font-black uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>Active Deal</h3>
                                    <p className="text-[11px] font-medium text-slate-500">{featuredDeal.brand_name || 'Brand Partner'}</p>
                                </div>
                            </div>
                            <div className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>
                                {renderBudgetValue(featuredDeal)}
                            </div>
                        </div>

                        {/* Timeline UI */}
                        <div className="relative flex justify-between items-start mb-8">
                            <div className="absolute top-[15px] left-0 right-0 h-[2px] bg-slate-100 z-0 mx-8">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, ((progress.step - 1) / 3) * 100)}%` }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>

                            {[
                                { id: 1, label: 'Agreement' },
                                { id: 2, label: 'Shipping' },
                                { id: 3, label: 'Content' },
                                { id: 4, label: 'Payment' }
                            ].map((step) => {
                                const isActive = progress.step === step.id;
                                const isCompleted = progress.step > step.id;
                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 w-16">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-white",
                                            isCompleted
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : isActive
                                                    ? "border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,163,74,0.3)]"
                                                    : "border-slate-200 text-slate-300"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-bold">{step.id}</span>}
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest text-center",
                                            isActive ? "text-emerald-600" : isCompleted ? "text-slate-900" : "text-slate-400"
                                        )}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={cn(
                            "p-4 rounded-2xl flex items-center justify-between",
                            isDark ? "bg-white/5" : "bg-slate-50"
                        )}>
                            <p className="text-[11px] font-medium text-slate-600">
                                {progress.step === 1 && "Waiting for agreement signature"}
                                {progress.step === 2 && "Waiting for brand to ship product"}
                                {progress.step === 3 && "Submit your content for review"}
                                {progress.step === 4 && "Final payment being processed"}
                            </p>
                            <div className="flex gap-2">
                                <button className="h-9 px-4 rounded-xl bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm active:scale-95 transition-all">
                                    Message
                                </button>
                                <button className="h-9 px-4 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all">
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-5"
                >
                    <div className="p-10 rounded-[2.5rem] border border-dashed border-slate-300 bg-white text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                            <Rocket className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">🚀 No active deals yet</h3>
                            <p className="text-sm text-slate-500">We’ll help you get your first brand deal</p>
                        </div>
                        <button
                            onClick={() => { triggerHaptic(); setActiveTab('collabs'); }}
                            className="h-12 px-8 rounded-2xl bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                            Get Matched Now
                        </button>
                    </div>
                </motion.div>
            )}

            {/* 5. Share Link (Growth Engine Redesigned) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-5"
            >
                <div className={cn(
                    "p-7 rounded-[2.5rem] border transition-all duration-500",
                    isDark ? "bg-[#0B1324] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-[0_15px_40px_rgba(0,0,0,0.04)]"
                )}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <h3 className={cn("text-[14px] font-black uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>Get More Deals</h3>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md tracking-tight">+12 creators got deals today</span>
                    </div>

                    <div className="relative mb-6">
                        <div className="h-14 w-full bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 text-[13px] font-medium text-slate-500 truncate">
                            creatorarmour.com/{username || displayName}
                        </div>
                        <button
                            onClick={handleCopyStorefront}
                            className="absolute right-2 top-2 h-10 px-4 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Copy Link
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button 
                            onClick={handleWhatsAppShare}
                            className="h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                        </button>
                        <button 
                            onClick={handleInstagramShare}
                            className="h-12 rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Instagram</span>
                        </button>
                        <button 
                            onClick={handleNativeShare}
                            className="h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                        </button>
                    </div>

                    <div className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border border-dashed",
                        isDark ? "bg-white/5 border-white/10" : "bg-emerald-50/50 border-emerald-100"
                    )}>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <p className={cn("text-[11px] font-medium leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>
                            <span className="font-bold text-emerald-600">Pro Tip:</span> Add this to your <span className="font-bold">Instagram Bio</span> to attract 3x more brand deals.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* 6. Link Visits Widget (Redesigned) */}
            {(analyticsSummary?.weeklyViews || 0) > 0 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="px-5">
                    <div className={cn(
                        "p-8 rounded-[3rem] border-0 relative overflow-hidden group transition-all duration-700",
                        isDark
                          ? "bg-gradient-to-br from-[#0B1324] via-[#0B1324] to-[#020617] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                          : "bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border-slate-100"
                    )}>
                        <div className={cn(
                            "absolute top-0 right-0 w-[200px] h-[200px] blur-[100px] pointer-events-none opacity-30 transition-opacity duration-700 group-hover:opacity-50",
                            isDark ? "bg-blue-500/20" : "bg-blue-500/10"
                        )} />

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-2xl backdrop-blur-2xl border",
                                    isDark ? "bg-white/5 border-white/10 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-500"
                                )}>
                                    <Eye className="w-7 h-7" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.25em] opacity-50", textColor)}>Analytics</p>
                                        <div className="h-[1px] w-4 bg-blue-500/30" />
                                    </div>
                                    <h3 className={cn("text-[22px] font-black tracking-tighter italic uppercase leading-none", textColor)}>Link Visits</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[36px] font-black italic tracking-tighter text-blue-500 leading-none mb-1 drop-shadow-sm">
                                    {analyticsSummary?.weeklyViews}
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40">THIS WEEK</p>
                            </div>
                        </div>
                        <p className={cn("text-[14px] font-medium opacity-60 leading-relaxed mt-6 relative z-10 max-w-[90%]", textColor)}>
                            Your profile is gaining traction! {analyticsSummary?.weeklyViews === 1 ? 'A brand' : 'Brands'} checked out your work recently.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
});

const AnalyticsTab = React.memo(({
    isDark, textColor, secondaryTextColor, isLoadingDeals, brandDeals,
    activeDealsCount, creatorActivities, creatorMilestones, creatorNotifications,
    creatorAchievements,
    setSearchQuery, setDealFilters,
    setActiveTab, handleAction, avatarUrl, avatarFallbackUrl,
    DashboardLoadingStage, DashboardMetricsCards, DealSearchFilter,
    AchievementBadges,
    DealTimelineView, SmartNotificationsCenter,
    analyticsSummary, analyticsLoading,
    Menu, ShieldCheck,
    triggerHaptic, setActiveSettingsPage, profile
}: any) => {
    const linkViews = Number(analyticsSummary?.totalViews || 0);
    const weeklyViews = Number(analyticsSummary?.weeklyViews || 0);
    const submissions = Number(analyticsSummary?.submissions || 0);
    const conversionRate = linkViews > 0 ? Math.round((submissions / linkViews) * 100) : 0;

    return (
        <>
        <div className="px-5 pb-6 pt-8">

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h1 className={cn('text-[22px] font-black tracking-tight font-outfit', textColor)}>Analytics</h1>
                    <p className={cn('text-[14px] mt-1', secondaryTextColor)}>
                        Performance, deal insights, payments, and activity are all here now.
                    </p>
                </motion.div>
            </div>

            <div className="px-5 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                >
                    <h3 className={cn('text-sm font-bold tracking-tight mb-3', textColor)}>Your Performance</h3>
                </motion.div>
                {isLoadingDeals ? (
                    <DashboardLoadingStage 
                        isDark={isDark} 
                        triggerHaptic={triggerHaptic}
                        setActiveTab={setActiveTab}
                        setActiveSettingsPage={setActiveSettingsPage}
                        userId={profile?.id}
                    />
                ) : (
                    <DashboardMetricsCards
                        totalDealValue={brandDeals?.reduce((sum: number, deal: any) => sum + (deal.deal_amount || 0), 0) || 0}
                        activeDealCount={activeDealsCount}
                        outstandingPayments={brandDeals?.filter((d: any) => {
                            const s = (d.status || '').toLowerCase();
                            return s.includes('payment_pending') || s.includes('payment_awaiting');
                        }).reduce((sum: number, deal: any) => sum + (deal.deal_amount || 0), 0) || 0}
                        avgDealDuration={brandDeals?.length > 0 ? Math.round(brandDeals.reduce((sum: number, d: any) => sum + (d.duration || 14), 0) / brandDeals.length) : 14}
                        isDark={isDark}
                    />
                )}
            </div>

            <div className="px-5 mb-8">
                <div className={cn(
                    "rounded-[2rem] border p-5",
                    isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200 shadow-sm"
                )}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className={cn("text-sm font-black tracking-tight", textColor)}>Collab Link Funnel</h3>
                            <p className={cn("text-[11px] font-bold mt-0.5", secondaryTextColor)}>Brand visits and request conversion</p>
                        </div>
                        {analyticsLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: "7d views", value: weeklyViews.toLocaleString('en-IN') },
                            { label: "Total views", value: linkViews.toLocaleString('en-IN') },
                            { label: "Requests", value: submissions.toLocaleString('en-IN') },
                        ].map((metric) => (
                            <div key={metric.label} className={cn("rounded-2xl border p-3", isDark ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-100")}>
                                <p className={cn("text-[9px] font-black uppercase tracking-widest", secondaryTextColor)}>{metric.label}</p>
                                <p className={cn("text-lg font-black mt-1", textColor)}>{metric.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className={cn("mt-3 rounded-2xl px-4 py-3 text-[12px] font-bold", isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                        {linkViews > 0
                            ? `${conversionRate}% of link visits became brand requests.`
                            : "Share your collab link on Instagram or WhatsApp to start tracking brand interest."}
                    </div>
                </div>
            </div>

            <div className="px-5 mb-8">
                <DealSearchFilter
                    onSearch={(query: string) => setSearchQuery(query)}
                    onFilterChange={(filters: any) => setDealFilters(filters)}
                    isDark={isDark}
                    totalDeals={brandDeals?.length || 0}
                />
            </div>

            <div className="px-5 mb-8">
                <EnhancedInsights isDark={isDark} brandDeals={brandDeals} />
            </div>

            <div className="px-5 mb-8">
                <ActivityFeed activities={creatorActivities} isDark={isDark} maxItems={4} />
            </div>

            <div className="px-5 mb-8">
                <PaymentTimeline milestones={creatorMilestones} isDark={isDark} maxItems={5} />
            </div>

            <div className="px-5 mb-8">
                <AchievementBadges achievements={creatorAchievements} isDark={isDark} showUnlocked={true} />
            </div>


            <div className="px-5 mb-8">
                <DealTimelineView isDark={isDark} />
            </div>

            <div className="px-5 mb-8">
                <SmartNotificationsCenter notifications={creatorNotifications} isDark={isDark} />
            </div>
        </>
    );
});


const DealsTab = React.memo(({
    isDark, textColor, collabSubTab,
    setCollabSubTab, searchParams, setSearchParams, triggerHaptic,
    activeDealsCount, activeDealsList, completedDealsCount,
    completedDealsList, pendingOffersDeduplicated, getCreatorDealCardUX,
    resolveCreatorDealProductImage, getBrandIcon, setSelectedItem,
    setSelectedType, navigate, handleCopyStorefront, dealsError, onRefresh,
    pendingOffersCount, safeJsonParse, inferCreatorRequiresPayment,
    safeParseArray, ChevronRight, Clock, CreditCard, AlertCircle, Zap,
    CheckCircle2, Camera, handleAccept, onDeclineRequest
}: any) => {
    return (
        <div className={cn("px-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20", isDark ? "" : "bg-slate-50")} style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}>
            <div className="pt-2 mb-6">
                <div className={cn("p-1.5 rounded-[22px] border flex gap-1.5 backdrop-blur-xl", isDark ? "bg-secondary/[0.06] border-border/50" : "bg-slate-100/80 border-slate-200/60")}>
                    {(['pending', 'active', 'completed'] as const).map((tab) => (
                        <button key={tab} type="button"
                            onClick={() => {
                                triggerHaptic();
                                setCollabSubTab(tab);
                                const next = new URLSearchParams(searchParams);
                                next.set('tab', 'deals');
                                next.set('subtab', tab);
                                next.delete('requestId');
                                setSearchParams(next, { replace: true });
                            }}
                            className={cn(
                                "flex-1 h-11 rounded-[18px] px-3 transition-all flex items-center justify-center",
                                collabSubTab === tab
                                    ? isDark ? 'bg-card text-foreground shadow-lg' : 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-700'
                            )}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab === 'pending' ? 'Offers' : tab}</span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {collabSubTab === 'active' ? (
                    <motion.div key="active" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <h2 className={cn("text-[20px] font-bold tracking-tight mb-4", textColor)}>Active Deals</h2>
                        {activeDealsCount > 0 ? (
                            <div className="space-y-4">
                                {activeDealsList.map((deal: any, idx: number) => {
                                    const productImage = resolveCreatorDealProductImage(deal);
                                    const isBarter = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').toLowerCase().includes('barter');
                                    const budget = Number(deal?.deal_amount || deal?.budget_amount || deal?.exact_budget || deal?.product_value || 0);
                                    const ux = getCreatorDealCardUX(deal);

                                    return (
                                        <motion.div
                                            key={deal.id || idx}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => { triggerHaptic(); setSelectedItem(deal); setSelectedType('deal'); }}
                                            className={cn(
                                                "relative w-full aspect-[1.1/1] rounded-[3rem] overflow-hidden bg-[#0B1220] border border-white/5 shadow-2xl mb-8 group"
                                            )}
                                        >
                                             <div className="absolute inset-0">
                                                 {productImage && (
                                                     <motion.img
                                                         initial={{ scale: 1.1 }}
                                                         animate={{ scale: 1 }}
                                                         transition={{ duration: 1.2, ease: "easeOut" }}
                                                         src={productImage}
                                                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                         onError={(e) => {
                                                             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500';
                                                         }}
                                                     />
                                                 )}
                                                 {/* Surgical Scrim for Readability */}
                                                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0" />
                                                 <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                             </div>

                                             <div className="relative h-full p-6 flex flex-col justify-between z-10">
                                                 <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-2">
                                                         <div className={cn(
                                                             "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-lg backdrop-blur-xl border border-white/10",
                                                             ux.stagePill.includes('COMPLETED') || ux.stagePill.includes('DONE') || ux.stagePill.includes('APPROVED')
                                                                 ? "bg-emerald-500/80 text-white"
                                                                 : ux.stagePill.includes('REVISION') || ux.stagePill.includes('NOTICE')
                                                                     ? "bg-rose-500/80 text-white"
                                                                     : "bg-white/10 text-white"
                                                         )}>
                                                             {ux.stagePill}
                                                         </div>
                                                         {!isBarter && (
                                                             <div className="px-3 py-1.5 rounded-full bg-blue-600/80 text-white shadow-lg text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur-xl border border-white/10">
                                                                 Escrow Active
                                                             </div>
                                                         )}
                                                     </div>
                                                     <div className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 group-hover:text-white transition-colors">
                                                         <ChevronRight className="w-5 h-5" />
                                                     </div>
                                                 </div>

                                                 <div className="space-y-4">
                                                     <div>
                                                         <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                                             <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                                                                 <Briefcase className="w-2.5 h-2.5 text-white" />
                                                             </div>
                                                             <p className="text-[10px] font-black uppercase tracking-widest text-white">{deal.brand_name || 'Brand Partner'}</p>
                                                         </div>
                                                         <h2 className="text-2xl font-black italic uppercase text-white leading-tight drop-shadow-xl mb-1 group-hover:translate-x-1 transition-transform duration-500">
                                                            {isBarter ? 'Product Collab' : renderBudgetValue(deal)}
                                                         </h2>
                                                         <div className="flex items-center gap-3">
                                                            {isBarter && (
                                                                <p className="text-[11px] font-bold text-white/70">
                                                                    Est. Value {renderBudgetValue(deal)}
                                                                </p>
                                                            )}
                                                            {(() => {
                                                                const pkgLabel = resolveItemPackageLabel(deal);
                                                                if (!pkgLabel) return null;
                                                                return (
                                                                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/90 text-[9px] font-black uppercase tracking-wider border border-white/5">{pkgLabel}</span>
                                                                );
                                                            })()}
                                                         </div>
                                                     </div>

                                                     <div className="space-y-2">
                                                         <div className="flex justify-between items-end">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Production Progress</p>
                                                            <p className="text-[10px] font-black text-white/80">{Math.round((ux.progressStep / 7) * 100)}%</p>
                                                         </div>
                                                         <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                                             <motion.div
                                                                 initial={{ width: 0 }}
                                                                 animate={{ width: `${(ux.progressStep / 7) * 100}%` }}
                                                                 transition={{ duration: 1.5, ease: "circOut" }}
                                                                 className={cn(
                                                                     "h-full transition-all duration-1000 relative",
                                                                     isBarter ? "bg-amber-400" : "bg-emerald-400"
                                                                 )}
                                                             >
                                                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                                             </motion.div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : <div className="p-10 text-center opacity-70 dark:opacity-40">No active deals</div>}
                    </motion.div>
                ) : collabSubTab === 'completed' ? (
                    <motion.div key="completed" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                         <h2 className={cn("text-[20px] font-bold tracking-tight mb-4", textColor)}>Completed</h2>
                         {completedDealsCount > 0 ? (
                             <div className="space-y-4">
                                {completedDealsList.map((deal: any, idx: number) => {
                                    const productImage = resolveCreatorDealProductImage(deal);
                                    const isBarter = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').toLowerCase().includes('barter');
                                    return (
                                        <motion.div key={deal.id || idx} whileTap={{ scale: 0.98 }} onClick={() => { triggerHaptic(); setSelectedItem(deal); setSelectedType('deal'); }} className={cn("relative w-full aspect-[1.2/1] rounded-[2.5rem] overflow-hidden bg-[#0B1220] border-0 shadow-2xl mb-6")}>
                                            <div className="absolute inset-0">
                                                {productImage && (
                                                    <img
                                                        src={productImage}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500';
                                                        }}
                                                    />
                                                )}
                                                {/* Bottom Scrim for Readability - Surgical approach (doesn't darken the whole photo) */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                                            </div>
                                            <div className="relative h-full p-5 flex flex-col justify-between z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2.5 py-1.5 rounded-full bg-slate-500 self-start text-[11px] font-black text-white uppercase tracking-widest shadow-sm drop-shadow-md">Completed</div>
                                                    {!isBarter && (
                                                        <div className="px-2.5 py-1.5 rounded-full bg-blue-500 text-white shadow-sm text-[11px] font-black uppercase tracking-widest drop-shadow-md">
                                                            Paid
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="mb-3">
                                                        <h2 className="text-xl font-black italic uppercase text-white truncate mb-0.5">{deal.brand_name || 'Partner'}</h2>
                                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                                            <p className={cn("text-lg font-black leading-none", isBarter ? "text-white" : "text-white")}>
                                                                {isBarter ? 'Free product' : renderBudgetValue(deal)}
                                                            </p>
                                                            {isBarter && <span className="text-[10px] font-black uppercase tracking-widest text-white/80">est. value {renderBudgetValue(deal)}</span>}
                                                        </div>
                                                        {(() => {
                                                            const pkgLabel = resolveItemPackageLabel(deal);
                                                            if (!pkgLabel) return null;
                                                            return (
                                                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                                    <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white text-[10px] font-black border border-white/10 shadow-sm">{pkgLabel}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="h-1 w-full bg-emerald-500/30 rounded-full overflow-hidden"><div className={cn("h-full w-full", isBarter ? "bg-amber-400" : "bg-emerald-400")} /></div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                             </div>
                         ) : <div className="p-10 text-center opacity-70 dark:opacity-40">No completed deals</div>}
                    </motion.div>
                ) : (
                    <motion.div key="pending" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <h2 className={cn("text-[20px] font-bold tracking-tight mb-4", textColor)}>Offers</h2>
                        {pendingOffersCount > 0 ? (
                            <div className="space-y-4">
                                {pendingOffersDeduplicated.map((req: any, idx: number) => {
	                                    const productImage = resolveCreatorDealProductImage(req);
	                                    const isBarter = String(req?.collab_type || req?.deal_type || req?.raw?.collab_type || '').toLowerCase().includes('barter');
	                                    const packageLabel = getOfferPackageLabel(req);
	                                    const requirementsList = getOfferRequirements(req);
	                                    const addonsList = getOfferAddons(req);
	                                    const contentQuantity = req?.content_quantity || req?.form_data?.content_quantity || req?.raw?.content_quantity || req?.raw?.form_data?.content_quantity;
	                                    const contentDuration = req?.content_duration || req?.form_data?.content_duration || req?.raw?.content_duration || req?.raw?.form_data?.content_duration;
                                        const offerPlatform = String(req?.platform || req?.raw?.platform || req?.form_data?.platform || '').trim();
                                        const rawDeadline = req?.deadline || req?.due_date || req?.raw?.deadline || req?.raw?.due_date;
                                        let deadlineLabel = '';
                                        if (rawDeadline) {
                                            try {
                                                const d = new Date(rawDeadline);
                                                if (!isNaN(d.getTime())) {
                                                    deadlineLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                                }
                                            } catch (e) {
                                                console.error('Invalid deadline date:', rawDeadline);
                                            }
                                        }
                                        const usageLabel = req?.usage_rights === true || req?.raw?.usage_rights === true ? 'Usage rights' : '';
                                        const paymentTermsLabel = String(req?.payment_terms || req?.raw?.payment_terms || '').trim();
	                                    return (
                                        <motion.div key={req.id || idx} whileTap={{ scale: 0.98 }} onClick={() => { triggerHaptic(); setSelectedItem(req); setSelectedType('offer'); }} className={cn("relative w-full aspect-[1.2/1] rounded-[2.5rem] overflow-hidden bg-[#0B1220] border-0 shadow-2xl mb-6")}>
                                            <div className="absolute inset-0">
                                                {productImage && (
                                                    <img
                                                        src={productImage}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500';
                                                        }}
                                                    />
                                                )}
                                                {/* Bottom Scrim for Readability - Surgical approach (doesn't darken the whole photo) */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                                            </div>
                                            <div className="relative h-full p-5 flex flex-col justify-between z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2.5 py-1.5 rounded-full bg-violet-600 self-start text-[11px] font-black text-white uppercase tracking-widest shadow-sm drop-shadow-md">New Offer</div>
                                                    {!isBarter && (
                                                        <div className="px-2.5 py-1.5 rounded-full bg-blue-500 text-white shadow-sm text-[11px] font-black uppercase tracking-widest drop-shadow-md">
                                                            Paid
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto">
                                                    <div className="mb-4">
                                                        <h2 className="text-xl font-black italic uppercase text-white truncate mb-0.5 drop-shadow-xl">{req.brand_name || 'Brand Partner'}</h2>
                                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                                            <p className={cn("text-lg font-black leading-none text-white drop-shadow-lg")}>
                                                                {isBarter ? 'Free product' : renderBudgetValue(req)}
                                                            </p>
	                                                            {isBarter && <span className="text-[10px] font-black uppercase tracking-widest text-white/90 drop-shadow-md">est. value {renderBudgetValue(req)}</span>}
	                                                        </div>
	                                                        {(packageLabel || contentQuantity || contentDuration || offerPlatform || deadlineLabel || usageLabel || paymentTermsLabel || requirementsList.length > 0 || addonsList.length > 0) && (
	                                                            <div className="mt-3 flex flex-wrap gap-1.5">
	                                                                {packageLabel && <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white text-[10px] font-black border border-white/10 shadow-sm">{packageLabel}</span>}
	                                                                {contentQuantity && <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white/90 text-[10px] font-black border border-white/10 shadow-sm">Qty {contentQuantity}</span>}
	                                                                {contentDuration && <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white/90 text-[10px] font-black border border-white/10 shadow-sm">{contentDuration}</span>}
                                                                    {offerPlatform && <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white/90 text-[10px] font-black border border-white/10 shadow-sm">{offerPlatform}</span>}
                                                                    {deadlineLabel && <span className="px-2.5 py-1 rounded-lg bg-amber-500/30 backdrop-blur-md text-white text-[10px] font-black border border-amber-400/30 shadow-sm">Due {deadlineLabel}</span>}
                                                                    {paymentTermsLabel && <span className="px-2.5 py-1 rounded-lg bg-blue-500/30 backdrop-blur-md text-white text-[10px] font-black border border-blue-400/30 shadow-sm">{paymentTermsLabel}</span>}
                                                                    {usageLabel && <span className="px-2.5 py-1 rounded-lg bg-fuchsia-500/30 backdrop-blur-md text-white text-[10px] font-black border border-fuchsia-400/30 shadow-sm">{usageLabel}</span>}
	                                                                {requirementsList.slice(0, 2).map((label) => (
	                                                                    <span key={label} className="px-2.5 py-1 rounded-lg bg-emerald-500/30 backdrop-blur-md text-white text-[10px] font-black border border-emerald-400/30 shadow-sm">{label}</span>
	                                                                ))}
	                                                                {addonsList.slice(0, 1).map((label) => (
	                                                                    <span key={label} className="px-2.5 py-1 rounded-lg bg-sky-500/30 backdrop-blur-md text-white text-[10px] font-black border border-sky-400/30 shadow-sm">{label}</span>
	                                                                ))}
	                                                            </div>
	                                                        )}
	                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAccept(req);
                                                            }}
                                                            className={cn(
                                                                "flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl backdrop-blur-md",
                                                                isBarter ? "bg-amber-500 text-white border border-amber-400/30" : "bg-white text-black border border-white/20"
                                                            )}
                                                        >
                                                            {isBarter ? 'Claim Product' : 'Accept'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                triggerHaptic();
                                                                if (onDeclineRequest) onDeclineRequest(req.id);
                                                            }}
                                                            className="flex-1 h-11 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center active:scale-95 transition-all shadow-lg"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                             </div>
                        ) : <div className="p-10 text-center opacity-70 dark:opacity-40">No pending offers</div>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default MobileDashboardDemo;
