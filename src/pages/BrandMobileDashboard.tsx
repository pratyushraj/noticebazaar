import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { toast } from 'sonner';

type BrandTab = 'dashboard' | 'creators' | 'analytics' | 'profile';

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

const BrandMobileDashboard = ({
  profile,
  requests = [],
  deals = [],
  stats,
  initialTab = 'dashboard',
  onLogout,
}: BrandMobileDashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BrandTab>(initialTab);

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
  const bgColor = isDark ? 'bg-black' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
  const cardBgColor = isDark ? 'bg-white/5' : 'bg-white';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const brandName = useMemo(() => {
    const name = profile?.business_name || profile?.first_name || profile?.full_name || 'Brand';
    return String(name || 'Brand').trim() || 'Brand';
  }, [profile]);

  const brandLogo = useMemo(() => {
    const src = profile?.avatar_url || profile?.logo_url;
    if (src) return src;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=0D8ABC&color=fff`;
  }, [profile, brandName]);

  const displayStats: BrandDashboardStats = useMemo(() => {
    return {
      totalSent: stats?.totalSent ?? 0,
      needsAction: stats?.needsAction ?? 0,
      activeDeals: stats?.activeDeals ?? 0,
      totalInvestment: stats?.totalInvestment ?? 0,
    };
  }, [stats]);

  const creatorFeed = useMemo(() => {
    const fromReqs = (requests || []).map((r: any) => ({
      id: String(r?.creator_id || r?.profiles?.id || ''),
      name: r?.profiles?.business_name || r?.profiles?.first_name || r?.profiles?.username || 'Creator',
      username: r?.profiles?.username || '',
      avatar_url: r?.profiles?.avatar_url || '',
      status: String(r?.status || ''),
      href: '/brand-console-demo',
    }));
    const fromDeals = (deals || []).map((d: any) => ({
      id: String(d?.creator_id || d?.profiles?.id || ''),
      name: d?.profiles?.business_name || d?.profiles?.first_name || d?.profiles?.username || 'Creator',
      username: d?.profiles?.username || '',
      avatar_url: d?.profiles?.avatar_url || '',
      status: String(d?.status || ''),
      href: '/brand-console-demo',
    }));
    return uniqBy([...fromReqs, ...fromDeals].filter((c) => c.id), (c) => c.id).slice(0, 12);
  }, [requests, deals]);

  const notifications = useMemo(
    () =>
      [
        displayStats.needsAction > 0
          ? {
              id: 'n-action',
              title: `${displayStats.needsAction} offer${displayStats.needsAction === 1 ? '' : 's'} need your reply`,
              time: 'Today',
              href: '/brand-console-demo',
            }
          : null,
        displayStats.totalSent > 0
          ? { id: 'n-sent', title: 'Offers sent this week', time: 'This week', href: '/brand-console-demo' }
          : null,
      ].filter(Boolean) as any[],
    [displayStats.needsAction, displayStats.totalSent]
  );

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isBusy: isPushBusy,
    enableNotifications,
  } = useDealAlertNotifications();

  const handleEnablePush = async () => {
    try {
      await enableNotifications();
      toast.success('Notifications enabled');
    } catch {
      toast.error('Failed to enable notifications');
    }
  };

  return (
    <div className={cn('fixed inset-0 font-sans selection:bg-blue-500/30 overflow-hidden', bgColor, textColor)}>
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>
      )}

      <div className="h-full overflow-y-auto overflow-x-hidden relative z-10 pb-[110px] scrollbar-hide">
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
                          <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', isDark ? 'bg-blue-500' : 'bg-blue-600')} />
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
                <Button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.success);
                    setShowActionSheet(true);
                  }}
                  className={cn(
                    'h-11 px-5 rounded-2xl font-black uppercase tracking-[0.16em] text-[10px] border shadow-xl transition-all hover:scale-105 active:scale-95',
                    isDark ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Offer
                </Button>
              </div>
            </div>

            <div className="px-5">
              {activeTab === 'dashboard' && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Offers Sent</p>
                      <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.totalSent}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Needs Reply</p>
                      <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.needsAction}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Active Collabs</p>
                      <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.activeDeals}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Total Spend</p>
                      <p className={cn('text-[20px] sm:text-[24px] font-semibold tracking-tight', textColor)}>{formatCompactINR(displayStats.totalInvestment)}</p>
                    </motion.div>
                  </div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn('p-6 rounded-[2.5rem] border relative overflow-hidden mb-10', isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                      <Plus size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className={cn('text-[15px] font-bold tracking-tight', textColor)}>Fast Actions</h3>
                        <p className={cn('text-[11px] opacity-40 uppercase font-black tracking-widest', textColor)}>Shortcuts</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <User className="w-4 h-4 mb-2 opacity-70" />
                        <span className={cn('text-[11px] font-bold', textColor)}>Find Creators</span>
                      </button>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); setShowActionSheet(true); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <Plus className="w-4 h-4 mb-2 opacity-70" />
                        <span className={cn('text-[11px] font-bold', textColor)}>Send Offer</span>
                      </button>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('analytics'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <BarChart3 className="w-4 h-4 mb-2 opacity-70" />
                        <span className={cn('text-[11px] font-bold', textColor)}>Analytics</span>
                      </button>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('profile'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <Shield className="w-4 h-4 mb-2 opacity-70" />
                        <span className={cn('text-[11px] font-bold', textColor)}>Settings</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}

              {activeTab === 'creators' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Creators</h2>
                    <button onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('text-[12px] font-bold', isDark ? 'text-blue-400' : 'text-blue-600')}>
                      Browse
                    </button>
                  </div>
                  <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#0B0F14]/40' : 'bg-white')}>
                    {creatorFeed.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No creators yet</p>
                        <p className={cn('text-[12px] opacity-50 mt-1', textColor)}>Send your first offer to start your pipeline.</p>
                        <Button type="button" onClick={() => setShowActionSheet(true)} className={cn('mt-4 rounded-2xl', isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white')}>
                          <Plus className="w-4 h-4 mr-2" /> New Offer
                        </Button>
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

              {activeTab === 'analytics' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className={cn('text-[16px] font-bold tracking-tight mb-4', textColor)}>Analytics</h2>
                  <div className={cn('p-6 rounded-[24px] border', cardBgColor, borderColor)}>
                    <p className={cn('text-[12px] font-bold uppercase tracking-widest opacity-50', textColor)}>Overview</p>
                    <p className={cn('text-[13px] mt-2 opacity-60', textColor)}>Track spend, reply speed, and creator conversions. (More charts coming next.)</p>
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className={cn('p-4 rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                        <p className={cn('text-[11px] uppercase tracking-widest font-black opacity-50', textColor)}>Spend</p>
                        <p className={cn('text-[16px] font-bold mt-1', textColor)}>{formatCompactINR(displayStats.totalInvestment)}</p>
                      </div>
                      <div className={cn('p-4 rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                        <p className={cn('text-[11px] uppercase tracking-widest font-black opacity-50', textColor)}>Active</p>
                        <p className={cn('text-[16px] font-bold mt-1', textColor)}>{displayStats.activeDeals}</p>
                      </div>
                    </div>
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

                  <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#1C1C1E] divide-[#2C2C2E]' : 'bg-white divide-[#E5E5EA] shadow-sm', 'divide-y')}>
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

                    <button disabled={!isPushSupported || isPushBusy} onClick={handleEnablePush} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all disabled:opacity-50 active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/15 text-blue-700')}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Deal alerts</p>
                        <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isPushSubscribed ? 'Enabled' : isPushSupported ? 'Enable notifications' : 'Not supported'}</p>
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
            </div>
          </motion.div>
        </div>
      </div>

      <div className={cn('fixed bottom-0 inset-x-0 border-t z-50 transition-all duration-500', isDark ? 'border-[#1F2937] bg-[#0B0F14]/90' : 'border-slate-200 bg-white/90')} style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 py-3 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('dashboard'); }} className="flex flex-col items-center gap-1 w-14">
            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Dashboard</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} className="flex flex-col items-center gap-1 w-14 relative">
            <User className={cn('w-[22px] h-[22px]', activeTab === 'creators' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'creators' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Creators</span>
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }} className="relative flex flex-col items-center -mt-8">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center transition-all hover:brightness-110', isDark ? 'bg-blue-600 border-4 border-[#0B0F14] text-white shadow-[0_4px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_40px_rgba(59,130,246,0.4)] ring-1 ring-blue-400/30' : 'bg-slate-900 border-4 border-white text-white shadow-lg hover:shadow-xl ring-1 ring-slate-200')}>
              <Plus className="w-7 h-7" />
            </div>
            <span className={cn('text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap', isDark ? 'text-slate-400' : 'text-slate-600')}>+ Offer</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('analytics'); }} className="flex flex-col items-center gap-1 w-14">
            <BarChart3 className={cn('w-[22px] h-[22px]', activeTab === 'analytics' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'analytics' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Analytics</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('profile'); }} className="flex flex-col items-center gap-1 w-14">
            <Settings className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'profile' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Profile</span>
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
                    <h2 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Offer Hub</h2>
                    <p className={cn('text-[13px] mt-1 opacity-60', isDark ? 'text-white' : 'text-slate-900')}>Start a new collaboration in seconds.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => { setShowActionSheet(false); navigate('/creators'); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Browse creators</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Search and shortlist profiles</p>
                  </button>
                  <button onClick={() => { setShowActionSheet(false); navigate('/brand-console-demo'); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Send an offer</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Draft, negotiate, and lock terms</p>
                  </button>

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
    </div>
  );
};

export default BrandMobileDashboard;
