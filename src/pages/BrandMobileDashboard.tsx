import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Briefcase,
  ChevronRight,
  CreditCard,
  Handshake,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Mail,
  Zap,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { toast } from 'sonner';

type BrandTab = 'dashboard' | 'collabs' | 'creators' | 'profile';

type BrandDashboardStats = {
  totalSent: number;
  needsAction: number;
  activeDeals: number;
  totalInvestment: number;
};

type BrandMobileDashboardProps = {
  profile?: any;
  requests?: any[];
  deals?: any[];
  stats?: BrandDashboardStats;
  initialTab?: BrandTab;
  isLoading?: boolean;
  isDemoBrand?: boolean;
  onRefresh?: () => Promise<void>;
  onLogout?: () => void | Promise<void>;
};

const formatCompactINR = (n: any) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
};

const uniqBy = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
};

const startOfLocalMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const sameLocalMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const normalizeStatus = (status: any) => String(status || '').trim().toLowerCase();

const firstNameish = (profile: any) => {
  const label = profile?.business_name || profile?.first_name || profile?.username || 'Creator';
  return String(label || 'Creator').trim() || 'Creator';
};

const BrandMobileDashboard = ({
  profile,
  requests = [],
  deals = [],
  stats,
  initialTab = 'dashboard',
  isLoading = false,
  onRefresh,
  onLogout,
  isDemoBrand = false,
}: BrandMobileDashboardProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as BrandTab) || (searchParams.get('subtab') as BrandTab) || initialTab;

  const setActiveTab = (tab: BrandTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      triggerHaptic(HapticPatterns.light);
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('light');
    };
  }, [theme]);

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const secondaryTextColor = isDark ? 'text-white/50' : 'text-slate-500';
  const bgColor = isDark ? 'bg-[#061318]' : 'bg-white';
  const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
  const cardBgColor = isDark ? 'bg-white/5' : 'bg-white';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showQuickSend, setShowQuickSend] = useState(false);
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
  const [quickSendEmail, setQuickSendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localOffers, setLocalOffers] = useState<any[]>([]);

  const brandName = useMemo(() => {
    const name = profile?.business_name || profile?.first_name || profile?.full_name || (isDemoBrand ? 'Acme Corp' : 'Brand');
    return String(name || 'Brand').trim() || 'Brand';
  }, [profile, isDemoBrand]);

  const brandLogo = useMemo(() => {
    const src = profile?.avatar_url || profile?.logo_url;
    if (src) return src;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=10B981&color=fff`;
  }, [profile, brandName]);

  const displayStats: BrandDashboardStats = useMemo(() => {
    return {
      totalSent: stats?.totalSent ?? 0,
      needsAction: stats?.needsAction ?? 0,
      activeDeals: stats?.activeDeals ?? 0,
      totalInvestment: stats?.totalInvestment ?? 0,
    };
  }, [stats]);

  const spendThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = startOfLocalMonth(now);
    return (deals || []).reduce((acc: number, d: any) => {
      const createdAt = d?.created_at ? new Date(d.created_at) : null;
      const amount = Number(d?.deal_amount) || 0;
      if (!createdAt || !(amount > 0)) return acc;
      if (createdAt >= monthStart && sameLocalMonth(createdAt, now)) return acc + amount;
      return acc;
    }, 0);
  }, [deals]);

  const creatorReplies = useMemo(() => {
    // "Reply" for a brand generally means offer moved beyond "pending".
    return (requests || []).filter((r: any) => {
      const s = normalizeStatus(r?.status);
      if (!s) return false;
      return s !== 'pending';
    }).length;
  }, [requests]);

  const creatorFeed = useMemo(() => {
    const fromReqs = (requests || []).map((r: any) => ({
      id: String(r?.creator_id || r?.profiles?.id || ''),
      name: firstNameish(r?.profiles),
      username: r?.profiles?.username || '',
      avatar_url: r?.profiles?.avatar_url || '',
      status: String(r?.status || ''),
      href: `/deal-details/${r.id}`,
    }));
    const fromDeals = (deals || []).map((d: any) => ({
      id: String(d?.creator_id || d?.profiles?.id || ''),
      name: firstNameish(d?.profiles),
      username: d?.profiles?.username || '',
      avatar_url: d?.profiles?.avatar_url || '',
      status: String(d?.status || ''),
      href: `/deal-details/${d.id}`,
    }));
    return uniqBy([...fromReqs, ...fromDeals].filter((c) => c.id), (c) => c.id).slice(0, 12);
  }, [requests, deals]);

  const suggestedCreators = useMemo(
    () => [
      { id: 's-1', name: 'Priya Sharma', niche: 'Fashion', followers: 120_000, avgViews: 45_000, rate: 8000, avatar: 'https://i.pravatar.cc/150?img=32' },
      { id: 's-2', name: 'Arjun Mehta', niche: 'Tech', followers: 86_000, avgViews: 28_000, rate: 6500, avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 's-3', name: 'Neha Verma', niche: 'Lifestyle', followers: 64_000, avgViews: 22_000, rate: 5500, avatar: 'https://i.pravatar.cc/150?img=47' },
    ],
    []
  );

  const offers = useMemo(() => {
    const base = (requests || []) as any[];
    return [...localOffers, ...base];
  }, [requests, localOffers]);

  const handleQuickSend = async () => {
    if (!quickSendEmail.trim() || !quickSendEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsSending(true);
    triggerHaptic(HapticPatterns.light);

    // Artificial delay for premium feel
    await new Promise(r => setTimeout(r, 1500));

    const newOffer = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      exact_budget: 12000,
      brand_name: brandName,
      profiles: { 
        username: quickSendEmail.split('@')[0], 
        first_name: quickSendEmail.split('@')[0], 
        last_name: '',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(quickSendEmail)}&background=random`
      }
    };

    setLocalOffers([newOffer, ...localOffers]);
    toast.success('Offer Sent Successfully!', {
      description: `Campaign brief sent to ${quickSendEmail}`,
      icon: <Zap className="w-4 h-4 text-emerald-500" />
    });
    
    setIsSending(false);
    setShowQuickSend(false);
    setQuickSendEmail('');
    triggerHaptic(HapticPatterns.success);
  };
  // Pending offers = requests that haven't been accepted/declined yet
  const pendingOffersList = useMemo(() => {
    return offers.filter((o: any) => {
      const s = normalizeStatus(o?.status);
      return s === 'pending' || s === 'countered';
    });
  }, [offers]);

  const activeDealsList = useMemo(() => {
    // Include brand_deals that are active (not cancelled/completed)
    const fromDeals = (deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return true;
      if (s.includes('cancel')) return false;
      if (s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid')) return false;
      return true;
    });
    // Also include collab_requests accepted by creator (these are active collabs)
    const fromAcceptedRequests = (requests || []).filter((r: any) => {
      const s = normalizeStatus(r?.status);
      return s === 'accepted';
    });
    // Merge: prefer brand_deals entry if we have one for same creator
    const dealCreatorIds = new Set(fromDeals.map((d: any) => String(d.creator_id || '')).filter(Boolean));
    const acceptedNotInDeals = fromAcceptedRequests.filter((r: any) => !dealCreatorIds.has(String(r.creator_id || '')));
    return [...fromDeals, ...acceptedNotInDeals] as any[];
  }, [deals, requests]);

  const completedDealsList = useMemo(() => {
    return (deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return false;
      return s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid');
    }) as any[];
  }, [deals]);

  const notifications = useMemo(
    () =>
      [
        displayStats.needsAction > 0
          ? {
              id: 'n-action',
              title: `${displayStats.needsAction} offer${displayStats.needsAction === 1 ? '' : 's'} need your reply`,
              time: 'Today',
              href: '/brand-dashboard?tab=collabs',
            }
          : null,
        displayStats.totalSent > 0
          ? { id: 'n-sent', title: 'Offers sent this week', time: 'This week', href: '/brand-dashboard?tab=collabs' }
          : null,
      ].filter(Boolean) as any[],
    [displayStats.needsAction, displayStats.totalSent]
  );

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isBusy: isPushBusy,
    promptDismissed: isPushPromptDismissed,
    isIOSNeedsInstall,
    hasVapidKey,
    enableNotifications,
    dismissPrompt: dismissPushPrompt,
    sendTestPush,
    refreshStatus: refreshPushStatus,
  } = useDealAlertNotifications();

  const handleEnablePush = async () => {
    try {
      const result = await enableNotifications();
      if (result?.success) {
        toast.success('Notifications enabled');
      } else {
        const reason = result?.reason || 'unknown';
        if (reason === 'missing_vapid_key') toast.error('Notifications not configured yet');
        else if (reason === 'denied') toast.error('Notifications blocked in browser settings');
        else toast.error('Failed to enable notifications');
      }
    } catch {
      toast.error('Failed to enable notifications');
    }
  };

  const PageHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 px-5 py-4 mb-4">
      <button
        onClick={() => {
          triggerHaptic(HapticPatterns.light);
          setActiveSettingsPage(null);
        }}
        className={cn('p-2 -ml-2 rounded-full transition-all active:scale-90', secondaryTextColor, isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')}
      >
        <ChevronRight className="w-6 h-6 rotate-180" />
      </button>
      <h2 className={cn('text-[20px] font-bold tracking-tight', textColor)}>{title}</h2>
    </div>
  );

  const renderNotificationSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="pb-20"
    >
      <PageHeader title="Notifications" />
      <div className="px-5 space-y-6">
        <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#1C1C1E] divide-[#2C2C2E]' : 'bg-white divide-[#E5E5EA] shadow-sm', 'divide-y')}>
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/15 text-blue-700')}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Push Alerts</p>
                <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isPushSubscribed ? 'Active on this device' : 'Receive deal updates'}</p>
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (isPushSubscribed) {
                  toast.info('To disable, please use your browser settings.');
                } else {
                  await handleEnablePush();
                }
              }}
              className={cn(
                'w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out',
                isPushSubscribed ? 'bg-emerald-500' : isDark ? 'bg-[#39393D]' : 'bg-[#E9E9EB]'
              )}
            >
              <motion.div
                animate={{ x: isPushSubscribed ? 22 : 2 }}
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          {isPushSubscribed && (
            <button
              disabled={isPushBusy}
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                const res = await sendTestPush();
                if (res.success) toast.success('Test notification sent!');
                else toast.error('Failed: ' + res.reason);
              }}
              className={cn('w-full py-4 text-[13px] font-bold text-center transition-all active:bg-opacity-50', isDark ? 'text-sky-400 active:bg-white/5' : 'text-sky-600 active:bg-slate-50')}
            >
              {isPushBusy ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}
        </div>

        <div className={cn('p-5 rounded-[24px] border', borderColor, isDark ? 'bg-white/5' : 'bg-white shadow-sm')}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-40 mb-1', textColor)}>Current Status</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <p className={cn('text-[12px]', textColor)}>
                  <span className="opacity-50">Supported:</span> {isPushSupported ? 'Yes' : 'No'}
                </p>
                <p className={cn('text-[12px]', textColor)}>
                  <span className="opacity-50">Permission:</span> {pushPermission}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                await refreshPushStatus();
                toast.success('Status refreshed');
              }}
              className={cn('p-2 rounded-xl border transition-all active:scale-95', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')}
            >
              <RefreshCw className={cn('w-4 h-4 opacity-60', textColor)} />
            </button>
          </div>
          {isIOSNeedsInstall && (
            <p className={cn('text-[12px] opacity-60', isDark ? 'text-amber-200/80' : 'text-amber-700')}>
              iOS requires “Add to Home Screen” to support push notifications.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const showPushPrompt =
    isPushSupported &&
    hasVapidKey &&
    !isPushSubscribed &&
    !isPushPromptDismissed &&
    activeTab === 'dashboard' &&
    !activeSettingsPage;

  return (
    <div className={cn('fixed inset-0 font-sans selection:bg-emerald-500/25 overflow-hidden', bgColor, textColor)}>
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
          <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-emerald-400/20 rounded-full blur-[140px]" />
          <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-sky-500/18 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-emerald-500/12 rounded-full blur-[170px]" />
        </div>
      )}

      {!isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(55%_45%_at_95%_10%,rgba(14,165,233,0.16),transparent_60%)]" />
        </div>
      )}

      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-[60]"
        style={{ transform: `translateY(${pullDistance - 44}px)`, opacity: pullDistance > 10 ? 1 : 0 }}
      >
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg border', isDark ? 'bg-[#0B0F14]/90 border-white/10' : 'bg-white/90 border-slate-200')}>
          {isRefreshing ? <Loader2 className={cn('w-5 h-5 animate-spin', isDark ? 'text-white/60' : 'text-slate-500')} /> : <div className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-emerald-400/70' : 'bg-emerald-600/70')} />}
        </div>
      </div>

      <div
        className="h-full overflow-y-auto overflow-x-hidden relative z-10 pb-[110px] scrollbar-hide"
        onTouchStart={(e) => {
          if (isRefreshing) return;
          const target = e.currentTarget as HTMLDivElement;
          if (target.scrollTop > 0) return;
          if (e.touches.length !== 1) return;
          setStartY(e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (isRefreshing) return;
          const target = e.currentTarget as HTMLDivElement;
          if (target.scrollTop > 0) return;
          if (startY <= 0) return;
          const dy = e.touches[0].clientY - startY;
          if (dy <= 0) return;
          setPullDistance(Math.min(90, dy));
        }}
        onTouchEnd={async () => {
          if (isRefreshing) return;
          const shouldRefresh = pullDistance > 60;
          setStartY(0);
          setPullDistance(0);
          if (!shouldRefresh || !onRefresh) return;

          setIsRefreshing(true);
          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
          }
        }}
        onScroll={(e) => {
          if ((e.currentTarget as HTMLDivElement).scrollTop > 10 && pullDistance > 0) {
            setPullDistance(0);
            setStartY(0);
          }
        }}
      >
        <div className="max-w-md md:max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setShowActionSheet(true);
                  }}
                  className={cn('p-1.5 -ml-1.5 rounded-full transition-all active:scale-95', secondaryTextColor)}
                >
                  <Menu className="w-6 h-6" strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-1.5 font-semibold text-[16px] tracking-tight">
                  <Shield className={cn('w-4 h-4', isDark ? 'text-white' : 'text-slate-900')} />
                  <span className={textColor}>Brand Console</span>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                    }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all duration-300',
                      isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isDark ? (
                        <motion.span
                          key="moon"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Moon className="w-3.5 h-3.5" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="sun"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="text-[10px] font-bold tracking-wide">{isDark ? 'Dark' : 'Light'}</span>
                  </motion.button>

                  <div className="relative">
                    <button
                      onClick={() => setNotificationsOpen((v) => !v)}
                      className={cn('relative p-1 rounded-full transition-all active:scale-95', secondaryTextColor)}
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 text-[8px] font-black flex items-center justify-center text-white"
                          style={{ borderColor: isDark ? '#0B0F14' : '#F9FAFB' }}
                        >
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    {notificationsOpen && (
                      <div
                        className={cn(
                          'absolute right-0 mt-3 w-[300px] max-w-[calc(100vw-32px)] rounded-[24px] border shadow-2xl p-4 z-50 overflow-hidden',
                          isDark
                            ? 'bg-[#0A0A0B]/95 backdrop-blur-xl border-white/10 text-white'
                            : 'bg-white/95 backdrop-blur-xl border-slate-200/60 text-slate-900'
                        )}
                      >
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className={cn('text-[11px] font-black uppercase tracking-[0.2em]', isDark ? 'text-white/40' : 'text-slate-500')}>
                            Updates
                          </p>
                          <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', isDark ? 'bg-emerald-400' : 'bg-emerald-600')} />
                        </div>
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                          {notifications.map((n: any) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                setNotificationsOpen(false);
                                if (n.href) navigate(n.href);
                              }}
                              className={cn(
                                'w-full text-left p-3 rounded-2xl border transition-all active:scale-[0.98]',
                                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              )}
                            >
                              <p className={cn('text-[13px] font-bold leading-tight', textColor)}>{n.title}</p>
                              <p className={cn('text-[11px] mt-1 opacity-50', textColor)}>{n.time}</p>
                            </button>
                          ))}
                          {notifications.length === 0 && (
                            <div className={cn('p-6 text-center rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')}>
                              <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No updates yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setActiveTab('profile');
                    }}
                    className={cn('w-9 h-9 rounded-full border overflow-hidden transition-all active:scale-95', borderColor)}
                  >
                    <img alt={brandName} src={brandLogo} className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn('text-[13px] font-black uppercase tracking-[0.2em] opacity-40', textColor)}>Dashboard</p>
                  <h1 className={cn('text-[28px] font-semibold tracking-tight leading-tight', textColor)}>{brandName}</h1>
                  <p className={cn('text-[13px] mt-1 opacity-60', textColor)}>
                    Track offers, manage creators, and close collaborations.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5">
              {activeTab === 'dashboard' && (
                <>
                  {showPushPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'mb-5 p-4 rounded-[24px] border shadow-sm',
                        isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-emerald-500/15' : 'bg-emerald-500/10')}>
                          <Bell className={cn('w-5 h-5', isDark ? 'text-emerald-200' : 'text-emerald-700')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[13px] font-bold', textColor)}>Enable deal alerts</p>
                          <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>
                            {isIOSNeedsInstall
                              ? 'On iPhone/iPad, install the app (Add to Home Screen) to receive notifications.'
                              : 'Get notified when creators reply and deals need action.'}
                          </p>
                          {pushPermission === 'denied' && (
                            <p className={cn('text-[12px] mt-2', isDark ? 'text-amber-200/80' : 'text-amber-700')}>
                              Notifications are blocked in your browser settings.
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              disabled={isPushBusy || pushPermission === 'denied' || isIOSNeedsInstall}
                              onClick={handleEnablePush}
                              className={cn(
                                'flex-1 h-10 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.99]',
                                isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              )}
                            >
                              Enable
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissPushPrompt()}
                              className={cn(
                                'h-10 px-4 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.99]',
                                isDark ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              )}
                            >
                              Later
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick summary (makes the dashboard feel alive immediately) */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cn('grid grid-cols-3 gap-2.5 mb-6')}>
                    {[
                      { label: 'Active deals', value: displayStats.activeDeals },
                      { label: 'Spend this month', value: formatCompactINR(spendThisMonth) },
                      { label: 'Creator replies', value: creatorReplies },
                    ].map((item) => (
                      <div key={item.label} className={cn('p-3 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                        <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>{item.label}</p>
                        {isLoading ? (
                          <div className={cn('h-4 rounded-md mt-2 animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                        ) : (
                          <p className={cn('text-[14px] sm:text-[16px] font-bold mt-1', textColor)}>{item.value}</p>
                        )}
                      </div>
                    ))}
                  </motion.div>

                  {/* Stats grouped for scan speed */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="col-span-2">
                      <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Campaign activity</p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Send className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Offers sent</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-8 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.totalSent}</p>
                      )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <MessageCircle className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Needs reply</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-8 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.needsAction}</p>
                      )}
                    </motion.div>

                    <div className="col-span-2 mt-4">
                      <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Performance</p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Handshake className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Active collabs</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-8 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.activeDeals}</p>
                      )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <CreditCard className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Total spend</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-7 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[20px] sm:text-[24px] font-semibold tracking-tight', textColor)}>{formatCompactINR(displayStats.totalInvestment)}</p>
                      )}
                    </motion.div>
                  </div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn('p-6 rounded-[2.5rem] border relative overflow-hidden mb-10', isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                      <Plus size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/12 flex items-center justify-center">
                        <Plus className={cn('w-5 h-5', isDark ? 'text-emerald-300' : 'text-emerald-600')} />
                      </div>
                      <div>
                        <h3 className={cn('text-[15px] font-bold tracking-tight', textColor)}>Quick actions</h3>
                        <p className={cn('text-[11px] opacity-40 uppercase font-black tracking-widest', textColor)}>Shortcuts</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <User className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Find creators</span>
                      </button>
                      <button
                        onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }}
                        className={cn(
                          'flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]',
                          isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-emerald-300/30 hover:from-emerald-400 hover:to-sky-400 text-white shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-emerald-600/40 hover:from-emerald-500 hover:to-sky-500 text-white shadow-lg'
                        )}
                      >
                        <Send className="w-4 h-4 mb-2 opacity-90" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Send offer</span>
                      </button>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <Handshake className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Collabs</span>
                      </button>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('profile'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <Settings className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Settings</span>
                      </button>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Collaborations</h2>
                      </div>
                      <button onClick={() => setActiveTab('collabs')} className={cn('text-[12px] font-bold', isDark ? 'text-sky-300' : 'text-sky-700')}>
                        View all
                      </button>
                    </div>
                    <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#0B0F14]/40' : 'bg-white')}>
                      <div className={cn('p-4 flex items-center justify-between', isDark ? 'border-b border-white/10' : 'border-b border-slate-200')}>
                        <p className={cn('text-[12px] font-bold', textColor)}>Pending</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{offers.length}</p>
                      </div>
                      <div className={cn('p-4 flex items-center justify-between', isDark ? 'border-b border-white/10' : 'border-b border-slate-200')}>
                        <p className={cn('text-[12px] font-bold', textColor)}>Active</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{activeDealsList.length}</p>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <p className={cn('text-[12px] font-bold', textColor)}>Completed</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{completedDealsList.length}</p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {activeTab === 'collabs' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Collaborations</h2>
                    <button onClick={() => setActiveTab('dashboard')} className={cn('text-[12px] font-bold', isDark ? 'text-sky-300' : 'text-sky-700')}>
                      Back
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Pending', count: offers.length },
                      { label: 'Active', count: activeDealsList.length },
                      { label: 'Completed', count: completedDealsList.length },
                    ].map((p) => (
                      <div key={p.label} className={cn('p-3 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                        <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>{p.label}</p>
                        <p className={cn('text-[14px] font-bold mt-1', textColor)}>{p.count}</p>
                      </div>
                    ))}
                  </div>

                  <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#0B0F14]/40' : 'bg-white')}>
                    <div className={cn('p-4', isDark ? 'border-b border-white/10' : 'border-b border-slate-200')}>
                      <p className={cn('text-[12px] font-black uppercase tracking-widest opacity-50', textColor)}>Pending Offers</p>
                    </div>
                    {pendingOffersList.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No pending offers</p>
                        <Button type="button" onClick={() => setShowActionSheet(true)} className={cn('mt-4 rounded-2xl', isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}>
                          <Send className="w-4 h-4 mr-2" /> Send new offer
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                        {pendingOffersList.slice(0, 20).map((o: any) => (
                          <button
                            key={o.id}
                            onClick={() => navigate(`/deal-details/${o.id}`)}
                            className={cn('w-full flex items-center gap-3 p-4 transition-all active:scale-[0.99]', isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}
                          >
                            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                              <Send className={cn('w-4 h-4', secondaryTextColor)} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>
                                Offer to {firstNameish(o?.profiles)}
                              </p>
                              <p className={cn('text-[12px] opacity-50 truncate', textColor)}>{o?.collab_type || 'Collaboration'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {o?.status && (
                                <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/60 bg-white/5' : 'border-slate-200 text-slate-600 bg-white')}>
                                  {String(o.status)}
                                </span>
                              )}
                              <ChevronRight className={cn('w-4 h-4 opacity-30', textColor)} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-4" />

                  <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#0B0F14]/40' : 'bg-white')}>
                    <div className={cn('p-4', isDark ? 'border-b border-white/10' : 'border-b border-slate-200')}>
                      <p className={cn('text-[12px] font-black uppercase tracking-widest opacity-50', textColor)}>Active Collabs</p>
                    </div>
                    {activeDealsList.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No active collabs yet</p>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                        {activeDealsList.slice(0, 12).map((d: any) => (
                          <button
                            key={d.id}
                            onClick={() => navigate(`/deal-details/${d.id}`)}
                            className={cn('w-full flex items-center gap-3 p-4 transition-all active:scale-[0.99]', isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}
                          >
                            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                              <Handshake className={cn('w-4 h-4', secondaryTextColor)} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{firstNameish(d?.profiles)}</p>
                              <p className={cn('text-[12px] opacity-50 truncate', textColor)}>{d?.status || 'Active'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={cn('text-[12px] font-bold', textColor)}>{formatCompactINR(d?.deal_amount || 0)}</p>
                              <ChevronRight className={cn('w-4 h-4 opacity-30', textColor)} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-4" />

                  <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#0B0F14]/40' : 'bg-white')}>
                    <div className={cn('p-4', isDark ? 'border-b border-white/10' : 'border-b border-slate-200')}>
                      <p className={cn('text-[12px] font-black uppercase tracking-widest opacity-50', textColor)}>Completed Collabs</p>
                    </div>
                    {completedDealsList.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No completed collabs yet</p>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                        {completedDealsList.slice(0, 12).map((d: any) => (
                          <div key={d.id} className={cn('w-full flex items-center gap-3 p-4 transition-all', isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}>
                            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', isDark ? 'border-white/10 bg-white/5 text-emerald-400' : 'border-slate-200 bg-slate-50 text-emerald-600')}>
                              <Shield className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{firstNameish(d?.profiles)}</p>
                              <p className={cn('text-[12px] opacity-50 truncate', textColor)}>Completed</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={cn('text-[12px] font-black text-emerald-500')}>{formatCompactINR(d?.deal_amount || 0)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'creators' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Creators</h2>
                    <button onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('text-[12px] font-bold', isDark ? 'text-sky-300' : 'text-sky-700')}>
                      Browse
                    </button>
                  </div>

                  {/* Discovery cards (makes the platform feel real immediately) */}
                  <div className="mb-5">
                    <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Suggested</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {suggestedCreators.map((c) => (
                        <div key={c.id} className={cn('min-w-[260px] p-4 rounded-[24px] border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={c.avatar} alt={c.name} />
                              <AvatarFallback>{c.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] opacity-50 truncate', textColor)}>
                                {c.followers.toLocaleString('en-IN')} followers • {c.niche}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className={cn('p-3 rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                              <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Avg views</p>
                              <p className={cn('text-[12px] font-bold mt-1', textColor)}>{c.avgViews.toLocaleString('en-IN')}</p>
                            </div>
                            <div className={cn('p-3 rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                              <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Rate</p>
                              <p className={cn('text-[12px] font-bold mt-1', textColor)}>{formatCompactINR(c.rate)} / reel</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }}
                              className={cn('flex-1 py-2.5 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.98]', isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900')}
                            >
                              View profile
                            </button>
                            <button
                              onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }}
                              className={cn('flex-1 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-[0.98]', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white' : 'bg-gradient-to-br from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white')}
                            >
                              Send offer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#0B0F14]/40' : 'bg-white')}>
                    {creatorFeed.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[13px] font-bold', textColor)}>Find creators to collaborate with.</p>
                        <p className={cn('text-[12px] opacity-60 mt-2', textColor)}>Browse our creator database and send your first offer.</p>
                        <div className="flex flex-col gap-2 mt-5">
                          <Button type="button" onClick={() => navigate('/creators')} className={cn('rounded-2xl', isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}>
                            <User className="w-4 h-4 mr-2" /> Browse creators
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => toast.message('Import creator link', { description: 'Coming soon.' })}
                            className={cn('rounded-2xl', isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50')}
                          >
                            Import creator link
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                        {creatorFeed.map((c) => (
                          <button key={c.id} onClick={() => c.href && navigate(c.href)} className={cn('w-full flex items-center gap-3 p-4 transition-all active:scale-[0.99]', isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={c.avatar_url} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] opacity-50 truncate', textColor)}>{c.username ? `@${c.username}` : 'Creator'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.status && (
                                <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/60 bg-white/5' : 'border-slate-200 text-slate-600 bg-white')}>
                                  {c.status}
                                </span>
                              )}
                              <ChevronRight className={cn('w-4 h-4 opacity-30', textColor)} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}


              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={brandLogo} alt={brandName} />
                      <AvatarFallback>{brandName.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={cn('text-[18px] font-bold truncate', textColor)}>{brandName}</p>
                      <p className={cn('text-[12px] opacity-50 truncate', textColor)}>Brand account</p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeSettingsPage === 'notifications' ? (
                      renderNotificationSettings()
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#1C1C1E] divide-[#2C2C2E]' : 'bg-white divide-[#E5E5EA] shadow-sm', 'divide-y')}>
                          <button onClick={() => navigate('/brand-settings')} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/15 text-emerald-700')}>
                              <Settings className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Brand settings</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Profile, website, and preferences</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => toast.message('Billing', { description: 'Coming soon.' })} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-500/15 text-indigo-700')}>
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Billing</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Invoices and payment methods</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => toast.message('Team members', { description: 'Coming soon.' })} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-500/15 text-sky-700')}>
                              <Users className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Team members</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Invite teammates and roles</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => { triggerHaptic(HapticPatterns.light); setTheme((t) => (t === 'dark' ? 'light' : 'dark')); }} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/15 text-amber-700')}>
                              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Theme</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isDark ? 'Dark' : 'Light'}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => setActiveSettingsPage('notifications')} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/15 text-blue-700')}>
                              <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Notifications</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isPushSubscribed ? 'Enabled' : isPushSupported ? 'Setup push alerts' : 'Not supported'}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => onLogout?.()} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-500/15 text-red-700')}>
                              <LogOut className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Logout</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Sign out of this brand account</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className={cn('fixed bottom-0 inset-x-0 border-t z-50 transition-all duration-500', isDark ? 'border-[#1F2937] bg-[#0B0F14]/90' : 'border-slate-200 bg-white/90')} style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 py-3 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('dashboard'); }} className="flex flex-col items-center gap-1 w-14">
            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Home</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} className="flex flex-col items-center gap-1 w-14 relative">
            <User className={cn('w-[22px] h-[22px]', activeTab === 'creators' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'creators' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Creators</span>
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }} className="relative flex flex-col items-center -mt-8">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center transition-all hover:brightness-110', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-4 border-[#061318] text-white shadow-[0_4px_30px_rgba(16,185,129,0.28)] hover:shadow-[0_6px_40px_rgba(14,165,233,0.20)] ring-1 ring-emerald-300/30' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-4 border-white text-white shadow-lg hover:shadow-xl ring-1 ring-slate-200')}>
              <Plus className="w-7 h-7" />
            </div>
            <span className={cn('text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap', isDark ? 'text-slate-400' : 'text-slate-600')}>Create</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} className="flex flex-col items-center gap-1 w-14">
            <Handshake className={cn('w-[22px] h-[22px]', activeTab === 'collabs' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'collabs' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Collabs</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('profile'); }} className="flex flex-col items-center gap-1 w-14">
            <Settings className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'profile' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Account</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showActionSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowActionSheet(false)} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn('fixed bottom-0 inset-x-0 z-[110] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl', isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200')}
            >
              <div className="w-12 h-1 bg-slate-500/20 rounded-full mx-auto mb-6" />
              <div className="max-w-md mx-auto">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Start a collaboration</h2>
                    <p className={cn('text-[13px] mt-1 opacity-60', isDark ? 'text-white' : 'text-slate-900')}>Send an offer, then track it end-to-end.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => { setShowActionSheet(false); setShowQuickSend(true); }}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all active:scale-[0.99]',
                      isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-emerald-300/30 hover:from-emerald-400 hover:to-sky-400 text-white shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-emerald-600/40 hover:from-emerald-500 hover:to-sky-500 text-white shadow-lg'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-white/10' : 'bg-white/10')}>
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-black uppercase tracking-widest">Send new offer</p>
                        <p className="text-[12px] opacity-75 mt-1">Draft, negotiate, and lock terms</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => { setShowActionSheet(false); navigate('/creators'); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Browse creators</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Search and shortlist profiles</p>
                  </button>

                  <button onClick={() => { setShowActionSheet(false); toast.message('Import creator profile', { description: 'Coming soon.' }); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Import creator profile</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Paste a link to add quickly</p>
                  </button>

                  <div className="pt-2">
                    <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Notifications</p>
                  </div>
                  {!isPushSubscribed && isPushSupported && (
                    <button
                      disabled={isPushBusy}
                      onClick={async () => {
                        await handleEnablePush();
                        setShowActionSheet(false);
                      }}
                      className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-50', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
                    >
                      <p className={cn('text-[13px] font-bold', textColor)}>Enable deal alerts</p>
                      <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Get notified when creators reply</p>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showQuickSend && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickSend(false)} className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn('fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-[90%] max-w-sm rounded-[2rem] border p-6 shadow-2xl', isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200')}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className={cn('text-lg font-bold', textColor)}>Quick Send Offer</h3>
                  <p className={cn('text-xs opacity-60', textColor)}>Send a protected collab link</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn('text-[11px] font-black uppercase tracking-widest mb-1.5 block opacity-50', textColor)}>Recipient Email</label>
                  <input
                    type="email"
                    placeholder="creator@email.com"
                    value={quickSendEmail}
                    onChange={(e) => setQuickSendEmail(e.target.value)}
                    className={cn('w-full h-12 px-4 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900')}
                  />
                </div>

                <div className={cn('p-4 rounded-2xl border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200')}>
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className={cn('text-[12px] font-bold', textColor)}>Auto-generated Contract</p>
                      <p className={cn('text-[11px] opacity-60 mt-0.5', textColor)}>We'll generate a secure agreement automatically when they accept.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowQuickSend(false)}
                    className={cn('flex-1 h-12 rounded-xl font-bold text-sm', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuickSend}
                    disabled={isSending}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Offer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandMobileDashboard;
